"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Activity, ShieldAlert, BadgeDollarSign, Map, Scaling, Filter } from "lucide-react";

type TrajectoryUnit = { date: string, revenue: number, escrowVolume: number };
type FunnelData = { name: string, count: number };
type RatioData = { name: string, value: number, fill: string };

type BIResponse = {
   windowDays: number;
   revenueTrajectory: TrajectoryUnit[];
   ticketFunnel: FunnelData[];
   disputeRatios: RatioData[];
   platformKpis: {
       totalActiveQuarantines: number;
       totalPlatformDisputes: number;
       topRiskScoreTracker: number;
   };
};

export default function BusinessIntelligenceDashboard() {
  const [data, setData] = useState<BIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [localWindow, setLocalWindow] = useState(7); // Default 7 as Approved

  const fetchBI = async (windowFrame: number) => {
     setLoading(true);
     try {
       const res = await fetch(`/api/admin/analytics?window=${windowFrame}`);
       const json = await res.json();
       if (json.success) {
           setData(json);
           setLocalWindow(json.windowDays);
       }
     } catch (e) {
       console.error("BI Fetch Failed", e);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
     fetchBI(7);
  }, []);

  if (loading) {
     return <div className="p-12 flex flex-col items-center justify-center text-blue-500 font-bold gap-3">
         <Activity className="animate-pulse" size={32} /> Syncing Vector Aggregations...
     </div>;
  }

  if (!data) return <div className="p-8 text-red-500 font-bold">Failed to load Business Intelligence Data.</div>;

  const totalWindowRevenue = data.revenueTrajectory.reduce((acc, obj) => acc + obj.revenue, 0);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto pb-20">
       
       {/* Dashboard Header Bar */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Scaling className="text-blue-600" /> BI Command Center
             </h1>
             <p className="text-gray-500 mt-1 font-medium text-sm">Visualizing global security, revenue growth, and conversion pipelines.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-xl">
             <button disabled={loading} onClick={() => fetchBI(7)} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${localWindow === 7 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Rolling 7-Day</button>
             <button disabled={loading} onClick={() => fetchBI(30)} className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors ${localWindow === 30 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Rolling 30-Day</button>
          </div>
       </div>

       {/* KIP Global Radar Blocks */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
             <div className="flex items-center gap-3 text-gray-500 mb-3"><BadgeDollarSign size={18} /> <span className="font-bold text-xs uppercase tracking-widest">Platform Commission</span></div>
             <div className="text-3xl font-black text-gray-900">৳{totalWindowRevenue.toFixed(0)}</div>
             <div className="text-xs text-green-500 font-bold mt-2 bg-green-50 w-fit px-2 py-1 rounded">Past {localWindow} Days</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
             <div className="flex items-center gap-3 text-gray-500 mb-3"><Activity size={18} /> <span className="font-bold text-xs uppercase tracking-widest">Active Quarantines</span></div>
             <div className="text-3xl font-black text-gray-900">{data.platformKpis.totalActiveQuarantines}</div>
             <div className="text-xs text-red-500 font-bold mt-2 bg-red-50 w-fit px-2 py-1 rounded flex items-center gap-1"><ShieldAlert size={12}/> Heuristic Locks</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
             <div className="flex items-center gap-3 text-gray-500 mb-3"><Filter size={18} /> <span className="font-bold text-xs uppercase tracking-widest">Open Disputes</span></div>
             <div className="text-3xl font-black text-gray-900">{data.platformKpis.totalPlatformDisputes}</div>
             <div className="text-xs text-orange-500 font-bold mt-2 bg-orange-50 w-fit px-2 py-1 rounded">Awaiting Resolution</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
             <div className="flex items-center gap-3 text-gray-500 mb-3"><ShieldAlert size={18} /> <span className="font-bold text-xs uppercase tracking-widest">Max Risk Tracker</span></div>
             <div className="text-3xl font-black text-gray-900">{data.platformKpis.topRiskScoreTracker}</div>
             <div className="text-xs text-gray-500 font-bold mt-2 bg-gray-50 w-fit px-2 py-1 rounded">Highest Single Score</div>
          </div>
       </div>

       {/* Vector Analytics Layers */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area Chart: Revenue / Escrow Volume */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
             <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
                Escrow Pipeline Trajectory
             </h2>
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data.revenueTrajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorEscrow" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} dy={10} />
                     <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} dx={-10} tickFormatter={(value) => `৳${value}`} />
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                     <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }}/>
                     <Area type="monotone" name="Global Escrow Activity" dataKey="escrowVolume" stroke="#10b981" fillOpacity={1} fill="url(#colorEscrow)" strokeWidth={2}/>
                     <Area type="monotone" name="Platform Revenue Captured" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3}/>
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Secondary Charts Stack */}
          <div className="flex flex-col gap-6">
             {/* Dispute Ratio Pie */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex-1">
                <h2 className="text-sm uppercase tracking-widest font-bold text-gray-500 mb-4 border-b border-gray-50 pb-4">Dispute Settlement Ratio</h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={data.disputeRatios} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                         {data.disputeRatios.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                       </Pie>
                       <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                     </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center flex-wrap gap-3 mt-2">
                   {data.disputeRatios.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }}></div> {d.name} ({d.value})
                      </div>
                   ))}
                </div>
             </div>

             {/* Conversion Funnel Bar */}
             <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex-1">
                <h2 className="text-sm uppercase tracking-widest font-bold text-gray-500 mb-4 border-b border-gray-50 pb-4">Ticket Lifecycle Funnel</h2>
                <div className="h-[200px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.ticketFunnel} margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 10}} tickLine={false} axisLine={false} width={100} />
                        <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
}
