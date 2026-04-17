"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertTriangle, CheckCircle, CreditCard } from "lucide-react";

export default function CheckoutButton({ ticketId, amount }: { ticketId: string, amount: number }) {
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const router = useRouter();

   const handleCheckout = async () => {
      setLoading(true);
      setError(null);
      try {
         const res = await fetch("/api/transactions", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ ticketId })
         });
         const data = await res.json();
         if (res.ok) {
             router.push("/user/dashboard?success=escrow_secured");
         } else {
             setError(data.error || "Failed to secure ticket. You may not have enough valid balance or ticket is sold.");
         }
      } catch (e) {
         setError("Network fault connecting to Escrow Engine.");
      } finally {
         setLoading(false);
      }
   };

   return (
       <div className="mt-8">
           {error && (
               <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2 text-sm font-medium">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16}/> {error}
               </div>
           )}

           <button 
               onClick={handleCheckout} 
               disabled={loading}
               className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-2xl transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
           >
               {loading ? "Locking Funds in Escrow..." : <><Lock size={20}/> Confirm & Lock ৳{amount}</>}
           </button>
           
           <div className="flex items-center justify-center gap-4 mt-6 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500"/> ETR Escrow Protected</div>
              <div className="flex items-center gap-1"><CreditCard size={14} className="text-gray-400"/> Auto-debited from Wallet</div>
           </div>
       </div>
   );
}
