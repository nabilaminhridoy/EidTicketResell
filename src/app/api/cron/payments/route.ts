import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/redis";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    // Optional: Validate Vercel cron secret to secure endpoint
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn({ route: "/api/cron/payments", message: "Unauthorized CRON execution attempt", meta: { authHeader } });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find transactions stuck in PAYMENT_PENDING for more than 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const stuckTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PAYMENT_PENDING',
        createdAt: {
          lt: fifteenMinsAgo
        }
      },
      include: { ticket: true }
    });

    for (const transaction of stuckTransactions) {
      await prisma.$transaction(async (tx) => {
        // Mark transaction failed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED', paymentStatus: 'FAILED' }
        });
        
        // Revert ticket to ACTIVE
        await tx.ticket.update({
          where: { id: transaction.ticketId },
          data: { status: 'ACTIVE' }
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_TIMEOUT_REVERT',
            details: { transactionId: transaction.id, ticketId: transaction.ticketId }
          }
        });
      });
    }

    if (stuckTransactions.length > 0) {
      await invalidateCachePattern('tickets:*');
      logger.info({ route: "/api/cron/payments", message: "Stuck transactions cleared", meta: { count: stuckTransactions.length } });
    }

    return NextResponse.json({ success: true, count: stuckTransactions.length, message: "Cleared stuck transactions" });
  } catch (error: any) {
    logger.error({ route: "/api/cron/payments", message: "Cron exception", meta: { error: error.message } });
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message || "Cron Failed" }, { status: 500 });
  }
}
