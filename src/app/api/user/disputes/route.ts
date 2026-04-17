import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json();
    const { transactionId, reason } = body;

    if (!transactionId || !reason) {
      return NextResponse.json({ error: "Missing transaction identifier or reason." }, { status: 400 });
    }

    // A dispute freezes the escrow. We must perform this atomically.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Transaction
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { ticket: true }
      });

      if (!transaction || transaction.buyerId !== session.id) {
         throw new Error("Transaction unauthorized or not found.");
      }

      if (transaction.status !== "COMPLETED" && transaction.status !== "PENDING") {
         throw new Error("Only active or pending transactions can be disputed.");
      }

      // Prevent duplicate disputes
      const existingDispute = await tx.dispute.findUnique({ where: { transactionId } });
      if (existingDispute) throw new Error("A dispute already exists for this transaction.");

      // 2. Create the Dispute
      const dispute = await tx.dispute.create({
        data: {
          transactionId,
          raisedById: session.id,
          raisedAgainstId: transaction.ticket.sellerId,
          reason,
          status: "OPEN",
        }
      });

      // 3. Mark transaction as DISPUTED
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "DISPUTED" }
      });

      // 4. Record Security Audit Log
      await tx.securityEvent.create({
        data: {
          eventType: "ESCROW_DISPUTED",
          severity: "MEDIUM",
          userId: session.id,
          details: { transactionId, disputedAmount: transaction.amount }
        }
      });

      return dispute;
    });

    return NextResponse.json({ success: true, dispute: result }, { status: 201 });

  } catch (error: any) {
    console.error("USER_DISPUTE_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
