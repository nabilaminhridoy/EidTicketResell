"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login Failed.");
      }
      
      // Navigate to correct dashboard based on role
      if (data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
      
      // Router refresh to apply HttpOnly cookies directly to Middleware cache
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative background blocks */}
      <div className="absolute top-0 left-0 w-full h-80 bg-primary/10 -skew-y-6 transform -translate-y-20 z-0"></div>
      
      <div className="max-w-md w-full bg-white rounded-3xl p-8 card-shadow border border-gray-100 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">E</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Login to manage your tickets and wallet.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-2">
               <AlertCircle size={16}/> {error}
            </div>
          )}

          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input required type="text" placeholder="Email or Phone Number" 
              value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})}
              className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input required type="password" placeholder="Password" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              className="pl-11 w-full border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
              Remember me
            </label>
            <Link href="/user/forget-password" className="text-sm font-semibold text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 mt-6 flex justify-center items-center gap-2 shadow-sm shadow-gray-200">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <><LogIn size={20}/> Sign In</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500">
            Don't have an account? <Link href="/user/register" className="text-primary font-bold hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}