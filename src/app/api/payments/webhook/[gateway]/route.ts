import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentEngine } from "@/lib/payments";
import { invalidateCachePattern } from "@/lib/redis";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  try {
    const { gateway } = await params;
    const adapter = PaymentEngine.getAdapter(gateway);
    
    // Webhook executes verification
    const verification = await adapter.verifyWebhook(req);
    
    // Log the payload securely
    if (verification.transactionId !== 'UNKNOWN') {
      await prisma.paymentLog.create({
        data: {
           transactionId: verification.transactionId,
           gateway: gateway,
           rawPayload: verification.rawPayload || {},
           status: verification.status
        }
      });
    }

    if (!verification.isValid) {
      logger.warn({ route: `/api/payments/webhook/${gateway}`, message: "Invalid webhook signature", meta: { transactionId: verification.transactionId } });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Process Transaction Atomic Lock
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: verification.transactionId },
        include: { ticket: true }
      });

      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status === "COMPLETED") return "ALREADY_COMPLETED"; // Idempotency

      if (verification.status === "SUCCESS") {
        // 1. Update Transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
             status: "COMPLETED",
             paymentStatus: "PAID",
             paymentVerifiedAt: new Date()
          }
        });
        
        // 2. Escrow Execution (Credit Seller)
        const sellerAmount = transaction.amount - transaction.commission;
        await tx.user.update({
          where: { id: transaction.ticket.sellerId },
          data: {
             pendingBalance: { increment: sellerAmount }
          }
        });

        // 3. Optional Audit Log
        await tx.auditLog.create({
          userId: transaction.buyerId,
          action: "PAYMENT_WEBHOOK_ESCROW",
          details: { transactionId: transaction.id, sellerCreditedPending: sellerAmount, gatewayTxId: verification.gatewayTxId }
        });

        // 4. Send Notification to Seller
        await tx.notification.create({
           data: {
             userId: transaction.ticket.sellerId,
             type: "TICKET_SOLD_ESCROWED",
             title: "Ticket Purchased & Funds Escrowed",
             message: `Your ticket for ${transaction.ticket.routeTo} was purchased. Funds are securely held in escrow until delivery is complete.`,
             link: "/user/notifications" // Assuming a dashboard link
           }
        });
        
        logger.info({ route: `/api/payments/webhook/${gateway}`, message: "Webhook processed SUCCESS. Escrow loaded.", meta: { transactionId: transaction.id } });
        return "SUCCESS";
      } else {
        // Payment failed or cancelled
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED", paymentStatus: "FAILED" }
        });
        // We revert ticket status back to ACTIVE so it can be bought again
        await tx.ticket.update({
          where: { id: transaction.ticket.id },
          data: { status: "ACTIVE" }
        });
        
        // Invalidate cache because ticket is ACTIVE again
        await invalidateCachePattern('tickets:*');
        
        logger.warn({ route: `/api/payments/webhook/${gateway}`, message: "Webhook processed FAILED. Ticket reverted.", meta: { transactionId: transaction.id } });
        return "FAILED";
      }
    });

    return NextResponse.json({ success: true, state: result });
  } catch (error: any) {
    logger.error({ route: `/api/payments/webhook/gateway`, message: "Webhook execution critical logic error", meta: { error: error.message } });
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message || "Webhook Processing Error" }, { status: 500 });
  }
}
