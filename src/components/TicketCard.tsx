"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, BadgeCheck, Share2, Heart, Bell } from 'lucide-react';

interface Seller {
  name: string;
  avatar: string | null;
  verified: boolean;
  rating: number;
}

interface TicketProps {
  id: string; // TKT-XXXX
  transportType: string;
  company: string;
  routeFrom: string;
  routeTo: string;
  travelDate: string;
  departureTime: string;
  seatNumber: string;
  classType: string;
  
  // Sleeper specifics
  isSleeper: boolean;
  deckOption?: string | null;
  
  originalPrice: number;
  sellingPrice: number | null;
  seller: Seller;
  
  onBuy?: () => void;
  onView?: () => void;
}

export const TicketCard: React.FC<TicketProps> = ({
  id, transportType, company, routeFrom, routeTo, travelDate, departureTime, seatNumber,
  classType, isSleeper, deckOption, originalPrice, sellingPrice, seller, onBuy, onView
}) => {
  const currentPrice = sellingPrice || originalPrice;
  const isDiscounted = sellingPrice && sellingPrice < originalPrice;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)' }}
      className="bg-white rounded-2xl p-5 border border-gray-100 card-shadow relative overflow-hidden flex flex-col md:flex-row gap-5"
    >
      {/* Quick Actions (Floating top right) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-full p-2"><Share2 size={16} /></button>
        <button className="text-gray-400 hover:text-green-600 transition-colors bg-gray-50 rounded-full p-2"><Bell size={16} /></button>
        <button className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full p-2"><Heart size={16} /></button>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
            {transportType}
          </span>
          <span className="text-xs text-gray-500 font-medium">Ticket ID: {id}</span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{company}</h3>
        
        <div className="flex items-center gap-2 text-primary font-semibold mb-4 text-sm bangla-text">
          <MapPin size={16} /> {routeFrom} <span className="text-gray-400">→</span> {routeTo}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold text-sm">{travelDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Time</p>
            <p className="font-semibold text-sm flex gap-1 items-center"><Clock size={12}/> {departureTime}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Seat(s)</p>
            <p className="font-semibold text-sm">{seatNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Class</p>
            <p className="font-semibold text-sm">{classType}</p>
          </div>
        </div>

        {/* Sleeper Conditional Logic */}
        {transportType.toUpperCase() === 'BUS' && isSleeper && (
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-4 w-fit inline-flex gap-2 items-center">
            <span className="text-blue-700 text-xs font-bold uppercase tracking-wider">🛏️ Sleeper:</span>
            <span className="text-sm font-semibold">{deckOption} Deck</span>
          </div>
        )}

      </div>

      {/* Right Column: Pricing & Seller & Actions */}
      <div className="md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5 flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-end gap-2 mb-1">
            <p className="text-3xl font-bold text-gray-900">৳{currentPrice}</p>
            {isDiscounted && (
              <p className="text-sm text-gray-400 line-through mb-1">৳{originalPrice}</p>
            )}
          </div>
          {isDiscounted && <p className="text-green-600 text-xs font-semibold">You save ৳{originalPrice - currentPrice}</p>}
        </div>

        {/* Seller Info Block */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 overflow-hidden">
             {seller.avatar ? <img object-fit="cover" src={seller.avatar} alt="Seller avatar" /> : seller.name[0]}
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1">
              ***{seller.name.slice(seller.name.length - 4)}
              {seller.verified && <BadgeCheck size={14} className="text-blue-500"/>}
            </p>
            <p className="text-xs text-orange-500 font-medium">★ {seller.rating} / 5 Rating</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={onBuy} className="w-full bg-primary hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-green-200">
            Buy Ticket
          </button>
          <button onClick={onView} className="w-full bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};
