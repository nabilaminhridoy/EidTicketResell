"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertCircle, MapPin, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SellTicketsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [transportType, setTransportType] = useState('BUS');
  const [classType, setClassType] = useState('');
  const [deliveryType, setDeliveryType] = useState('ONLINE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  // Determine Class Options statically based on request logic
  const getClassOptions = () => {
    switch (transportType) {
      case 'BUS': return ['Non-AC Economy', 'Non-AC Business', 'AC Economy', 'AC Business', 'Sleeper', 'Suit Class Business', 'Suit Class Sleeper'];
      case 'TRAIN': return ['AC-B', 'AC-S', 'SNIGDHA', 'F-BERTH', 'F-SEAT', 'F-CHAIR', 'S-CHAIR', 'SHOVAN', 'SHULOV', 'AC-CHAIR'];
      case 'LAUNCH': return ['Standing', 'Non-AC Seat', 'AC Seat', 'Non-AC Cabin', 'AC Cabin', 'VIP Cabin'];
      case 'AIR': return ['Economy', 'Premium Economy', 'Business', 'First Class'];
      default: return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('transport', transportType);
    formData.append('isAC', classType.includes('AC') ? 'true' : 'false');
    formData.append('isSleeper', classType.includes('Sleeper') ? 'true' : 'false');
    
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: formData // Note: FormData automatically handles multipart bounds
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create listing.");
      
      router.push('/user/listings?success=true');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 pb-20 px-5">
      <form onSubmit={handleSubmit} className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sell Your Ticket</h1>
          <p className="text-gray-500 text-sm">Secure escrow, instant buyers, low 1% commission.</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-10 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 h-[2px] bg-primary -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Ticket Details' },
            { num: 3, label: 'Delivery & Pricing' }
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
                step >= s.num ? 'bg-primary text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 md:p-10 card-shadow border border-gray-100 relative">
          
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle size={16}/> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Type *</label>
                    <select 
                      value={transportType}
                      onChange={(e) => { setTransportType(e.target.value); setClassType(''); }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="BUS">Bus</option>
                      <option value="TRAIN">Train</option>
                      <option value="LAUNCH">Launch</option>
                      <option value="AIR">Air</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Type *</label>
                    <select className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none">
                      <option>Online Copy (PDF)</option>
                      <option>Counter Copy (Image/PDF)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6 border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-green-50 transition-colors cursor-pointer group relative overflow-hidden">
                  <input name="ticketImage" type="file" accept=".pdf,image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform pointer-events-none">
                    <UploadCloud className="text-primary" size={28} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 pointer-events-none">Upload Ticket File (Max 5MB)</h3>
                  <p className="text-xs text-gray-500 mb-4 text-center pointer-events-none">PDF for Online Copy. PDF, JPG, PNG for Counter Copy.</p>
                  <button type="button" className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-2 rounded-lg shadow-sm hover:border-primary pointer-events-none">
                    Browse File
                  </button>
                  <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1 pointer-events-none"><AlertCircle size={10}/> Files are securely scanned and checked before storage in Cloudinary.</p>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Ticket Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">PNR / Ticket Number *</label>
                    <input name="pnr" required type="text" placeholder="e.g. 8329DK92" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                    <input name="company" required type="text" placeholder="e.g. Green Line Paribahan" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Route From *</label>
                    <div className="flex items-center">
                      <MapPin size={18} className="absolute left-4 text-gray-400" />
                      <input name="origin" required type="text" placeholder="Departure City" className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Route To *</label>
                    <div className="flex items-center">
                      <MapPin size={18} className="absolute left-4 text-orange-500" />
                      <input name="destination" required type="text" placeholder="Destination City" className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Travel Date *</label>
                    <input name="date" required type="date" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Departure Time *</label>
                    <input name="time" required type="time" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Seat / Coach No.</label>
                    <input name="seat" type="text" placeholder="e.g. A1, A2" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Class Type *</label>
                    <select 
                      value={classType}
                      onChange={(e) => setClassType(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="" disabled>Select Class</option>
                      {getClassOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  
                  {/* SLEEPER CONDITION */}
                  {transportType === 'BUS' && classType.toLowerCase().includes('sleeper') && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Sleeper Deck *</label>
                      <select className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-blue-50 text-blue-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option>Upper Deck</option>
                        <option>Lower Deck</option>
                      </select>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Delivery & Pricing</h2>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Delivery Options Available *</label>
                  <div className="flex flex-col gap-3">
                    <label className={`border rounded-xl p-4 cursor-pointer flex items-start gap-4 transition-colors ${deliveryType === 'ONLINE' ? 'bg-green-50 border-primary' : 'bg-white border-gray-200 hover:border-primary'}`}>
                      <input type="radio" name="deliveryMethod" value="ONLINE" checked={deliveryType === 'ONLINE'} onChange={(e) => setDeliveryType(e.target.value)} className="mt-1 w-4 h-4 text-primary focus:ring-primary" />
                      <div>
                        <h4 className="font-bold text-gray-900">Online Escrow System</h4>
                        <p className="text-xs text-gray-500 mt-1">Platform holds money until buyer confirms ticket. 1% commission deducted.</p>
                      </div>
                    </label>
                    <label className={`border rounded-xl p-4 cursor-pointer flex items-start gap-4 transition-colors ${deliveryType === 'IN_PERSON' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200 hover:border-orange-500'}`}>
                      <input type="radio" name="deliveryMethod" value="IN_PERSON" checked={deliveryType === 'IN_PERSON'} onChange={(e) => setDeliveryType(e.target.value)} className="mt-1 w-4 h-4 text-orange-500 focus:ring-orange-500" />
                      <div className="w-full">
                        <h4 className="font-bold text-gray-900">In-Person Meetup (QR Code)</h4>
                        <p className="text-xs text-gray-500 mt-1">Meet buyer, they scan your code, system releases payment.</p>
                        {deliveryType === 'IN_PERSON' && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                             <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Map size={16}/> Select Meetup Location</div>
                             {/* Map Placeholder */}
                             <div className="h-32 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 text-xs">Google Maps Autocomplete Input & Map Drop Pin Integration Placeholder</div>
                          </div>
                        )}
                      </div>
                    </label>
                    <label className={`border rounded-xl p-4 cursor-pointer flex items-start gap-4 transition-colors ${deliveryType === 'COURIER' ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'}`}>
                      <input type="radio" name="deliveryMethod" value="COURIER" checked={deliveryType === 'COURIER'} onChange={(e) => setDeliveryType(e.target.value)} className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500" />
                      <div className="w-full">
                        <h4 className="font-bold text-gray-900">Courier (COD System)</h4>
                        <p className="text-xs text-gray-500 mt-1">Ship the ticket. Courier collects cash and transfers to you.</p>
                        {deliveryType === 'COURIER' && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs font-semibold text-gray-700 mb-1">Courier Service</label>
                               <select className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-blue-500 outline-none">
                                 <option>Pathao</option><option>Steadfast</option><option>RedX</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-xs font-semibold text-gray-700 mb-1">Courier Fee (৳)</label>
                               <input type="number" placeholder="e.g. 150" className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-blue-500 outline-none" />
                             </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Original Ticket Price (৳) *</label>
                    <input name="price" required type="number" placeholder="0" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Selling Price (৳)</label>
                    <input name="sellingPrice" type="number" placeholder="Optional. If discount." className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button 
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || isSubmitting}
            className={`px-8 py-3 rounded-xl font-bold transition-colors ${step === 1 ? 'opacity-0 select-none cursor-default' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="bg-primary hover:bg-green-700 text-white shadow-sm shadow-green-200 px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              Continue
            </button>
          ) : (
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-blue-700 text-white shadow-sm shadow-blue-200 px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? 'Uploading...' : <><CheckCircle2 size={18}/> Publish Listing</>}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
