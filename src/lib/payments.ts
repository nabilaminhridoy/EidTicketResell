import { prisma } from "@/lib/prisma";

export interface IPaymentAdapter {
  initiatePayment(transaction: any): Promise<{ url: string; gatewayTxId: string }>;
  verifyWebhook(req: Request): Promise<{
    isValid: boolean;
    transactionId: string;
    amount: number;
    gatewayTxId: string;
    status: 'SUCCESS' | 'FAILED';
    rawPayload: any;
  }>;
}

export class BkashAdapter implements IPaymentAdapter {
  // In a real implementation, you'd fetch credentials from the PaymentGateway model or .env
  // For the sake of this mock, we use assumed endpoints.
  
  async initiatePayment(transaction: any) {
    // 1. Grant Token
    // 2. Create Payment API Call
    // Mock response:
    const mockBkashId = `BKASH-${Date.now()}`;
    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/bkash?paymentID=${mockBkashId}&status=success`,
      gatewayTxId: mockBkashId
    };
  }

  async verifyWebhook(req: Request) {
    const body = await req.json();
    // Simulate bkash execute payment / IPN verification
    
    // In real bKash, IPN verification involves checking the signature headers
    // and calling Execute Payment or Query Payment API.
    
    return {
      isValid: true,
      transactionId: body.transactionId || 'UNKNOWN',
      amount: parseFloat(body.amount || "0"),
      gatewayTxId: body.paymentID,
      status: body.status === 'success' ? 'SUCCESS' : 'FAILED',
      rawPayload: body
    };
  }
}

export class SSLCommerzAdapter implements IPaymentAdapter {
  async initiatePayment(transaction: any) {
    // SSLCommerz token API call
    const mockSSLTxId = `SSL-${Date.now()}`;
    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/sslcommerz?tran_id=${mockSSLTxId}&status=VALID`,
      gatewayTxId: mockSSLTxId
    };
  }

  async verifyWebhook(req: Request) {
    // SSLCommerz sends POST with form data (x-www-form-urlencoded)
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    
    return {
      isValid: true, // Requires SSL validation API call: Order Validation
      transactionId: data.tran_id as string || 'UNKNOWN',
      amount: parseFloat(data.amount as string || "0"),
      gatewayTxId: data.val_id as string || 'UNKNOWN',
      status: data.status === 'VALID' ? 'SUCCESS' : 'FAILED',
      rawPayload: data
    };
  }
}

export class PaymentEngine {
  static getAdapter(gateway: string): IPaymentAdapter {
    if (gateway === 'bkash') return new BkashAdapter();
    if (gateway === 'sslcommerz') return new SSLCommerzAdapter();
    throw new Error(`Unsupported payment gateway: ${gateway}`);
  }
}
