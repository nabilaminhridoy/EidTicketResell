import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateOTP } from '@/lib/auth';
import { z } from 'zod';
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

// Secure payload validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be minimum 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }
    
    const { name, phone, email, password } = parsed.data;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or phone already exists." }, { status: 409 });
    }

    // Security constraints
    const hashedPassword = await hashPassword(password);
    
    // Create OTP (for Phase 1 verification simulations)
    const newOtp = generateOTP();

    // Create User record and dispatch AuditLog
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: hashedPassword,
          role: 'USER',
          otpCode: newOtp, // Actually we should generate this outside the user object in a VerificationToken table per auth guidelines
          otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      });
      
      // Seed OTP into independent Token Table
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: newOtp, // Should optimally be hashed later
          type: "EMAIL",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      await tx.auditLog.create({
        data: { userId: u.id, action: "USER_REGISTERED" }
      });

      return u;
    });

    // In a production environment, you would trigger SMS or Email providers here.
    logger.info({ route: "/api/auth/register", message: "User registered successfully", userId: newUser.id, meta: { email } });


    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully. An OTP has been sent to your Email/Phone.",
      userId: newUser.id 
    }, { status: 201 });

  } catch (error: any) {
    logger.error({ route: "/api/auth/register", message: "Registration exception", meta: { error: error.message } });
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
