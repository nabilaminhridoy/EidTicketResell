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
    const filter = searchParams.get('filter') || 'all';

    let whereClause = {};
    if (filter === 'unverified') whereClause = { isIdVerified: false };
    if (filter === 'verified') whereClause = { isIdVerified: true };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isIdVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("ADMIN_USERS_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access Denied. Admins Only." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, isIdVerified } = body;

    if (!userId || isIdVerified === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isIdVerified },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: isIdVerified ? "USER_ID_VERIFIED" : "USER_ID_UNVERIFIED",
        details: { targetUserId: userId, targetUserEmail: user.email },
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("ADMIN_USERS_UPDATE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
