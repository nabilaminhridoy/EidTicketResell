"use client";

import React, { useEffect, useState } from "react";
import { Server, Settings, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import { GATEWAY_REGISTRY } from "@/config/gateways";

type GatewayOverview = {
  id: string;
  identifier: string;
  name: string;
  status: boolean;
  logo: string | null;
  isSandbox: boolean;
};

export default function PaymentMethodsOverviewPage() {
  const [gateways, setGateways] = useState<GatewayOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/gateways")
      .then(res => res.json())
      .then(data => {
         if (data.success) setGateways(data.gateways);
         setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-8 text-gray-500 font-bold">Loading payment configurations...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="text-blue-600" size={32} /> Payment Methods
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Configure global payment processing schemas and credentials for secondary market transactions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {GATEWAY_REGISTRY.map((registryItem) => {
          // Join the registry mapping with active DB state
          const activeGw = gateways.find(g => g.identifier === registryItem.identifier);
          const isActive = activeGw?.status === true;

          return (
            <Link 
               href={`/admin/system-settings/payment-methods/${registryItem.identifier}`}
               key={registryItem.identifier}
               className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all group hover:shadow-xl ${isActive ? 'border-blue-200 hover:border-blue-500' : 'border-gray-100 hover:border-gray-300'}`}
            >
              <div className="flex justify-between items-start mb-6">
                 {activeGw?.logo ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={activeGw.logo} alt={registryItem.defaultName} className="h-10 w-auto object-contain rounded" />
                 ) : (
                     <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-tighter">
                        {registryItem.identifier.substring(0,3)}
                     </div>
                 )}
                 
                 <div className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isActive ? "Active" : "Disabled"}
                 </div>
              </div>
              
              <div>
                 <h3 className="font-bold text-gray-900 text-xl leading-tight flex items-center justify-between">
                    {registryItem.defaultName}
                    <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                 </h3>
                 <p className="text-sm text-gray-500 mt-1 line-clamp-2">{registryItem.defaultDescription}</p>
                 
                 <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded">
                       {registryItem.hasSandbox ? "Sandbox Mode Available" : "Live Operations Only"}
                    </span>
                 </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
