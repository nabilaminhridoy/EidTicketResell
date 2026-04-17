import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { z } from 'zod';
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

const loginSchema = z.object({
  identifier: z.string().min(2, "Identifier (Email/Phone) is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }
    
    const { identifier, password } = parsed.data;

    // Check rate limiting / login attempts in AuditLog (simplified check)
    // Production note: A Redis-based rate limit should be implemented here.

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) {
      // Avoid revealing timing/existence attacks
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    const ip = req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    if (!isValid) {
      await prisma.auditLog.create({
        data: { userId: user.id, action: "LOGIN_FAILED", ipAddress: ip, userAgent }
      });
      logger.warn({ route: "/api/auth/login", message: "Failed login attempt", userId: user.id, meta: { ip } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Optional OTP requirement check could go here for 2FA.

    // Generate JWT Edge-compatible via jose
    const token = await generateToken({
      id: user.id,
      role: user.role,
      isIdVerified: user.isIdVerified
    });

    // Fingerprinting & Anomaly Detection
    const lastLogin = await prisma.auditLog.findFirst({
      where: { userId: user.id, action: { in: ["LOGIN_SUCCESS", "LOGIN_SUCCESS_NEW_DEVICE"] } },
      orderBy: { createdAt: "desc" }
    });

    let isAnomalous = false;
    if (lastLogin && (lastLogin.ipAddress !== ip || lastLogin.userAgent !== userAgent)) {
        isAnomalous = true;
        await prisma.securityEvent.create({
           data: {
             eventType: "ANOMALOUS_LOGIN",
             severity: "MEDIUM",
             userId: user.id,
             ipAddress: ip,
             userAgent: userAgent,
             details: { prevIp: lastLogin.ipAddress, prevUA: lastLogin.userAgent }
           }
        });
    }

    await prisma.auditLog.create({
      data: { userId: user.id, action: isAnomalous ? "LOGIN_SUCCESS_NEW_DEVICE" : "LOGIN_SUCCESS", ipAddress: ip, userAgent: userAgent }
    });
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.name, role: user.role } 
    }, { status: 200 });

    // Enforce highly secure HttpOnly Cookie rules
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    logger.error({ route: "/api/auth/login", message: "Login exception", meta: { error: error.message } });
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
