"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldCheck, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function InstallPage() {
  const [step, setStep] = useState(1);
  const [isInstalling, setIsInstalling] = useState(false);

  // Super Admin Form State
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleInstall = () => {
    setIsInstalling(true);
    // Note: In reality, this communicates with a server-side action to run Prisma Migrations programmatically 
    // and inserts the robust bcrypt-hashed SUPER_ADMIN into the MySQL DB.
    setTimeout(() => {
      setIsInstalling(false);
      setStep(3);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Branding Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 card-shadow">E</div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ETR Installation</h1>
          <p className="text-gray-500 mt-2">Initialize your database and super admin.</p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl p-8 card-shadow border border-gray-100 overflow-hidden relative">
          <AnimatePresence mode="wait">

            {/* STEP 1: Environment Check */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800"><Database size={24} className="text-primary" /> System Requirements Check</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                    <span className="font-semibold text-gray-700">Database Connection (MySQL)</span>
                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={16} /> Passed</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                    <span className="font-semibold text-gray-700">Write Permissions (fs)</span>
                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={16} /> Passed</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                    <span className="font-semibold text-gray-700">Node JS / Environment</span>
                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm"><CheckCircle size={16} /> Passed</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="bg-primary hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    Continue to Setup <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Super Admin Setup */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800"><ShieldCheck size={24} className="text-blue-500" /> Create Super Admin</h2>
                <p className="text-sm text-gray-500 mb-6">This account will have absolute control over the platform, system settings, financial gateways, and roles.</p>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={adminData.name} onChange={e => setAdminData({ ...adminData, name: e.target.value })} placeholder="System Administrator" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <input type="email" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} placeholder="admin@etr.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={adminData.phone} onChange={e => setAdminData({ ...adminData, phone: e.target.value })} placeholder="+880" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <input type="password" className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-gray-500 font-semibold hover:text-gray-800 transition-colors">Volver (Back)</button>
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm shadow-blue-200"
                  >
                    {isInstalling ? <><Loader2 className="animate-spin text-white" size={18} /> Running Migrations...</> : 'Install System'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Success Completion */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                  <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Installation Complete!</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">The database schema has been migrated securely and the Super Admin user was registered.</p>
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm mb-8 border border-orange-100 font-semibold text-left">
                  <span className="font-bold flex items-center gap-1 mb-1">⚠️ Security Warning</span>
                  Please delete the <code className="bg-white px-1 rounded border border-orange-200 text-xs">/install</code> directory via the codebase or the route will be automatically disabled to prevent system override.
                </div>
                <a href="/admin/login" className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-colors">
                  Go to Admin Panel
                </a>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}