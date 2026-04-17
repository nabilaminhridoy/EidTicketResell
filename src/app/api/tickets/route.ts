import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { z } from 'zod';
import { fetchWithCache, invalidateCachePattern } from '@/lib/redis';
import crypto from 'crypto';

// Generate TKT-XXXX ID
function generateTicketId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TKT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify User Authority
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // 2. Strict Business Rule: Enforce ID Verification before selling
    if (!session.isIdVerified) {
      return NextResponse.json({ error: "You must complete ID Verification before selling tickets." }, { status: 403 });
    }

    // 3. Parse Multipart Form Data
    const formData = await req.formData();
    const transport = formData.get('transport') as string;
    const origin = formData.get('origin') as string;
    const destination = formData.get('destination') as string;
    const price = parseFloat(formData.get('price') as string);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    
    // Conditions
    const isAC = formData.get('isAC') === 'true';
    const isSleeper = formData.get('isSleeper') === 'true';
    const hasPhysicalTicket = formData.get('hasPhysicalTicket') === 'true';
    const canDeliverCOD = formData.get('canDeliverCOD') === 'true';

    if (!transport || !origin || !destination || isNaN(price) || !dateStr) {
       return NextResponse.json({ error: "Missing core required fields." }, { status: 400 });
    }

    // Create normalized Date
    const travelDate = new Date(`${dateStr}T${timeStr || '00:00'}:00Z`);

    // 4. File processing
    const file = formData.get('ticketImage') as File;
    if (!file) {
      return NextResponse.json({ error: "Ticket image/proof is required." }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let ticketUrl = "";

    try {
      const uploadRes = await uploadBufferToCloudinary(buffer, `etr_tickets/${session.id}`);
      ticketUrl = uploadRes.secure_url;
    } catch (uploadError) {
      return NextResponse.json({ error: "Failed to upload file to visual processing. Check format." }, { status: 500 });
    }

    const customId = generateTicketId();
    
    // 5. Database Transaction (Insert Ticket + Audit rules)
    const newTicket = await prisma.$transaction(async (tx) => {
       const tkt = await tx.ticket.create({
         data: {
           customId,
           sellerId: session.id,
           transport,
           routeFrom: origin,
           routeTo: destination,
           ticketDate: travelDate,
           originalPrice: price,
           sellingPrice: price, // App fee applies elsewhere during payout context
           isAC,
           isSleeper,
           hasPhysicalTicket,
           canDeliverCOD,
           ticketImage: ticketUrl,
           status: 'AVAILABLE'
         }
       });

       await tx.auditLog.create({
         data: { userId: session.id, action: "TICKET_LISTED", details: { customId, price } }
       });

       return tkt;
    });

    // Invalidate Redis tickets cache on new ticket creation
    await invalidateCachePattern('tickets:*');

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Phase 2.3: Discovery Engine API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Build flexible Prisma filters
    const filterConditions: any = { status: 'AVAILABLE' };

    const transportFilter = searchParams.get('transport');
    if (transportFilter && transportFilter !== 'all') filterConditions.transport = transportFilter;

    const fromPattern = searchParams.get('from');
    if (fromPattern) filterConditions.routeFrom = { contains: fromPattern };

    const toPattern = searchParams.get('to');
    if (toPattern) filterConditions.routeTo = { contains: toPattern };
    
    const isAC = searchParams.get('isAC');
    if (isAC === 'true') filterConditions.isAC = true;

    const isSleeper = searchParams.get('isSleeper');
    if (isSleeper === 'true') filterConditions.isSleeper = true;

    const dateVal = searchParams.get('date');
    if (dateVal) {
      const targetDate = new Date(dateVal);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filterConditions.ticketDate = { gte: targetDate, lt: nextDay };
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Create a cache key from the search params
    const searchString = searchParams.toString();
    const queryHash = crypto.createHash('md5').update(searchString).digest('hex');
    const cacheKey = `tickets:${queryHash}`;

    // Execute query via Redis cache wrapper
    const responseData = await fetchWithCache(cacheKey, async () => {
      const tickets = await prisma.ticket.findMany({
        where: filterConditions,
        skip,
        take: limit,
        orderBy: { ticketDate: 'asc' },
        // Select limited fields to reduce payload
        select: {
          id: true,
          customId: true,
          transport: true,
          routeFrom: true,
          routeTo: true,
          ticketDate: true,
          originalPrice: true,
          sellingPrice: true,
          company: true,
          ticketImage: true,
          departureTime: true,
          seatNumber: true,
          seller: {
            select: { name: true, isIdVerified: true }
          }
        }
      });

      const total = await prisma.ticket.count({ where: filterConditions });

      return {
        success: true,
        data: tickets,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }, 45); // 45s TTL

    return NextResponse.json(responseData);

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
