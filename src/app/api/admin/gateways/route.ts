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

    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, gateways });
  } catch (error: any) {
    console.error("GATEWAYS_FETCH_ERROR:", error);
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
    const { id, isSandbox, status, config, name, description, logo, minAmount, maxAmount, fixedDiscount, percentDiscount, fixedCharge, percentCharge } = body;

    if (!id) {
      return NextResponse.json({ error: "Gateway ID is required" }, { status: 400 });
    }

    const currentGateway = await prisma.paymentGateway.findUnique({ where: { id } });
    if (!currentGateway) {
       return NextResponse.json({ error: "Gateway not found" }, { status: 404 });
    }

    // Merge config if provided
    let updatedConfig = currentGateway.config;
    if (config !== undefined && typeof config === 'object') {
       updatedConfig = {
         ...(currentGateway.config as any),
         ...config
       };
    }

    const updated = await prisma.paymentGateway.update({
      where: { id },
      data: {
        isSandbox: isSandbox !== undefined ? isSandbox : currentGateway.isSandbox,
        status: status !== undefined ? status : currentGateway.status,
        config: updatedConfig,
        name: name !== undefined ? name : currentGateway.name,
        description: description !== undefined ? description : currentGateway.description,
        logo: logo !== undefined ? logo : currentGateway.logo,
        minAmount: minAmount !== undefined ? Number(minAmount) : currentGateway.minAmount,
        maxAmount: maxAmount !== undefined ? Number(maxAmount) : currentGateway.maxAmount,
        fixedDiscount: fixedDiscount !== undefined ? Number(fixedDiscount) : currentGateway.fixedDiscount,
        percentDiscount: percentDiscount !== undefined ? Number(percentDiscount) : currentGateway.percentDiscount,
        fixedCharge: fixedCharge !== undefined ? Number(fixedCharge) : currentGateway.fixedCharge,
        percentCharge: percentCharge !== undefined ? Number(percentCharge) : currentGateway.percentCharge,
      },
    });

    // We can track this in AuditLog securely natively.
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "GATEWAY_UPDATED",
        details: { gatewayId: id, gatewayName: updated.name },
      }
    });

    return NextResponse.json({ success: true, gateway: updated });
  } catch (error: any) {
    console.error("GATEWAYS_UPDATE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
