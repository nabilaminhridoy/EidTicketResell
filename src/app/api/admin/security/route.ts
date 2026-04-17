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
    const filter = searchParams.get('filter') || 'all'; // 'all', 'unresolved'
    
    let whereClause = {};
    if (filter === 'unresolved') {
      whereClause = { isResolved: false };
    }

    const events = await prisma.securityEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const quarantinedProfiles = await prisma.riskProfile.findMany({
      where: { isQuarantined: true },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { quarantineTime: "desc" }
    });

    return NextResponse.json({ success: true, events, quarantinedProfiles });
  } catch (error: any) {
    console.error("ADMIN_SECURITY_EVENTS_FETCH_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = await req.json();
    const { id, isResolved } = body;

    if (!id || isResolved === undefined) {
      return NextResponse.json({ error: "Missing ID or state" }, { status: 400 });
    }

    const updated = await prisma.securityEvent.update({
      where: { id },
      data: { isResolved },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error("ADMIN_SECURITY_EVENT_RESOLVE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
