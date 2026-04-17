import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GATEWAY_REGISTRY } from "@/config/gateways";

// This endpoint seeds ALL missing gateways from the registry into the database.
// Ideally invoked natively or via a secure admin button. Using GET for ease of access during deployment.
export async function GET(req: NextRequest) {
  try {
    const existingGateways = await prisma.paymentGateway.findMany();
    const existingIdentifiers = existingGateways.map(g => g.identifier);

    const newGateways = GATEWAY_REGISTRY.filter(g => !existingIdentifiers.includes(g.identifier));

    if (newGateways.length === 0) {
      return NextResponse.json({ success: true, message: "All expected gateways already seeded.", count: 0 });
    }

    const payload = newGateways.map(g => ({
       identifier: g.identifier,
       name: g.defaultName,
       description: g.defaultDescription,
       isSandbox: g.hasSandbox,
       status: false,
       config: {},
       // Financial constraints defaulted
       minAmount: 0,
       maxAmount: 0,
       fixedCharge: 0,
       percentCharge: 0,
       fixedDiscount: 0,
       percentDiscount: 0,
    }));

    const result = await prisma.paymentGateway.createMany({
       data: payload
    });

    return NextResponse.json({ 
       success: true, 
       message: `Successfully seeded ${result.count} new payment gateways.`,
       count: result.count
    });

  } catch (error: any) {
    console.error("GATEWAYS_SEED_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
