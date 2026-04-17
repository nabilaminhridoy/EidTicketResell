import React from "react";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import CheckoutButton from "./CheckoutButton";
import { ShieldCheck, MapPin, Calendar, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic"; // NO CACHING. 100% Real-Time check.

type PageProps = {
   params: { id: string }
};

export default async function SecureCheckoutPage({ params }: PageProps) {
    const token = cookies().get("auth_token")?.value;
    
    // Auth Bounds
    if (!token) {
        redirect(`/user/login?redirect=/buy/${params.id}`);
    }

    const session = await verifyToken(token);
    if (!session) {
        redirect(`/user/login?redirect=/buy/${params.id}`);
    }

    // Ticket State verification
    const ticket = await prisma.ticket.findUnique({
        where: { id: params.id },
        include: { seller: { select: { id: true, name: true, createdAt: true } } }
    });

    if (!ticket || ticket.status !== 'ACTIVE') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 card-shadow max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32}/></div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Ticket Unavailable</h1>
                    <p className="text-gray-500 font-medium mb-8">This ticket has already been purchased or removed by the seller. Escrow cannot lock this asset.</p>
                    <Link href="/find-tickets" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition inline-block">Return to Marketplace</Link>
                </div>
            </div>
        );
    }

    const platformFee = 50; // Conceptual standard platform fee internally (you can draw from settings realistically)
    const finalPrice = (ticket.sellingPrice || ticket.originalPrice) + platformFee;

    // Reject Self-Buying natively
    if (ticket.sellerId === session.id) {
       return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 card-shadow max-w-md w-full text-center">
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Checkout Error</h1>
                    <p className="text-gray-500 font-medium mb-8">You cannot buy your own ticket.</p>
                    <Link href="/find-tickets" className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition inline-block">Go Back</Link>
                </div>
            </div>
       )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
                
                <h1 className="text-3xl font-black text-gray-900 mb-8 w-full">Secure Checkout</h1>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
                    
                    {/* Left Panel: Ticket Details */}
                    <div className="md:col-span-3 bg-white rounded-3xl p-6 md:p-8 card-shadow border border-gray-100 h-fit">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-12 h-12 bg-blue-100 text-blue-600 font-bold rounded-2xl flex items-center justify-center">
                              {ticket.transportType.charAt(0)}
                           </div>
                           <div>
                              <h2 className="text-xl font-bold text-gray-900">{ticket.company}</h2>
                              <div className="text-sm text-gray-500 font-medium">{ticket.transportType}</div>
                           </div>
                        </div>

                        <div className="space-y-4 mb-8">
                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                               <div className="flex items-center gap-3 text-gray-600 font-medium"><MapPin size={18} className="text-gray-400"/> Route</div>
                               <div className="font-bold text-gray-900">{ticket.routeFrom} → {ticket.routeTo}</div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                               <div className="flex items-center gap-3 text-gray-600 font-medium"><Calendar size={18} className="text-gray-400"/> Date</div>
                               <div className="font-bold text-gray-900">{new Date(ticket.travelDate).toLocaleDateString()}</div>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                               <div className="flex items-center gap-3 text-gray-600 font-medium"><Clock size={18} className="text-gray-400"/> Time & Seat</div>
                               <div className="font-bold text-gray-900">{ticket.departureTime} (Seat: {ticket.seatNumber})</div>
                           </div>
                        </div>

                        <div className="p-5 border border-green-100 bg-green-50 rounded-2xl flex items-start gap-4">
                           <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={24}/>
                           <div>
                              <h3 className="font-bold text-gray-900">Seller Authenticated • ETR Escrow</h3>
                              <p className="text-sm text-gray-600 mt-1">This ticket is provided by a verified member. Your wallet funds will be placed into a secure Escrow holding immediately upon purchase constraint execution.</p>
                           </div>
                        </div>
                    </div>

                    {/* Right Panel: Receipt & Trigger */}
                    <div className="md:col-span-2 space-y-6">
                       
                       <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-gray-100">
                          <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Payment Summary</h3>
                          
                          <div className="space-y-3 mb-6">
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Ticket Original Price</span>
                                <span className="font-bold text-gray-900 line-through text-gray-400">৳{ticket.originalPrice}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Market Ask Price</span>
                                <span className="font-bold text-gray-900">৳{ticket.sellingPrice || ticket.originalPrice}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Platform Fee</span>
                                <span className="font-bold text-gray-900">৳{platformFee}</span>
                             </div>
                          </div>

                          <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                              <span className="text-gray-900 font-bold">Total Payout</span>
                              <span className="text-2xl font-black text-blue-600">৳{finalPrice}</span>
                          </div>

                          <CheckoutButton ticketId={ticket.id} amount={finalPrice} />
                       </div>

                       <div className="bg-gray-100 rounded-2xl p-6 text-sm text-gray-500 font-medium inline-block w-full">
                          By confirming, you agree to the <Link href="/" className="text-blue-600 underline">ETR Dispute Terms.</Link>
                       </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
