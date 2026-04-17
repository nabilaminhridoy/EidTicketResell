"use client";

import React, { useEffect, useState } from "react";
import { Gavel, AlertCircle, ArrowRightLeft, User, DollarSign, CheckCircle } from "lucide-react";

type Dispute = {
  id: string;
  transactionId: string;
  raisedById: string;
  raisedAgainstId: string;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  transaction: any;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OPEN");
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes?status=${filter}`);
      const data = await res.json();
      if (res.ok) setDisputes(data.disputes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const resolveDispute = async (id: string, action: string) => {
    if (!confirm(`Are you sure you want to proceed with: ${action}? This involves absolute financial movement.`)) return;
    setProcessing(id);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId: id, action, adminNote })
      });
      if (res.ok) {
        setAdminNote("");
        fetchDisputes();
      } else {
        const d = await res.json();
        alert(d.error || "Failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="text-purple-600 mt-1" /> Dispute & Escrow Resolution
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage frozen escrow wallets, rule conflicts, and issue native refunds.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>All</button>
           <button onClick={() => setFilter("OPEN")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "OPEN" ? "bg-white text-gray-900 shadow-sm text-red-600" : "text-gray-500"}`}>Open</button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center p-12 text-gray-400 font-medium animate-pulse">Loading Escrow Ledgers...</div>
        ) : disputes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400 font-medium">
             <CheckCircle className="mx-auto mb-3 text-green-400" size={32} />
             No active disputes found matching filter.
          </div>
        ) : (
          disputes.map(d => (
            <div key={d.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 w-full md:w-1/3 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-widest ${d.status === "OPEN" ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                    {d.status}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5"><AlertCircle size={14} className="text-red-400"/> Dispute Reason</div>
                <p className="text-sm text-gray-600 italic mb-4">"{d.reason}"</p>
                
                {d.adminNote && (
                   <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                     <span className="text-xs font-bold text-purple-800 mb-1 block">Admin Ruling:</span>
                     <p className="text-xs text-purple-700">{d.adminNote}</p>
                   </div>
                )}
              </div>

              <div className="p-6 w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                     <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction Context</div>
                     <span className="font-mono text-xs text-gray-400">{d.transactionId}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                     <div className="w-1/2">
                       <span className="text-xs text-gray-400 font-medium block mb-1">Buyer (Raised By)</span>
                       <div className="flex items-center gap-2 text-sm font-bold text-gray-800"><User size={14}/> {d.raisedById}</div>
                     </div>
                     <ArrowRightLeft className="text-gray-300" />
                     <div className="w-1/2 text-right">
                       <span className="text-xs text-gray-400 font-medium block mb-1">Seller (Held Funds)</span>
                       <div className="flex items-center justify-end gap-2 text-sm font-bold text-gray-800"><User size={14}/> {d.raisedAgainstId}</div>
                     </div>
                  </div>
                </div>

                {d.status === "OPEN" && (
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Resolution Actions</div>
                    <textarea 
                      placeholder="Add an internal note regarding this resolution..." 
                      className="w-full text-sm p-3 border border-gray-200 rounded-xl mb-3 focus:outline-blue-500"
                      rows={2}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                    <div className="flex gap-3">
                       <button 
                         disabled={processing === d.id}
                         onClick={() => resolveDispute(d.id, "RESOLVE_BUYER")}
                         className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
                       >
                         <DollarSign size={16}/> Refund to Buyer
                       </button>
                       <button 
                         disabled={processing === d.id}
                         onClick={() => resolveDispute(d.id, "RESOLVE_SELLER")}
                         className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-green-200"
                       >
                         <CheckCircle size={16}/> Release to Seller
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
