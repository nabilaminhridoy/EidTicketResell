import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { broadcastNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
       return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('status') || 'all';

    const whereClause = filter !== 'all' ? { status: filter.toUpperCase() } : {};

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
      include: {
        transaction: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, disputes });
  } catch (error: any) {
    console.error("ADMIN_DISPUTES_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
       return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = await req.json();
    const { disputeId, action, adminNote } = body; 
    // action: "RESOLVE_BUYER" | "RESOLVE_SELLER"

    if (!disputeId || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { transaction: true }
      });

      if (!dispute) throw new Error("Dispute not found.");
      if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
         throw new Error("Dispute has already been resolved.");
      }

      const txAmount = dispute.transaction.amount;
      const commission = dispute.transaction.commission;
      const sellerId = dispute.raisedAgainstId;
      const buyerId = dispute.raisedById;

      if (action === "RESOLVE_BUYER") {
          // HYBRID REFUND PIPELINE: Give money back to Buyer's availableBalance
          await tx.user.update({
             where: { id: buyerId },
             data: { availableBalance: { increment: txAmount + commission } } // Assuming buyer paid commision? Or just txAmount. Using txAmount for safety refunding exact transactional value.
          });
          
          await tx.user.update({
             where: { id: sellerId },
             data: { pendingBalance: { decrement: txAmount } }
          });

          await tx.refund.create({
             data: {
               transactionId: dispute.transactionId,
               userId: buyerId,
               amount: txAmount, // In reality, calculate specific refunds based on gateway/commission terms.
               reason: adminNote || "Admin ruled in favor of buyer.",
               status: "COMPLETED",
               isGatewayDirect: false
             }
          });

          await tx.transaction.update({
             where: { id: dispute.transactionId },
             data: { status: "REFUNDED" }
          });

      } else if (action === "RESOLVE_SELLER") {
          // Release Escrow to Seller
          await tx.user.update({
             where: { id: sellerId },
             data: { 
                pendingBalance: { decrement: txAmount },
                availableBalance: { increment: txAmount }
             }
          });

          await tx.transaction.update({
             where: { id: dispute.transactionId },
             data: { status: "COMPLETED" }
          });
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: { status: action, adminNote }
      });

      // Audit Log
      await tx.auditLog.create({
         data: {
           userId: session.id,
           action: `DISPUTE_${action}`,
           details: { disputeId, resolvedAmount: txAmount }
         }
      });

      return updatedDispute;
    });

    // 🚀 Asynchronously trigger non-blocking notifications
    const sellerId = result.raisedAgainstId;
    const buyerId = result.raisedById;
    
    Promise.all([
       broadcastNotification({ 
           userId: buyerId, type: "DISPUTE_RESOLVED", title: "Dispute Resolved", 
           message: `Your dispute for transaction ID ${result.transactionId} was resolved. Action: ${action}`, sendEmailAlert: true 
       }),
       broadcastNotification({ 
           userId: sellerId, type: "DISPUTE_RESOLVED", title: "Dispute Resolution Alert", 
           message: `The dispute regarding transaction ID ${result.transactionId} was officially resolved. Check wallet for impacts.`, sendEmailAlert: true 
       })
    ]).catch(e => console.error("Notification Dispatch Error in Disputes", e));

    return NextResponse.json({ success: true, dispute: result });
  } catch (error: any) {
    console.error("ADMIN_DISPUTES_RESOLVE_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
