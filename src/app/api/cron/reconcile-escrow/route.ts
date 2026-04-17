import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint is secured via an Authorization Bearer token matching a specific CRON secret
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
       return NextResponse.json({ error: "Unauthorized access to ledger sync." }, { status: 401 });
    }

    // Phase 1: Tally Pending Escrow Ledgers
    const usersWithPending = await prisma.user.aggregate({
        _sum: { pendingBalance: true }
    });
    const totalPendingWallets = usersWithPending._sum.pendingBalance || 0;

    const pendingTransactions = await prisma.transaction.aggregate({
        where: { status: { in: ["PENDING", "DISPUTED"] } },
        _sum: { amount: true }
    });
    const totalPendingTransactions = pendingTransactions._sum.amount || 0;

    // Phase 2: Compute Discrepancies
    const isEscrowBalanced = Math.abs(totalPendingWallets - totalPendingTransactions) < 0.01;

    if (!isEscrowBalanced) {
        // Critical System Alert: Ghost money exists.
        await prisma.securityEvent.create({
            data: {
                eventType: "LEDGER_IMBALANCE_DETECTED",
                severity: "CRITICAL",
                userId: "SYSTEM",
                details: {
                    totalPendingWallets,
                    totalPendingTransactions,
                    discrepancy: totalPendingWallets - totalPendingTransactions
                }
            }
        });
        
        return NextResponse.json({ 
            success: false, 
            status: "IMBALANCED",
            delta: totalPendingWallets - totalPendingTransactions 
        }, { status: 409 });
    }

    // Successfully reconciled.
    return NextResponse.json({ 
        success: true, 
        status: "BALANCED", 
        timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error("CRON_LEDGER_RECONCILE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
