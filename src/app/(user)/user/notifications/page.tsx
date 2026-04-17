"use client";

import React, { useEffect, useState } from "react";
import { Bell, ShieldAlert, ShoppingBag, ArrowLeftRight, CheckCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotificationHistoryPage() {
    const { data, mutate } = useSWR("/api/user/notifications", fetcher);

    const markAllRead = async () => {
        if (!data?.unreadCount) return;
        await fetch("/api/user/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true })
        });
        mutate();
    };

    if (!data) return (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-medium animate-pulse">
            <Bell size={32} className="mb-4 opacity-50"/> Connecting to Global Ledger...
        </div>
    );

    const notifications = data.notifications || [];

    const getIconInfo = (title: string, message: string) => {
        const text = (title + message).toLowerCase();
        if (text.includes("escrow") || text.includes("purchase")) return <ShoppingBag size={20} className="text-blue-500" />;
        if (text.includes("dispute") || text.includes("quarantine") || text.includes("security")) return <ShieldAlert size={20} className="text-red-500" />;
        if (text.includes("balance") || text.includes("wallet") || text.includes("withdrawn")) return <ArrowLeftRight size={20} className="text-green-500" />;
        return <Info size={20} className="text-gray-500" />;
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                      <Bell className="text-blue-600" /> Notification Center
                   </h1>
                   <p className="text-gray-500 mt-1 font-medium text-sm">A permanent ledger of all financial and system actions.</p>
                </div>
                
                {data.unreadCount > 0 && (
                   <button onClick={markAllRead} className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 text-sm shadow-sm">
                      <CheckCircle size={16}/> Mark {data.unreadCount} Unread as Read
                   </button>
                )}
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden card-shadow">
               {notifications.length === 0 ? (
                   <div className="py-20 text-center">
                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <Bell size={24}/>
                       </div>
                       <h3 className="font-bold text-gray-900 text-lg mb-1">Your ledger is completely clean.</h3>
                       <p className="text-gray-500 font-medium text-sm">Real-time alerts will populate here securely.</p>
                   </div>
               ) : (
                   <div className="divide-y divide-gray-50">
                       {notifications.map((n: any) => (
                           <div key={n.id} className={`p-6 transition hover:bg-gray-50 flex gap-4 ${!n.isRead ? 'bg-blue-50/20' : ''}`}>
                               <div className="shrink-0 mt-1">
                                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${!n.isRead ? 'border-blue-100 bg-white shadow-sm' : 'border-transparent bg-gray-50'}`}>
                                       {getIconInfo(n.title, n.message)}
                                   </div>
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between items-start gap-4 mb-1">
                                      <h4 className={`font-bold text-gray-900 ${!n.isRead ? 'text-lg' : 'text-md'}`}>
                                         {n.title}
                                      </h4>
                                      <span className="text-[11px] font-bold text-gray-400 tracking-wide uppercase mt-1 shrink-0">
                                         {formatDistanceToNow(new Date(n.createdAt))} ago
                                      </span>
                                   </div>
                                   <p className={`text-gray-600 ${!n.isRead ? 'font-medium' : ''}`}>{n.message}</p>
                                   
                                   {!n.isRead && (
                                       <span className="inline-block mt-3 bg-blue-100 text-blue-700 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md">New Request</span>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
            </div>
            
            <div className="text-center mt-6">
                <p className="text-xs text-gray-400 font-medium tracking-tight">Notification logs are preserved chronologically by the internal transaction engine securely.</p>
            </div>
        </div>
    );
}
