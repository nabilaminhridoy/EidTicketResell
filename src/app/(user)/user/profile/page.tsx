"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, ShieldCheck, UploadCloud, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setProfile(data.profile);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPreviewAvatar(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setProfile({ ...profile, ...data.user });
      setMessage({ type: 'success', text: data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 card-shadow border border-gray-100 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
           <User className="text-primary" /> Profile Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your identity securely on ETR Platform.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 border font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
          {message.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="bg-white rounded-3xl p-8 md:p-10 card-shadow border border-gray-100">
        
        {/* Verification Status Banner */}
        {profile?.isIdVerified ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4 mb-10 text-blue-900">
             <div className="bg-blue-100 p-2 rounded-full"><ShieldCheck size={24} className="text-blue-600"/></div>
             <div>
               <h3 className="font-bold text-sm">Identity Verified Account</h3>
               <p className="text-xs text-blue-700 mt-1">Your National ID/Passport has been approved. You are eligible to sell and withdraw funds.</p>
             </div>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 text-orange-900">
             <div className="flex items-center gap-4">
               <div className="bg-orange-100 p-2 rounded-full"><AlertCircle size={24} className="text-orange-600"/></div>
               <div>
                 <h3 className="font-bold text-sm">Action Required: Verify Identity</h3>
                 <p className="text-xs text-orange-700 mt-1">Sellers cannot withdraw funds until an identity document is uploaded and verified by Admins.</p>
               </div>
             </div>
             <button type="button" className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-xl text-white font-bold text-sm whitespace-nowrap transition-colors">Verify Now</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
             <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden relative group">
               <img src={previewAvatar || profile?.avatar || "https://ui-avatars.com/api/?name=" + profile?.name} alt="Avatar" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <UploadCloud className="text-white" />
                  <input name="avatar" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
               </div>
             </div>
             <p className="text-xs text-gray-400 mt-3 font-medium">Click to upload photo</p>
          </div>

          {/* Details Form */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input name="name" defaultValue={profile?.name} required className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input defaultValue={profile?.email} disabled className="pl-11 w-full border border-gray-100 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 font-medium cursor-not-allowed" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed natively. Contact support if required.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input name="phone" defaultValue={profile?.phone} required className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button disabled={isSubmitting} type="submit" className="bg-primary hover:bg-green-700 disabled:opacity-70 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm shadow-green-200 flex items-center gap-2">
                 {isSubmitting ? <><Loader2 className="animate-spin" size={16}/> Updating...</> : 'Save Changes'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}