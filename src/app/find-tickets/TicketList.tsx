"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { MapPin, Calendar, Clock, Search } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TicketList({ initialParams }: { initialParams: any }) {
  const [params, setParams] = useState({
    routeFrom: initialParams.routeFrom || "",
    routeTo: initialParams.routeTo || "",
    date: initialParams.date || "",
  });

  const queryParams = new URLSearchParams();
  if (params.routeFrom) queryParams.append("from", params.routeFrom);
  if (params.routeTo) queryParams.append("to", params.routeTo);
  if (params.date) queryParams.append("date", params.date);

  const { data, error, isLoading } = useSWR(`/api/tickets?${queryParams.toString()}`, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const tickets = data?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setParams({
      routeFrom: formData.get("routeFrom") as string,
      routeTo: formData.get("routeTo") as string,
      date: formData.get("date") as string,
    });
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2">Find Your Ticket Home.</h1>
          <p className="text-blue-100 font-medium">100% verified tickets. Secured by Escrow.</p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col md:flex-row gap-3 relative z-10 w-full max-w-4xl border border-white/20">
          <input type="text" name="routeFrom" placeholder="From (e.g. Dhaka)" defaultValue={params.routeFrom} className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 ring-blue-400 placeholder-gray-400 font-medium" />
          <input type="text" name="routeTo" placeholder="To (e.g. Chittagong)" defaultValue={params.routeTo} className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 ring-blue-400 placeholder-gray-400 font-medium" />
          <input type="date" name="date" defaultValue={params.date} className="px-4 py-3 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 ring-blue-400 font-medium" />
          <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition shadow-lg">
            <Search size={18} /> Search
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="col-span-full py-20 text-center text-gray-500 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
           Loading Live Data...
        </div>
      )}

      {!isLoading && tickets.length === 0 ? (
        <div className="col-span-full py-20 text-center text-gray-400 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm">
          No tickets found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((t: any) => (
            <div key={t.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 group flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded w-fit uppercase mb-2">{t.transport}</div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{t.company}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">৳{t.sellingPrice || t.originalPrice}</span>
                    <div className="text-xs text-gray-500 line-through">৳{t.originalPrice}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <MapPin size={16} className="text-gray-400" /> {t.routeFrom} → {t.routeTo}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Calendar size={16} className="text-gray-400" /> {new Date(t.ticketDate || t.travelDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Clock size={16} className="text-gray-400" /> {t.departureTime} (Seat: {t.seatNumber})
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-auto">
                <Link href={`/user/login?redirect=/buy/${t.id}`} className="w-full text-center block bg-gray-50 hover:bg-blue-50 text-blue-600 font-bold py-3 rounded-xl transition-colors">
                  Purchase Automatically
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
