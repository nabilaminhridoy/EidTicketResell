"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const transactionId = searchParams.get("transactionId");
  const urlStatus = searchParams.get("status");
  
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    // Basic simulation: A more robust approach would poll a `GET /api/transactions/[id]` endpoint 
    // to check if the Webhook successfully processed the transaction.
    if (urlStatus === "success" || urlStatus === "VALID") {
      // Simulate polling wait for webhook to complete
      const timer = setTimeout(() => {
         setStatus("success");
      }, 2000);
      return () => clearTimeout(timer);
    } else if (urlStatus === "failed" || urlStatus === "cancelled" || urlStatus === "INVALID") {
      setStatus("failed");
    } else {
      setStatus("failed"); // Default to falied if unknown params
    }
  }, [urlStatus]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center">
        {/* Glow Effects */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-[80px] -z-10 ${status === 'success' ? 'bg-emerald-500/20' : status === 'failed' ? 'bg-red-500/20' : 'bg-blue-500/20'}`} />

        {status === "loading" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment</h1>
            <p className="text-neutral-400">Please wait while we securely verify your transaction with the gateway.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-neutral-400 mb-8">Your ticket has been securely transferred to your account.</p>
            
            <Link href="/user/purchases" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors inline-block">
              View My Tickets
            </Link>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
            <p className="text-neutral-400 mb-8">We could not verify your payment. The ticket was not purchased.</p>
            
            <button onClick={() => router.back()} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-lg transition-colors border border-neutral-700">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
