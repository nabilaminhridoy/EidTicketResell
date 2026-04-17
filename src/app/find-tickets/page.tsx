import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import TicketList from "./TicketList";

export const metadata: Metadata = {
  title: "Search Eid Tickets | ETR Marketplace",
  description: "Browse affordable Bus, Train, and Air tickets for Eid. Authentic platform directly connecting buyers and sellers.",
};

// Force dynamic server rendering (SSR)
export const dynamic = "force-dynamic";

export default async function FindTicketsPage({
  searchParams,
}: {
  searchParams: { routeFrom?: string; routeTo?: string; company?: string; date?: string }
}) {
  // Delegate all rendering to TicketList client-side with SWR

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <Link href="/" className="font-black text-2xl tracking-tighter text-gray-900 bg-clip-text">
             EidTicket<span className="text-blue-600">Resell</span>
           </Link>
           <nav className="flex gap-4">
              <Link href="/user/login" className="bg-gray-100 font-bold text-sm text-gray-700 px-5 py-2.5 rounded-full hover:bg-gray-200 transition">Log in</Link>
              <Link href="/user/register" className="bg-blue-600 font-bold text-sm text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition">Sign Up</Link>
           </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
         <TicketList initialParams={searchParams} />
      </main>
    </div>
  );
}
