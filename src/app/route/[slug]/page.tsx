import React from "react";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { MapPin, Calendar, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Caching Hook
export const revalidate = 120; // Landing pages change organically slower than tickets.

type PageProps = {
    params: { slug: string }
};

// Parse 'chittagong-to-dhaka' -> { from: 'chittagong', to: 'dhaka' }
function parseSlug(slug: string) {
    const parts = slug.toLowerCase().split("-to-");
    if (parts.length !== 2) return null;
    return { 
        fromRaw: parts[0], 
        toRaw: parts[1],
        fromFormated: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
        toFormated: parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const route = parseSlug(params.slug);
    if (!route) return { title: "Route Not Found" };

    return {
        title: `Buy Authentic Eid Tickets: ${route.fromFormated} to ${route.toFormated} | ETR`,
        description: `Compare prices, avoid scalpers, and instantly purchase secure bus, train, and air tickets passing from ${route.fromFormated} to ${route.toFormated}. Escrow Protected.`,
    }
}

export default async function RouteLandingPage({ params }: PageProps) {
    const route = parseSlug(params.slug);
    if (!route) return notFound();

    const tickets = await prisma.ticket.findMany({
        where: {
            status: "ACTIVE",
            routeFrom: { contains: route.fromRaw },
            routeTo: { contains: route.toRaw }
        },
        orderBy: { travelDate: "asc" },
        // Cap UI at 100 on Landing pages to protect server compute natively
        take: 100
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Global Navbar */}
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
               
               {/* SEO Optimized Header H1 */}
               <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white mb-8 shadow-xl relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-sm tracking-widest uppercase mb-4">
                         <Link href="/find-tickets" className="hover:text-white transition">Marketplace</Link> <ChevronRight size={14}/> {route.fromFormated} Tracker
                      </div>
                      <h1 className="text-4xl md:text-5xl font-black mb-4">
                         Secure tickets from {route.fromFormated} to {route.toFormated}.
                      </h1>
                      <p className="text-gray-300 font-medium text-lg max-w-2xl">
                         Don't risk scalpers. ETR verifies sellers automatically and locks your funds in Escrow until you receive your legitimate seat successfully.
                      </p>
                   </div>
               </div>

               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Available Departures ({tickets.length})</h2>
               </div>

               {/* Ticket Grid Engine */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tickets.length === 0 ? (
                      <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-100 card-shadow">
                          <div className="text-gray-400 mb-2"><MapPin size={40} className="mx-auto opacity-50"/></div>
                          <h3 className="text-lg font-bold text-gray-900">No active tickets found on this specific route right now.</h3>
                          <p className="text-gray-500 max-w-md mx-auto mt-2">Check back closer to Eid or expand your search to nearby regions.</p>
                          <Link href="/find-tickets" className="mt-6 inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition">View Global Marketplace</Link>
                      </div>
                  ) : (
                      tickets.map(t => (
                          <div key={t.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 group flex flex-col justify-between h-full relative overflow-hidden">
                             <div>
                               <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <div className="text-[10px] font-bold tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded w-fit uppercase mb-2">{t.transportType}</div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{t.company}</h3>
                                 </div>
                                 <div className="text-right">
                                    <span className="text-2xl font-black text-gray-900">৳{t.sellingPrice || t.originalPrice}</span>
                                    <div className="text-xs text-gray-500 line-through">৳{t.originalPrice}</div>
                                 </div>
                               </div>
                               
                               <div className="space-y-3 mb-6">
                                 <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                    <MapPin size={16} className="text-gray-400"/> {t.routeFrom} → {t.routeTo}
                                 </div>
                                 <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                    <Calendar size={16} className="text-gray-400"/> {new Date(t.travelDate).toLocaleDateString()}
                                 </div>
                                 <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                    <Clock size={16} className="text-gray-400"/> {t.departureTime} (Seat: {t.seatNumber})
                                 </div>
                               </div>
                             </div>
                             
                             <div className="border-t border-gray-100 pt-4 mt-auto">
                                <Link href={`/ticket/${t.id}`} className="w-full text-center block bg-gray-50 hover:bg-blue-50 text-blue-600 font-bold py-3 rounded-xl transition-colors">
                                   Inspect & Purchase
                                </Link>
                             </div>
                          </div>
                      ))
                  )}
               </div>
            </main>
        </div>
    );
}
