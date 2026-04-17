import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { evaluateVelocityLimit } from '@/lib/fraud';
import { invalidateCachePattern } from '@/lib/redis';
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

const checkoutSchema = z.object({
  ticketId: z.string(),
  deliveryType: z.enum(['ONLINE', 'IN_PERSON', 'COURIER']),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // 🚀 FRAUD ENGINE: Wallet Velocity Validation
    const velocityCheck = await evaluateVelocityLimit(session.id);
    if (velocityCheck.blocked) {
       logger.warn({ route: "/api/transactions", message: "Velocity limit breached", userId: session.id });
       return NextResponse.json({ error: "SECURITY BLOCK: Platform bounds breached. Quarantine active." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
    }

    const { ticketId, deliveryType } = parsed.data;

    // Run ATOMIC TRANSACTION for Escrow/Purchase linking
    const result = await prisma.$transaction(async (tx) => {
       // 1. Lock Ticket & Check Availability
       const ticket = await tx.ticket.findUnique({
         where: { id: ticketId },
         include: { seller: true }
       });

       if (!ticket || ticket.status !== 'ACTIVE') {
         throw new Error("Ticket is no longer available.");
       }

       if (ticket.sellerId === session.id) {
         throw new Error("You cannot purchase your own ticket.");
       }

       // 2. Validate Delivery Type Against Seller's Config
       if (deliveryType === 'ONLINE' && !ticket.allowOnline) throw new Error("Online delivery not allowed by seller.");
       if (deliveryType === 'IN_PERSON' && !ticket.allowInPerson) throw new Error("In-Person delivery not allowed by seller.");
       if (deliveryType === 'COURIER' && !ticket.allowCourier) throw new Error("Courier delivery not allowed by seller.");

       // 3. Compute Financials
       const baseAmount = ticket.sellingPrice || ticket.originalPrice;
       // Commission: 1% or minimum 10 BDT
       let platformCommission = baseAmount * 0.01;
       if (platformCommission < 10) platformCommission = 10;
       
       const sellerAmount = baseAmount - platformCommission;

       // 4. Update Ticket Status
       await tx.ticket.update({
         where: { id: ticket.id },
         data: { status: 'SOLD' }
       });

       // 5. Create Transaction Record
       const transaction = await tx.transaction.create({
         data: {
           ticketId: ticket.id,
           buyerId: session.id,
           amount: baseAmount,
           commission: platformCommission,
           deliveryType: deliveryType,
           status: deliveryType === 'ONLINE' ? 'PAYMENT_PENDING' : 'COMPLETED', 
           paymentStatus: deliveryType === 'ONLINE' ? 'PENDING' : 'PAID',
         }
       });

       // 6. Escrow Logic Execution moved to Payment Webhook
       
       return transaction;
    });

    // Invalidate tickets cache since one is now SOLD
    await invalidateCachePattern('tickets:*');

    logger.info({ route: "/api/transactions", message: "Transaction secured successfully", userId: session.id, meta: { ticketId, transactionId: result.id } });

    return NextResponse.json({ 
      success: true, 
      message: "Ticket successfully secured.",
      transaction: result
    }, { status: 200 });

  } catch (error: any) {
    logger.error({ route: "/api/transactions", message: "Transaction exception", meta: { error: error.message } });
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
