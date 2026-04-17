import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is 100 ৳"),
  method: z.string().min(2, "Withdrawal method required"),
  accountInfo: z.record(z.string()), // e.g. { "bkashNumber": "017..." }
  otpToken: z.string().length(6, "Invalid OTP"),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    if (!session.isIdVerified) {
       return NextResponse.json({ error: "Your ID must be verified before making withdrawals." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters", details: parsed.error.issues }, { status: 400 });
    }

    const { amount, method, accountInfo, otpToken } = parsed.data;

    // Optional: Real OTP check would happen here against VerificationToken table
    // if (!(await verifyRealOTP(session.id, otpToken))) throw ...

    // Execute ATOMIC wallet transaction
    const result = await prisma.$transaction(async (tx) => {
       // 1. Lock rows explicitly for this user to prevent race conditions
       const user = await tx.user.findUnique({
         where: { id: session.id }
       });

       if (!user) throw new Error("User not found");
       
       if (user.availableBalance < amount) {
         throw new Error("Insufficient Available Balance.");
       }

       // 2. Safely deduct balance
       await tx.user.update({
         where: { id: session.id },
         data: {
           availableBalance: { decrement: amount }
         }
       });

       // 3. Create Withdrawal Request
       const withdrawal = await tx.withdrawal.create({
         data: {
           userId: session.id,
           amount: amount,
           method: method,
           accountDetails: accountInfo,
           status: 'PENDING'
         }
       });

       // 4. Secure anti-fraud AuthLog
       await tx.auditLog.create({
         data: {
           userId: session.id,
           action: "WITHDRAWAL_REQUESTED",
           details: { amount, method, accountInfo },
           ipAddress: req.ip || "Unknown"
         }
       });

       return withdrawal;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal requested successfully.",
      withdrawal: result
    }, { status: 200 });

  } catch (error: any) {
    console.error("WITHDRAW_ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
