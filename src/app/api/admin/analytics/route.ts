import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access Denied. Admins Only." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const windowDays = parseInt(searchParams.get("window") || "7", 10);
    
    // Bounds mapping (Midnight of Window trigger)
    const activeDateBound = new Date();
    activeDateBound.setDate(activeDateBound.getDate() - windowDays);
    activeDateBound.setHours(0, 0, 0, 0);

    // 1. FINANCIAL TREND MAP (Revenue & Escrow Traffic mapped continuously to the past X days)
    // Pulling the raw transactions occurring within bounds.
    const transactions = await prisma.transaction.findMany({
      where: {
         createdAt: { gte: activeDateBound }
      },
      select: {
         createdAt: true,
         amount: true,
         commission: true,
         status: true,
      }
    });

    // Bucket by day safely
    const revenuePipelineMap = new Map();
    // Fast Array Initialization
    for(let i=windowDays-1; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        revenuePipelineMap.set(d.toISOString().split('T')[0], { date: d.toISOString().split('T')[0], revenue: 0, escrowVolume: 0 });
    }

    transactions.forEach(t => {
        const dateKey = t.createdAt.toISOString().split('T')[0];
        if (revenuePipelineMap.has(dateKey)) {
            const bucket = revenuePipelineMap.get(dateKey);
            bucket.revenue += (t.commission || 0);
            if (t.status === 'PENDING' || t.status === 'COMPLETED') {
               bucket.escrowVolume += t.amount;
            }
        }
    });

    const revenueTrajectory = Array.from(revenuePipelineMap.values());

    // 2. TICKET STATE (Conversion Funnel Indicators)
    const ticketGroup = await prisma.ticket.groupBy({
       by: ['status'],
       _count: { _all: true }
    });
    
    // Default zero maps safely protecting array maps
    const mapTicketCount = (status: string) => ticketGroup.find(t => t.status === status)?._count._all || 0;
    const ticketFunnel = [
       { name: "Listings", count: mapTicketCount('ACTIVE') + mapTicketCount('SOLD') + mapTicketCount('COMPLETED') + mapTicketCount('DISPUTED') },
       { name: "Active Market", count: mapTicketCount('ACTIVE') },
       { name: "Locked/Sold", count: mapTicketCount('SOLD') },
       { name: "Successfully Completed", count: mapTicketCount('COMPLETED') }
    ];

    // 3. FRAUD & HEURISTIC ENGINE (Global Tracking over Quarantines)
    const fraudPoints = await prisma.riskProfile.aggregate({
       _max: { score: true },
       _sum: { score: true }
    });
    const quarantinedUsers = await prisma.riskProfile.count({ where: { isQuarantined: true } });

    // 4. DISPUTE RATIOS (Global dispute load for operation teams)
    const disputeGroup = await prisma.dispute.groupBy({
       by: ['status'],
       _count: { _all: true }
    });
    
    const resolveDisputeCount = (status: string) => disputeGroup.find(d => d.status === status)?._count._all || 0;
    const disputeRatios = [
       { name: "Under Investigation", value: resolveDisputeCount('OPEN'), fill: '#f59e0b' },
       { name: "Refunded to Buyer", value: resolveDisputeCount('RESOLVED_REFUND'), fill: '#ef4444' },
       { name: "Released to Seller", value: resolveDisputeCount('RESOLVED_RELEASE'), fill: '#10b981' }
    ];

    // Global Key Performance Indicators explicitly returned avoiding over-compute.
    const platformKpis = {
       totalActiveQuarantines: quarantinedUsers,
       totalPlatformDisputes: resolveDisputeCount('OPEN') + resolveDisputeCount('RESOLVED_REFUND') + resolveDisputeCount('RESOLVED_RELEASE'),
       topRiskScoreTracker: fraudPoints._max?.score || 0
    };

    return NextResponse.json({ 
       success: true, 
       windowDays,
       revenueTrajectory, 
       ticketFunnel,
       disputeRatios,
       platformKpis
    });

  } catch (error: any) {
    console.error("ADMIN_ANALYTICS_CRASH:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
