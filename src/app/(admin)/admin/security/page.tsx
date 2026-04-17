"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, CheckCircle, Activity, AlertTriangle, XCircle } from "lucide-react";

type SecurityEvent = {
  id: string;
  eventType: string;
  severity: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  isResolved: boolean;
  createdAt: string;
};

type QuarantinedProfile = {
  id: string;
  user: { id: string, name: string; email: string };
  score: number;
  quarantineReason: string;
  quarantineTime: string;
  lastTriggeredEvent: string;
};

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [quarantined, setQuarantined] = useState<QuarantinedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/security?filter=${filter}`);
      const data = await res.json();
      if (res.ok) {
         setEvents(data.events);
         if (data.quarantinedProfiles) setQuarantined(data.quarantinedProfiles);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const toggleResolved = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch("/api/admin/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isResolved: !currentState })
      });
      if (res.ok) fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-red-500 mt-1" /> Security Operations Center
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Monitor anomalous IPs, fraud triggers, and strict system blocks.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All Events</button>
           <button onClick={() => setFilter("unresolved")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "unresolved" ? "bg-white text-gray-900 shadow-sm flex items-center gap-1.5" : "text-gray-500 hover:text-gray-700 flex items-center gap-1.5"}`}>
              {filter === "unresolved" && <AlertTriangle size={14} className="text-red-500"/>} Unresolved First
           </button>
        </div>
      </div>

      {!loading && quarantined.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
           <h2 className="text-xl font-bold text-red-900 flex items-center gap-2 mb-4">
             <AlertTriangle size={24} className="text-red-600"/> Critical: Quarantined Accounts ({quarantined.length})
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quarantined.map(q => (
                 <div key={q.id} className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="font-bold text-gray-900 text-lg">{q.user?.name}</div>
                          <div className="text-sm font-mono text-gray-500">{q.user?.email}</div>
                       </div>
                       <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded-xl shadow-inner">
                          {q.score}
                       </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-100 px-2 py-1 rounded-md">Heuristic Lock</span>
                       <p className="mt-2 text-sm font-medium text-gray-700">{q.quarantineReason}</p>
                       <p className="mt-1 text-xs font-mono text-gray-400">Triggered: {new Date(q.quarantineTime).toLocaleString()}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-400 font-medium">Scanning telemetry layer...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 border-b border-gray-100">Event / Severity</th>
                  <th className="p-4 border-b border-gray-100">Network Intel (IP / UA)</th>
                  <th className="p-4 border-b border-gray-100 w-1/3">Target / JSON Payload</th>
                  <th className="p-4 border-b border-gray-100 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 font-mono tracking-tight text-sm">{ev.eventType}</div>
                      <div className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit uppercase tracking-widest ${getSeverityStyle(ev.severity)}`}>
                        {ev.severity}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2 font-mono">{new Date(ev.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><Activity size={14} className="text-blue-400"/> {ev.ipAddress || "Unknown"}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2" title={ev.userAgent || ""}>
                        {ev.userAgent || "No Agent Provided"}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {ev.userId && <div className="text-xs font-bold text-gray-700 mb-1">User Auth ID: <span className="font-mono">{ev.userId}</span></div>}
                      {ev.details && (
                         <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 overflow-x-auto">
                           <pre className="text-[10px] sm:text-xs text-green-400 font-mono tracking-tighter">
                             {JSON.stringify(ev.details, null, 2)}
                           </pre>
                         </div>
                      )}
                    </td>
                    <td className="p-4 align-top text-right">
                       {ev.isResolved ? (
                         <button onClick={() => toggleResolved(ev.id, ev.isResolved)} className="text-xs font-bold text-gray-400 flex items-center justify-end gap-1.5 w-full hover:text-orange-500 transition-colors">
                            <CheckCircle size={14} className="text-green-500" /> Resolved
                         </button>
                       ) : (
                         <button onClick={() => toggleResolved(ev.id, ev.isResolved)} className="bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                            Mark Resolved
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">System telemetry is clear. No events logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
