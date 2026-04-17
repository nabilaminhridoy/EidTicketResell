"use client";

import React, { useState, useEffect } from 'react';
import { useTicketStore } from '@/store/useTicketStore';
import { TicketCard } from '@/components/TicketCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, SlidersHorizontal, MapPin, Loader2, AlertCircle } from 'lucide-react';

export default function FindTicketsPage() {
  const { transportType, departureCity, destinationCity, date, sortBy, setFilter } = useTicketStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logic dependent on filters
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (transportType) query.append('transport', transportType);
        if (departureCity) query.append('from', departureCity);
        if (destinationCity) query.append('to', destinationCity);
        if (date) query.append('date', date);

        const res = await fetch(`/api/tickets?${query.toString()}`);
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || "Failed to load tickets");
        setTickets(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce wrapper
    const timer = setTimeout(() => { fetchTickets(); }, 500);
    return () => clearTimeout(timer);
  }, [transportType, departureCity, destinationCity, date, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Banner */}
      <div className="bg-primary pt-24 pb-12 px-5 text-center flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Find Eid Tickets Safely</h1>
        <p className="text-green-100 mb-8 max-w-xl text-sm md:text-base">
          Browse verified tickets from other passengers. Online escrow and safe meetup options available.
        </p>
        
        {/* Quick Search Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 w-full max-w-4xl">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 flex items-center px-4 py-2">
             <MapPin className="text-gray-400 mr-2" size={20} />
             <input type="text" placeholder="From (e.g. Dhaka)" className="w-full outline-none font-semibold text-gray-700" 
               onChange={(e) => setFilter('departureCity', e.target.value)} />
          </div>
          <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-100 flex items-center px-4 py-2">
             <MapPin className="text-orange-500 mr-2" size={20} />
             <input type="text" placeholder="To (e.g. Sylhet)" className="w-full outline-none font-semibold text-gray-700" 
               onChange={(e) => setFilter('destinationCity', e.target.value)} />
          </div>
          <div className="flex-[0.5] px-4 py-2 flex items-center">
             <input type="date" className="w-full outline-none text-gray-500 text-sm" 
               onChange={(e) => setFilter('date', e.target.value)} />
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors md:ml-2">
            Search
          </button>
        </div>
      </div>

      <div className="container mx-auto px-5 mt-10 flex flex-col lg:flex-row gap-8">
        
        {/* Filter Drawer Toggle (Mobile) */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="lg:hidden w-full bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-gray-700"
        >
          <SlidersHorizontal size={18} /> Filters & Sorting
        </button>

        {/* Filter Sidebar */}
        <AnimatePresence>
          {(isFilterOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`lg:w-1/4 bg-white rounded-2xl p-6 border border-gray-100 card-shadow h-fit ${isFilterOpen ? 'block' : 'hidden lg:block'}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2"><Filter size={18} /> Filters</h2>
              </div>

              {/* Transport Type */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Transport Type</h3>
                <div className="flex flex-col gap-2">
                  {['BUS', 'TRAIN', 'LAUNCH', 'AIR'].map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="transport" 
                        className="w-4 h-4 text-primary focus:ring-primary"
                        checked={transportType === type}
                        onChange={() => setFilter('transportType', type)}
                      />
                      <span className="text-sm text-gray-600 font-medium capitalize">{type.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Price Max (৳)</h3>
                <input type="range" min="0" max="10000" step="100" className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>৳0</span>
                  <span>৳10000+</span>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-700">Departure Time</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Morning', 'Afternoon', 'Evening', 'Night'].map((slot) => (
                    <button key={slot} className="border border-gray-200 text-gray-600 rounded-lg text-xs py-2 px-1 hover:border-primary hover:text-primary transition-colors focus:bg-green-50 focus:border-green-200">
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results List */}
        <div className="lg:w-3/4 flex flex-col gap-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 card-shadow">
            <p className="text-sm text-gray-500 font-medium">Showing <span className="font-bold text-gray-900">{tickets.length}</span> tickets</p>
            <select 
              className="text-sm font-semibold text-gray-700 bg-gray-50 border-none rounded-lg p-2 outline-none cursor-pointer"
              onChange={(e) => setFilter('sortBy', e.target.value)}
              value={sortBy}
            >
              <option>Newest First</option>
              <option>Price Low → High</option>
              <option>Price High → Low</option>
              <option>Travel Date Soonest</option>
              <option>Best Savings</option>
            </select>
          </div>

          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="flex justify-center items-center py-20 text-gray-400">
                 <Loader2 className="animate-spin" size={32} />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2">
                 <AlertCircle /> {error}
              </div>
            ) : tickets.length === 0 ? (
               <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">No Tickets Found</h3>
                  <p className="text-gray-500">Try adjusting your filters or date to see more results.</p>
               </div>
            ) : (
              tickets.map(ticket => (
                <TicketCard key={ticket.id} {...ticket} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
