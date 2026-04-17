import React from "react";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Clock, ShieldCheck, ShoppingCart } from "lucide-react";
import Link from "next/link";

// ISR Revalidation Caching Hook - Protects Database Loads
export const revalidate = 60; // Regenerate every 60 seconds

type PageProps = {
   params: { id: string }
};

// OpenGraph Dynamic Generator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
   const ticket = await prisma.ticket.findUnique({ where: { id: params.id }});
   if (!ticket) return { title: "Ticket Not Found | ETR" };

   const shareTitle = `${ticket.routeFrom} to ${ticket.routeTo} Ticket - ${ticket.company} | ৳${ticket.sellingPrice || ticket.originalPrice}`;
   const shareDesc = `Secure authentic travel tickets for Eid. Departing ${new Date(ticket.travelDate).toLocaleDateString()} at ${ticket.departureTime}. Escrow Protected.`;

   return {
       title: shareTitle,
       description: shareDesc,
       openGraph: {
           title: shareTitle,
           description: shareDesc,
           type: "website",
           siteName: "EidTicketResell Marketplace",
           images: ["/og-share-default.png"] // Placeholder for global social card.
       },
       twitter: {
           card: "summary_large_image",
           title: shareTitle,
           description: shareDesc
       }
   };
}

export default async function PublicTicketViewer({ params }: PageProps) {
   const ticket = await prisma.ticket.findUnique({
       where: { id: params.id },
       include: {
          seller: { select: { id: true, name: true, createdAt: true } }
       }
   });

   if (!ticket || ticket.status !== 'ACTIVE') {
       return notFound();
   }

   const userSince = new Date(ticket.seller.createdAt).getFullYear();

   return (
       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
           <Link href="/find-tickets" className="text-gray-500 font-bold mb-8 hover:text-blue-600 transition">
              ← Return to Global Marketplace
           </Link>
           
           <div className="max-w-xl w-full bg-white rounded-3xl overflow-hidden card-shadow border border-gray-100">
               {/* Ticket Visual Header */}
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                     <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                  </div>
                  
                  <div className="text-xs uppercase tracking-widest font-bold mb-4 px-3 py-1 bg-white/20 rounded-full w-fit backdrop-blur-md">
                     {ticket.transportType}
                  </div>
                  
                  <h1 className="text-3xl font-black leading-none mb-1">{ticket.company}</h1>
                  <h2 className="text-xl font-medium text-blue-100 flex items-center gap-2">
                     <MapPin size={20}/> {ticket.routeFrom} <span className="text-blue-300">to</span> {ticket.routeTo}
                  </h2>
               </div>

               {/* Specs Container */}
               <div className="p-8 pb-4">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                     <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Date</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5 mt-1">
                           <Calendar size={16} className="text-blue-500"/> {new Date(ticket.travelDate).toLocaleDateString()}
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Departure</div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5 mt-1">
                           <Clock size={16} className="text-blue-500"/> {ticket.departureTime}
                        </div>
                     </div>
                     <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Seat Range</div>
                        <div className="font-semibold text-gray-900 text-lg mt-1">{ticket.seatNumber}</div>
                     </div>
                     <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Ticket Class</div>
                        <div className="font-semibold text-gray-900 mt-1">{ticket.ticketType}</div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
                     <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                        <ShieldCheck size={20}/>
                     </div>
                     <div>
                        <div className="text-sm font-bold text-gray-900">Seller Authenticated</div>
                        <div className="text-xs text-gray-500">Registered member since {userSince}. ETR Escrow Protected.</div>
                     </div>
                  </div>
                  
                  {/* Price Block */}
                  <div className="flex items-end justify-between mb-8 pb-6 border-b border-gray-100">
                     <div>
                        <div className="text-sm font-semibold text-gray-500">Market Price</div>
                        <div className="text-xs text-gray-400 line-through">৳{ticket.originalPrice}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-sm font-bold text-green-600 mb-1">Asking Price</div>
                        <div className="text-4xl font-black text-gray-900 leading-none">৳{ticket.sellingPrice || ticket.originalPrice}</div>
                     </div>
                  </div>

                  <Link href={`/buy/${ticket.id}`} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-4 rounded-2xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                     <ShoppingCart size={22}/> Acquire Ticket Safely
                  </Link>

                  <div className="text-center mt-4">
                     <p className="text-xs text-gray-400 font-medium tracking-tight">Funds are locked seamlessly by ETR Escrow until verification is met.</p>
                  </div>
               </div>
           </div>
       </div>
   );
}
