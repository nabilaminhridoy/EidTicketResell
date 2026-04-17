"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Ticket, Activity, Wallet, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAnalytics(data.analytics);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center pt-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3 font-semibold">
           <AlertCircle /> Failed to sync dashboard telemetry: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
           <ShieldCheck className="text-primary mt-1" /> Super Admin Control Center
        </h1>
        <p className="text-gray-500 mt-1 font-medium">Real-time system telemetry and moderation overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Earnings Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900 p-6 rounded-3xl text-white relative overflow-hidden card-shadow">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-400 font-semibold text-sm">Platform Earnings</span>
            <div className="bg-white/10 p-2 rounded-xl"><Wallet size={20} className="text-green-400" /></div>
          </div>
          <h2 className="text-4xl font-bold font-mono tracking-tight text-white mb-1">৳{analytics?.totalEarnings.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">Total collected from 1% commission.</p>
        </motion.div>

        {/* Users Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl card-shadow border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-500 font-semibold text-sm">Total Accounts</span>
            <div className="bg-blue-50 p-2 rounded-xl"><Users size={20} className="text-blue-500" /></div>
          </div>
          <h2 className="text-4xl font-bold font-mono tracking-tight text-gray-900 mb-1">{analytics?.totalUsers.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">Registered users on platform.</p>
        </motion.div>

        {/* Tickets Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl card-shadow border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-500 font-semibold text-sm">Total Tickets (All Time)</span>
            <div className="bg-orange-50 p-2 rounded-xl"><Ticket size={20} className="text-orange-500" /></div>
          </div>
          <h2 className="text-4xl font-bold font-mono tracking-tight text-gray-900 mb-1">{analytics?.totalTickets.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">Includes Active, Sold, and Cancelled.</p>
        </motion.div>

        {/* Active Market Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-3xl card-shadow border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-500 font-semibold text-sm">Active In Market</span>
            <div className="bg-green-50 p-2 rounded-xl"><Activity size={20} className="text-green-500" /></div>
          </div>
          <h2 className="text-4xl font-bold font-mono tracking-tight text-gray-900 mb-1">{analytics?.activeTickets.toLocaleString()}</h2>
          <p className="text-xs text-gray-400">Currently searching for buyers.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 card-shadow border border-gray-100">
           <h3 className="text-xl font-bold text-gray-900 mb-6">Financial Telemetry</h3>
           
           <div className="flex flex-col gap-4">
             <div className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-gray-300 transition-colors">
               <div>
                 <h4 className="font-bold text-gray-700 text-sm">Escrow Locked Funds</h4>
                 <p className="text-xs text-gray-400">Funds awaiting buyer confirmation to clear.</p>
               </div>
               <span className="font-mono text-xl font-bold tracking-tight text-orange-500">৳{analytics?.platformHoldings.escrow.toLocaleString()}</span>
             </div>
             <div className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-gray-300 transition-colors">
               <div>
                 <h4 className="font-bold text-gray-700 text-sm">Available (Withdrawable)</h4>
                 <p className="text-xs text-gray-400">Total liquid funds held in user wallets.</p>
               </div>
               <span className="font-mono text-xl font-bold tracking-tight text-green-500">৳{analytics?.platformHoldings.liquid.toLocaleString()}</span>
             </div>
             <div className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-gray-300 transition-colors">
               <div>
                 <h4 className="font-bold text-gray-700 text-sm">Total Completed Transactions</h4>
                 <p className="text-xs text-gray-400">Successful payouts across platform.</p>
               </div>
               <span className="font-mono text-xl font-bold tracking-tight text-gray-900">{analytics?.transactions.toLocaleString()}</span>
             </div>
           </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200/50 flex flex-col justify-center items-center text-center">
            <ShieldCheck size={48} className="text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Automated Fraud Detection</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              The ETR engine is constantly auditing transactions. Suspicious IPs and rapid withdrawal attempts are automatically logged in the audit trail.
            </p>
            <button className="mt-6 bg-white border border-gray-200 hover:border-primary text-gray-700 font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all text-sm w-full">
               View Audit Logs
            </button>
        </div>
      </div>

    </div>
  );
}