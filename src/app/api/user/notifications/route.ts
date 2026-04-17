import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const session = await verifyToken(token);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Retrieve notifications natively. Cap UI to 50 for speed.
        const notifications = await prisma.notification.findMany({
            where: { userId: session.id },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        // Fast count of total unreads directly on the edge scope
        const unreadCount = await prisma.notification.count({
            where: { userId: session.id, isRead: false }
        });

        return NextResponse.json({ success: true, unreadCount, notifications });
    } catch (e) {
        console.error("NOTIFICATION_FETCH_CRASH", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const session = await verifyToken(token);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        
        // Either mark all or array of specific IDs globally
        if (body.markAll) {
             await prisma.notification.updateMany({
                 where: { userId: session.id, isRead: false },
                 data: { isRead: true }
             });
        } else if (body.ids && Array.isArray(body.ids)) {
             await prisma.notification.updateMany({
                 where: { userId: session.id, id: { in: body.ids } },
                 data: { isRead: true }
             });
        } else {
             return NextResponse.json({ error: "Invalid Request Structure" }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Ledger updated." });
    } catch (e) {
        console.error("NOTIFICATION_PATCH_CRASH", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
