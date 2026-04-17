"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Clock, Lock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownToLine, Loader2 } from 'lucide-react';

export default function WalletBalancePage() {
  const [wallet, setWallet] = useState<{available: number, pending: number, locked: number, total: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch('/api/wallet');
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setWallet({
          available: data.wallet.available,
          pending: data.wallet.pending,
          locked: data.wallet.locked,
          total: data.wallet.totalHoldings
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Wallet className="text-primary" /> My Wallet & Escrow
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your available funds and track held tickets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold text-gray-700 transition-colors flex items-center gap-2 text-sm shadow-sm">
             <ArrowUpRight size={16}/> View Transactions
          </button>
          <button className="bg-primary hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold text-white transition-colors flex items-center gap-2 text-sm shadow-sm shadow-green-200">
             <ArrowDownToLine size={16}/> Withdraw Funds
          </button>
        </div>
      </div>

      {loading ? (
         <div className="bg-white rounded-3xl p-12 card-shadow border border-gray-100 flex items-center justify-center min-h-[300px]">
           <Loader2 className="animate-spin text-gray-400" size={32} />
         </div>
      ) : error ? (
         <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-2 font-semibold">
           <AlertCircle /> Failed to load wallet context: {error}
         </div>
      ) : (
        <>
          {/* Main Balance Banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden card-shadow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <span className="text-gray-400 font-semibold text-sm uppercase tracking-wider block mb-2">Total Holdings (All States)</span>
              <div className="text-4xl md:text-5xl font-bold font-mono tracking-tight">৳ {wallet?.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 relative z-10 border-t border-gray-800 pt-8">
              
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-green-400 mb-2 font-semibold text-sm">
                   <CheckCircle2 size={16}/> Available for Withdrawal
                </div>
                <div className="text-2xl font-bold tracking-tight">৳ {wallet?.available.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <p className="text-gray-400 text-xs mt-2">Funds cleared from escrow.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-orange-400 mb-2 font-semibold text-sm">
                   <Clock size={16}/> Pending Balance
                </div>
                <div className="text-2xl font-bold tracking-tight">৳ {wallet?.pending.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <p className="text-gray-400 text-xs mt-2">Tickets delivered, waiting for buyer confirmation.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 text-blue-400 mb-2 font-semibold text-sm">
                   <Lock size={16}/> Escrow Locked
                </div>
                <div className="text-2xl font-bold tracking-tight">৳ {wallet?.locked.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <p className="text-gray-400 text-xs mt-2">Active listings currently being processed.</p>
              </div>
              
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100">
               <h3 className="font-bold text-gray-900 mb-6 text-lg">Withdrawal Instructions</h3>
               <ul className="text-sm text-gray-600 space-y-4">
                 <li className="flex items-start gap-2"><CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16}/> You must complete ID Verification before making withdrawals.</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16}/> Withdrawals are processed to bKash or Nagad automatically.</li>
                 <li className="flex items-start gap-2"><CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16}/> Escrow funds (Pending) become available 24 hours after successful travel.</li>
               </ul>
            </div>
            <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100 flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4">
                 <ShieldCheck size={32} />
               </div>
               <h3 className="font-bold text-gray-900 mb-2 text-lg">Account Protection Enabled</h3>
               <p className="text-sm text-gray-500">Every withdrawal requires Email/SMS OTP authorization for maximum security.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Missing import added locally
const ShieldCheck = require('lucide-react').ShieldCheck;