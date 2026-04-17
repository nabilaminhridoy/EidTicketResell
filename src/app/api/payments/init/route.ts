import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { PaymentEngine } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json();
    const { transactionId, gateway } = body;
    
    if (!transactionId || !gateway) {
      return NextResponse.json({ error: "transactionId and gateway required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { ticket: true }
    });

    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (transaction.buyerId !== session.id) return NextResponse.json({ error: "Unauthorized transaction" }, { status: 403 });
    if (transaction.status !== "PAYMENT_PENDING") return NextResponse.json({ error: "Transaction is not pending payment" }, { status: 400 });

    const adapter = PaymentEngine.getAdapter(gateway);
    const { url, gatewayTxId } = await adapter.initiatePayment(transaction);

    // Update transaction with gatewayTxId
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        gateway: gateway,
        gatewayTransactionId: gatewayTxId
      }
    });

    return NextResponse.json({ success: true, paymentUrl: url });
  } catch (error: any) {
    console.error("PAYMENT_INIT_ERROR", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
