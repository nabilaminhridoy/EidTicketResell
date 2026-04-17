"use client";

import React, { useEffect, useState } from "react";
import { Ticket, CheckCircle2, XCircle, Search, Clock, Tag } from "lucide-react";

type TicketData = {
  id: string;
  ticketId: string;
  company: string;
  routeFrom: string;
  routeTo: string;
  travelDate: string;
  originalPrice: number;
  sellingPrice: number;
  status: string;
  fileUrl: string;
  seller: {
    name: string;
    email: string;
    phone: string;
    isIdVerified: boolean;
  };
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${filter}`);
      const data = await res.json();
      if (res.ok) setTickets(data.tickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const updateStatus = async (ticketId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change this ticket to ${newStatus}?`)) return;

    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus })
      });
      if (res.ok) fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-xs font-bold border border-orange-100 flex items-center gap-1.5 w-fit"><Clock size={12}/> PENDING</span>;
      case "ACTIVE":
        return <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-bold border border-green-100 flex items-center gap-1.5 w-fit"><CheckCircle2 size={12}/> ACTIVE</span>;
      case "CANCELLED":
        return <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-bold border border-red-100 flex items-center gap-1.5 w-fit"><XCircle size={12}/> CANCELLED</span>;
      case "SOLD":
        return <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold border border-blue-100 flex items-center gap-1.5 w-fit"><Tag size={12}/> SOLD</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="text-orange-500 mt-1" /> Ticket Approval Queue
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Verify documents and allow tickets into the live marketplace.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All</button>
           <button onClick={() => setFilter("PENDING")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "PENDING" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Pending</button>
           <button onClick={() => setFilter("ACTIVE")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "ACTIVE" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Active</button>
           <button onClick={() => setFilter("CANCELLED")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "CANCELLED" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Cancelled</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-medium">Loading marketplace records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 border-b border-gray-100">Ticket Route / ID</th>
                  <th className="p-4 border-b border-gray-100">Seller Identity</th>
                  <th className="p-4 border-b border-gray-100">Status</th>
                  <th className="p-4 border-b border-gray-100">Verification Doc</th>
                  <th className="p-4 border-b border-gray-100 relative">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{t.routeFrom} ➔ {t.routeTo}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{t.ticketId} • <span className="font-semibold text-gray-700">{t.company}</span></div>
                      <div className="text-xs mt-1 text-primary font-bold">৳{t.sellingPrice} (was ৳{t.originalPrice})</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800 text-sm">{t.seller.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{t.seller.phone}</div>
                      {t.seller.isIdVerified ? (
                        <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">KYC Verified</span>
                      ) : (
                         <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider flex items-center gap-1"><CheckCircle2 size={10}/> Unverified</span>
                      )}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="p-4">
                       <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                          <Search size={14}/> View PDF/Image
                       </a>
                    </td>
                    <td className="p-4">
                        <div className="flex gap-2">
                          {(t.status === 'PENDING' || t.status === 'CANCELLED') && (
                            <button 
                              onClick={() => updateStatus(t.id, 'ACTIVE')}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-green-200 text-green-600 hover:bg-green-50"
                            >Approve</button>
                          )}
                          {(t.status === 'PENDING' || t.status === 'ACTIVE') && (
                            <button 
                              onClick={() => updateStatus(t.id, 'CANCELLED')}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-red-200 text-red-600 hover:bg-red-50"
                            >Cancel</button>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">No tickets match this status filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}