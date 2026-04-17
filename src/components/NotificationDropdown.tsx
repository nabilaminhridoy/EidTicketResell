"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Bell, Check, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    
    // Core SWR Polling Logic Native - Hits every 15,000ms natively.
    const { data, mutate } = useSWR("/api/user/notifications", fetcher, { 
        refreshInterval: 15000,
        revalidateOnFocus: true
    });

    const markAllRead = async () => {
        if (!data?.unreadCount) return;
        await fetch("/api/user/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true })
        });
        mutate(); // Re-poll globally
    };

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    return (
        <div className="relative">
            {/* Bell Trigger */}
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors flex items-center justify-center border border-gray-200">
               <Bell size={20} />
               {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white border-2 border-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                   </span>
               )}
            </button>

            {/* Floating Dropdown Frame */}
            {isOpen && (
                <>
                    <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-40"></div>
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden transform origin-top-right transition-all">
                       <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                             Alerts {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                          </h3>
                          {unreadCount > 0 && (
                             <button onClick={markAllRead} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition">
                                 <Check size={14}/> Mark read
                             </button>
                          )}
                       </div>

                       <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 font-medium text-sm">
                                  No alerts explicitly requested.
                              </div>
                          ) : (
                              <div className="divide-y divide-gray-50">
                                  {notifications.slice(0, 5).map((n: any) => (
                                      <div key={n.id} className={`p-4 transition hover:bg-gray-50 flex gap-3 ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                          <div>
                                              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                              <p className="text-xs text-gray-600 mt-1 leading-tight">{n.message}</p>
                                              <p className="text-[10px] text-gray-400 font-medium mt-2">{formatDistanceToNow(new Date(n.createdAt))} ago</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                       </div>

                       <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                           <Link href="/user/notifications" onClick={() => setIsOpen(false)} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition flex items-center justify-center gap-1">
                               View Global History <ArrowRight size={14}/>
                           </Link>
                       </div>
                    </div>
                </>
            )}
        </div>
    );
}
