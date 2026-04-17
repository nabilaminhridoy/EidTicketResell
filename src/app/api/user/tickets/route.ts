import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { broadcastNotification } from '@/lib/notifications';
import { evaluateVelocityLimit, evaluatePriceAnomaly } from '@/lib/fraud';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🚀 FRAUD ENGINE: Wallet Velocity Scan
    const velocityCheck = await evaluateVelocityLimit(session.id);
    if (velocityCheck.blocked) {
       return NextResponse.json({ error: "SECURITY BLOCK: Platform limits breached. Actions restricted." }, { status: 403 });
    }

    const body = await req.json();
    const { 
       ticketId, transportType, ticketType, company, routeFrom, routeTo, 
       travelDate, departureTime, seatNumber, classType, originalPrice, 
       sellingPrice, fileUrl, allowOnline 
    } = body;

    // Fraud Prevention Layer: Duplicate Ticket Detection
    // Real PNRs (ticketId) within the same company should never be listed twice globally unless cancelled.
    
    // Normalize PNR string
    const normalizedPNR = String(ticketId).trim().toUpperCase();
    const normalizedCompany = String(company).trim().toUpperCase();
    const normalizedRouteFrom = String(routeFrom).trim().toUpperCase();
    const normalizedRouteTo = String(routeTo).trim().toUpperCase();
    const numericPrice = sellingPrice ? parseFloat(sellingPrice) : null;

    const existingTicket = await prisma.ticket.findFirst({
        where: {
            ticketId: normalizedPNR,
            company: normalizedCompany,
            status: { in: ['PENDING', 'ACTIVE', 'SOLD'] }
        }
    });

    if (existingTicket) {
        // High-confidence fraud / duplicate block
        const ip = req.ip || req.headers.get("x-forwarded-for") || "127.0.0.1";
        const userAgent = req.headers.get("user-agent") || "Unknown";

        await prisma.securityEvent.create({
            data: {
                eventType: "DUPLICATE_TICKET_ATTEMPT",
                severity: "HIGH",
                userId: session.id,
                ipAddress: ip,
                userAgent: userAgent,
                details: {
                   attemptedPNR: normalizedPNR,
                   attemptedCompany: normalizedCompany,
                   conflictWith: existingTicket.id
                }
            }
        });

        // Soft user-facing block
        return NextResponse.json({ 
            error: "Security Policy Block", 
            message: "A ticket with this serial/PNR is already active or sold." 
        }, { status: 422 });
    }

    // 🚀 FRAUD ENGINE: Price Anomaly Scan (Silent Evaluation)
    await evaluatePriceAnomaly(session.id, normalizedCompany, normalizedRouteFrom, normalizedRouteTo, numericPrice);

    // Normal Ticket Insertion Logic
    const newTicket = await prisma.ticket.create({
        data: {
            ticketId: normalizedPNR,
            transportType,
            ticketType,
            company: normalizedCompany,
            routeFrom: normalizedRouteFrom,
            routeTo: normalizedRouteTo,
            travelDate: new Date(travelDate),
            departureTime,
            seatNumber,
            classType,
            originalPrice: parseFloat(originalPrice),
            sellingPrice: numericPrice,
            fileUrl,
            allowOnline: allowOnline !== false,
            sellerId: session.id,
            status: "PENDING"
        }
    });

    // 🚀 Inform User
    broadcastNotification({
       userId: session.id, type: "TICKET_CREATED", title: "Ticket Received",
       message: `Your ticket ${normalizedPNR} for ${normalizedCompany} has been received and is PENDING approval.`,
       sendEmailAlert: true
    }).catch(e => console.error("Notification trigger failed:", e));

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_TICKET_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
