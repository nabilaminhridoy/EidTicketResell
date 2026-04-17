import { prisma } from "./prisma";

/**
 * Ensures the risk profile exists for the user.
 */
async function getOrCreateRiskProfile(userId: string) {
   let risk = await prisma.riskProfile.findUnique({ where: { userId } });
   if (!risk) {
      risk = await prisma.riskProfile.create({ data: { userId, score: 0, isQuarantined: false } });
   }
   return risk;
}

/**
 * Core engine to manually or automatically escalate risk levels and trigger Quarantine locks.
 * Dispatches SOC SecurityEvent logs natively.
 */
export async function escalateRisk(userId: string, points: number, reason: string, triggerEvent: string) {
   const profile = await getOrCreateRiskProfile(userId);
   
   if (profile.isQuarantined) return profile; // Already breached bounds.

   const newScore = profile.score + points;
   const isQuarantined = newScore >= 70;

   // 1. Update Profile
   const updated = await prisma.riskProfile.update({
      where: { userId },
      data: {
          score: newScore,
          isQuarantined,
          ...(isQuarantined && {
             quarantineReason: `Auto-Lock: Risk Score breached 70 threshold (${newScore}). Triggered by: ${reason}`,
             quarantineTime: new Date(),
             lastTriggeredEvent: triggerEvent
          })
      }
   });

   // 2. Generate Security Event for Admin SOC Panel
   await prisma.securityEvent.create({
      data: {
          type: "FRAUD_HEURISTIC_TRIGGER",
          severity: isQuarantined ? "CRITICAL" : (points >= 20 ? "HIGH" : "MEDIUM"),
          message: `User ${userId} risk score elevated by +${points}. Total: ${newScore}/100. Reason: ${reason}`,
          metadata: { triggerEvent, userTarget: userId },
          userId: userId,
      }
   });

   return updated;
}

/**
 * Algorithmic Wallet & Action Velocity Check.
 * Formula: Count(Transactions + Listings) over Rolling 15 minutes.
 * Reverts boolean: 'shouldBlock' -> True strictly if they breach CRITICAL limits during this cycle directly.
 */
export async function evaluateVelocityLimit(userId: string) {
   const rollingWindow = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago

   const [ticketCount, txCount, profile] = await Promise.all([
       prisma.ticket.count({ where: { sellerId: userId, createdAt: { gte: rollingWindow } } }),
       prisma.transaction.count({ where: { buyerId: userId, createdAt: { gte: rollingWindow } } }),
       getOrCreateRiskProfile(userId)
   ]);

   if (profile.isQuarantined) return { blocked: true, reason: "Bypass Rejected: Platform Quarantine active." };

   const totalActions = ticketCount + txCount;

   // Mathematical bounds as configured by Platform specifications:
   // 5/15: Flag (Medium) -> +10 points
   // 8/15: Escalation (High) -> +20 points 
   // 10+/15: Critical -> Instant Quarantine (100 points)

   let addedPoints = 0;
   let reason = "";
   let blocked = false;

   // NOTE: We only want to increment ONCE per specific threshold crossing so we don't spam them for action 6, 7.
   // To do this simply without Redis, we evaluate their score. 10 actions is always a block.
   if (totalActions >= 10) {
       addedPoints = 100; // Force lock
       reason = `Velocity Violation: ${totalActions} actions detected in 15 mins. Exceeds 10 absolute threshold.`;
       blocked = true;
   } else if (totalActions === 8) {
       addedPoints = 20;
       reason = `Velocity Escalation: 8 actions detected in 15 mins.`;
   } else if (totalActions === 5) {
       addedPoints = 10;
       reason = `Velocity Warning: 5 actions detected in 15 mins.`;
   }

   if (addedPoints > 0) {
      const updatedProfile = await escalateRisk(userId, addedPoints, reason, "VELOCITY_CHECK");
      if (updatedProfile.isQuarantined) blocked = true;
   }

   return { blocked, totalActions };
}

/**
 * Analyzes market value vs asking price for drastic anomalies.
 * For example, someone trying to launder tickets by selling a 2000 BDT ticket for 200 BDT.
 */
export async function evaluatePriceAnomaly(userId: string, company: string, routeFrom: string, routeTo: string, askingPrice: number) {
    const historicalTickets = await prisma.ticket.findMany({
       where: { company, routeFrom, routeTo, status: "COMPLETED" },
       select: { sellingPrice: true },
       orderBy: { createdAt: "desc" },
       take: 20
    });

    if (historicalTickets.length < 5) return { flagged: false }; // Not enough data to map heuristics

    // Calculate generic average (or median realistically)
    const sum = historicalTickets.reduce((acc, t) => acc + t.sellingPrice, 0);
    const avgPrice = sum / historicalTickets.length;

    // Is the price suspiciously low (e.g. 50% below market) or dangerously high (200% above market - scalping)
    const ratio = askingPrice / avgPrice;
    
    let flagged = false;
    if (ratio < 0.5) {
       flagged = true;
       await escalateRisk(userId, 15, `Price Dump: Attempted to list ticket at ${ratio.toFixed(2)}x standard market value.`, "PRICE_ANOMALY");
    } else if (ratio > 2.0) {
       flagged = true;
       await escalateRisk(userId, 15, `Scalping Warning: Attempted to list ticket at ${ratio.toFixed(2)}x standard market value.`, "PRICE_ANOMALY");
    }

    // We do not block price anomalies directly unless the user hits Quarantine > 70 globally.
    return { flagged, ratio };
}
