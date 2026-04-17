"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, User, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP Simulation State
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const handleRegisterCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to register. Please check your data.");
      }
      
      // Successfully registered and OTP fired via API
      setOtpSent(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate OTP verification which would call `/api/auth/verify-otp`
    setLoading(true);
    setTimeout(() => {
      // Direct user to login after OTP verification success
      router.push('/user/login?verified=true');
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 card-shadow border border-gray-100 overflow-hidden relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">E</div>
          <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-2">Join the safest ticket marketplace in Bangladesh.</p>
        </div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.form key="regForm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRegisterCall} className="space-y-4">
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-2">
                   <ShieldCheck size={16}/> {error}
                </div>
              )}

              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="text" placeholder="Full Name" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="tel" placeholder="Phone Number" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="email" placeholder="Email Address" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input required type="password" placeholder="Secure Password" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 mt-2 flex justify-center items-center gap-2 shadow-sm shadow-green-200">
                {loading ? <Loader2 className="animate-spin" size={20}/> : 'Create Account'}
              </button>

            </motion.form>
          ) : (
            <motion.form key="otpForm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerifyOTP} className="space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                 <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold">Verify Your Identity</h2>
              <p className="text-sm text-gray-500 mb-6">We've sent a 6-digit OTP to your email and phone.</p>
              
              <input required type="text" placeholder="------" maxLength={6}
                value={otpValue} onChange={e => setOtpValue(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl border border-gray-200 rounded-xl px-4 py-4 bg-gray-50 text-gray-900 font-bold focus:ring-2 focus:ring-primary focus:outline-none" />
              
              <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 mt-4 flex justify-center items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20}/> : 'Verify & Continue'}
              </button>

              <button type="button" className="text-sm text-blue-600 font-semibold hover:underline mt-4">
                Resend OTP (00:59)
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account? <Link href="/user/login" className="text-primary font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}