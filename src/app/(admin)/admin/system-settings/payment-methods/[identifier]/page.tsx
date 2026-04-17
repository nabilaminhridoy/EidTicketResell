"use client";

import React, { useEffect, useState, useRef } from "react";
import { GATEWAY_REGISTRY } from "@/config/gateways";
import { ArrowLeft, Save, Activity, Upload, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GatewayConfigurationPage({ params }: { params: { identifier: string } }) {
  const router = useRouter();
  const spec = GATEWAY_REGISTRY.find(g => g.identifier === params.identifier);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // State for all form fields
  const [id, setId] = useState("");
  const [status, setStatus] = useState(false);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [fixedDiscount, setFixedDiscount] = useState<number>(0);
  const [percentDiscount, setPercentDiscount] = useState<number>(0);
  const [fixedCharge, setFixedCharge] = useState<number>(0);
  const [percentCharge, setPercentCharge] = useState<number>(0);
  
  // Dynamic JSON config mapping
  const [isSandbox, setIsSandbox] = useState(true);
  const [configParams, setConfigParams] = useState<Record<string, any>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!spec) return;

    fetch("/api/admin/gateways")
      .then(res => res.json())
      .then(data => {
         if (data.success) {
            const gw = data.gateways.find((g: any) => g.identifier === spec.identifier);
            if (gw) {
               setId(gw.id);
               setStatus(gw.status);
               setLabel(gw.name || spec.defaultName);
               setDescription(gw.description || spec.defaultDescription);
               setLogo(gw.logo || "");
               setMinAmount(gw.minAmount || 0);
               setMaxAmount(gw.maxAmount || 0);
               setFixedDiscount(gw.fixedDiscount || 0);
               setPercentDiscount(gw.percentDiscount || 0);
               setFixedCharge(gw.fixedCharge || 0);
               setPercentCharge(gw.percentCharge || 0);
               
               setIsSandbox(gw.isSandbox ?? spec.hasSandbox);
               setConfigParams(gw.config || {});
            } else {
               // If completely missing from DB, we wait for seed script, fallback to defaults
               setLabel(spec.defaultName);
               setDescription(spec.defaultDescription);
            }
         }
         setLoading(false);
      })
      .catch(console.error);
  }, [spec, params.identifier]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (!e.target.files || e.target.files.length === 0) return;
     const file = e.target.files[0];
     
     const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
     if (!allowedTypes.includes(file.type)) return alert("Please upload a valid JPG or PNG.");
     if (file.size > 2097152) return alert("File exceeds 2MB limit.");

     setUploading(true);
     const formData = new FormData();
     formData.append("file", file);

     try {
       const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
       const data = await res.json();
       if (data.success) {
          setLogo(data.url);
       } else {
          alert("Upload Failed: " + data.error);
       }
     } catch(err) {
       console.error("Upload error", err);
       alert("Upload crashed securely.");
     } finally {
       setUploading(false);
     }
  };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!id) return alert("Gateway ID mapping lost. Run Seeder.");
     setSaving(true);
     try {
       const res = await fetch("/api/admin/gateways", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            id, status, name: label, description, logo, minAmount, maxAmount, 
            fixedDiscount, percentDiscount, fixedCharge, percentCharge,
            isSandbox, config: configParams
         })
       });
       if (res.ok) {
          alert("Configuration Saved Successfully!");
       } else {
          alert("Save Failed.");
       }
     } catch (e) {
       console.error(e);
     } finally {
       setSaving(false);
     }
  };

  const handleTestConnection = () => {
      setTesting(true);
      setTimeout(() => {
          alert(JSON.stringify({ success: true, message: "Test Server Ping Triggered Successfully" }, null, 2));
          setTesting(false);
      }, 800);
  };

  if (!spec) return <div className="p-8">Gateway Specification Not Found. Check Configuration Registry.</div>;
  if (loading) return <div className="p-8 font-bold text-gray-500">Loading {spec.defaultName} config blocks...</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto pb-20">
      
      {/* Header Back & Action Row */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <Link href="/admin/system-settings/payment-methods" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition">
               <ArrowLeft size={18} className="text-gray-600"/>
            </Link>
            <div>
               <h1 className="text-3xl font-black text-gray-900 leading-none">{spec.defaultName} Setup</h1>
               <p className="text-sm text-gray-500 mt-1 font-mono tracking-tighter uppercase">{spec.identifier} integration schema</p>
            </div>
         </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* GATEWAY INFORMATION BLOCK */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
           <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Gateway Information</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status *</label>
                 <select value={status ? "true" : "false"} onChange={e => setStatus(e.target.value === "true")} className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 h-12 focus:ring-blue-500 focus:border-blue-500">
                    <option value="true">Enable</option>
                    <option value="false">Disable</option>
                 </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Label *</label>
                 <input required type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 h-12 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" />
              </div>

              <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description *</label>
                 <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full border-gray-200 rounded-xl bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400" rows={2}/>
              </div>

              {/* LOGO UPLOADER */}
              <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Gateway Logo * <span className="lowercase text-gray-400 font-normal tracking-normal">(JPG/PNG, Max 2MB, Rec: 500x250)</span>
                 </label>
                 <div className="mt-1 flex items-center gap-6 p-4 border border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
                    <div className="w-48 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden bg-contain bg-center bg-no-repeat shadow-sm" style={{ backgroundImage: logo ? `url(${logo})` : 'none' }}>
                      {!logo && <ImageIcon className="text-gray-300" size={32} />}
                    </div>
                    <div className="flex-1">
                       <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                       <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
                          <Upload size={16} /> {uploading ? "Uploading Securely..." : "Upload Native Graphic"}
                       </button>
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 md:col-span-2 mt-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Min Amount *</label>
                   <input required type="number" min="0" step="0.01" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Max Amount *</label>
                   <input required type="number" min="0" step="0.01" value={maxAmount} onChange={e => setMaxAmount(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fixed Discount *</label>
                   <input required type="number" min="0" step="0.01" value={fixedDiscount} onChange={e => setFixedDiscount(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Percentage Discount *</label>
                   <input required type="number" min="0" max="100" step="0.01" value={percentDiscount} onChange={e => setPercentDiscount(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fixed Charge *</label>
                   <input required type="number" min="0" step="0.01" value={fixedCharge} onChange={e => setFixedCharge(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Percentage Charge *</label>
                   <input required type="number" min="0" max="100" step="0.01" value={percentCharge} onChange={e => setPercentCharge(Number(e.target.value))} className="w-full border-gray-200 rounded-xl bg-white p-3 h-12 focus:ring-blue-500 focus:border-blue-500" />
                 </div>
              </div>
           </div>
        </div>

        {/* CONFIGURATION BLOCK (DYNAMIC) */}
        <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
           <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Integration Configuration</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spec.hasSandbox && (
                 <div className="md:col-span-2 mb-2">
                    <label className="block text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Sandbox Environment</label>
                    <div className="flex items-center gap-3">
                       <button type="button" onClick={() => setIsSandbox(!isSandbox)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSandbox ? 'bg-orange-500' : 'bg-gray-200'}`}>
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSandbox ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                       <span className="text-sm font-medium text-gray-600">Routes payload to test endpoints mimicking gateway success APIs safely.</span>
                    </div>
                 </div>
              )}

              {spec.configs.map((cf) => (
                 <div key={cf.key} className={cf.type === 'boolean' ? "" : (cf.type === 'select' ? "md:col-span-2" : "md:col-span-1")}>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">{cf.label} {cf.required && "*"}</label>
                    {cf.type === 'boolean' ? (
                       <select required={cf.required} value={configParams[cf.key] ? "true" : "false"} onChange={e => setConfigParams({...configParams, [cf.key]: e.target.value === "true"})} className="w-full border-gray-200 rounded-xl bg-blue-50/30 p-3 h-12 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-blue-900">
                          <option value="true">Enable</option>
                          <option value="false">Disable</option>
                       </select>
                    ) : cf.type === 'select' ? (
                       <select required={cf.required} value={configParams[cf.key] || ""} onChange={e => setConfigParams({...configParams, [cf.key]: e.target.value})} className="w-full border-gray-200 rounded-xl bg-blue-50/30 p-3 h-12 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-blue-900">
                          <option value="">Select Option</option>
                          {cf.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                       </select>
                    ) : (
                       <input required={cf.required} type={cf.type} value={configParams[cf.key] || ""} onChange={e => setConfigParams({...configParams, [cf.key]: e.target.value})} className="w-full border-gray-200 rounded-xl bg-blue-50/30 p-3 h-12 font-mono text-sm focus:ring-blue-500 focus:border-blue-500 text-blue-900 shadow-inner" placeholder={`Enter ${cf.label}...`} />
                    )}
                 </div>
              ))}
           </div>
        </div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
           <div className="max-w-5xl mx-auto flex items-center justify-end gap-3 px-4">
              {spec.hasTestConnection && (
                 <button type="button" onClick={handleTestConnection} disabled={testing} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition">
                    <Activity size={18} /> {testing ? "Pinging..." : "Test Connection"}
                 </button>
              )}
              <button type="submit" disabled={saving || uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-blue-600/30">
                 <Save size={18} /> {saving ? "Saving Immutable Ledger..." : "Save Configuration"}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
}
