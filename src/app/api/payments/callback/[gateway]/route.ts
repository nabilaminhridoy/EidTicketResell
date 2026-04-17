import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  await handleCallback(req, params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  await handleCallback(req, params);
}

async function handleCallback(req: NextRequest, params: Promise<{ gateway: string }>) {
  const url = new URL(req.url);
  // Optional: Check status from query params or form data
  // But NEVER execute escrow here because this is client-facing callback.
  // Instead, redirect the user to a generic payment status polling screen.
  
  const status = url.searchParams.get("status") || "unknown";
  const transactionId = url.searchParams.get("paymentID") || url.searchParams.get("tran_id");

  // Redirect to frontend UI Payment Status polling page
  return NextResponse.redirect(new URL(`/payment/status?transactionId=${transactionId}&status=${status}`, req.url));
}
