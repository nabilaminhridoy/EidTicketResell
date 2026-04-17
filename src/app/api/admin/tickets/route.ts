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
    const filterStatus = searchParams.get('status') || 'all';

    let whereClause = {};
    if (filterStatus !== 'all') {
      whereClause = { status: filterStatus.toUpperCase() };
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            name: true,
            email: true,
            phone: true,
            isIdVerified: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error("ADMIN_TICKETS_FETCH_ERROR:", error);
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
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify valid status transition
    const validStatuses = ['PENDING', 'ACTIVE', 'SOLD', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status state" }, { status: 400 });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: `TICKET_${status}`,
        details: { ticketId: updated.id, ticketLocalId: updated.ticketId },
      }
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("ADMIN_TICKETS_UPDATE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
