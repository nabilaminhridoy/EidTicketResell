import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
         availableBalance: true,
         pendingBalance: true,
         lockedBalance: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      wallet: {
        available: user.availableBalance,
        pending: user.pendingBalance,
        locked: user.lockedBalance,
        totalHoldings: user.availableBalance + user.pendingBalance + user.lockedBalance
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
