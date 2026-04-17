"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, User, List, ShoppingBag, Heart, 
  Wallet, Histor, AlertCircle, LogOut, Menu, Gift,
  ShieldCheck
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile closed by default
  const pathname = usePathname();

  const NAV_LINKS = [
    { name: 'Dashboard', href: '/user', icon: <LayoutDashboard size={18} /> },
    { name: 'Profile', href: '/user/profile', icon: <User size={18} /> },
    { name: 'My Listings', href: '/user/listings', icon: <List size={18} /> },
    { name: 'My Purchases', href: '/user/purchases', icon: <ShoppingBag size={18} /> },
    { name: 'My Wishlist', href: '/user/wishlist', icon: <Heart size={18} /> },
    { name: 'Wallet & Payouts', href: '/user/wallet/balance', icon: <Wallet size={18} /> },
    { name: 'Transaction History', href: '/user/transaction-history', icon: <ArrowLeftRight size={18} /> },
    { name: 'Refer & Earn', href: '/user/referral', icon: <Gift size={18} /> },
    { name: 'ID Verification', href: '/user/id-verification', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 shrink-0 z-20">
        <span className="font-bold text-gray-900">User Panel</span>
        <div className="flex items-center gap-4">
           <NotificationDropdown />
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500">
             <Menu size={24} />
           </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 bg-white border-r border-gray-200 w-64 z-10 transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} flex flex-col`}>
        <div className="hidden md:flex h-16 items-center justify-center border-b border-gray-100 px-4 shrink-0">
          <span className="font-bold text-xl text-primary tracking-tight">ETR Dashboard</span>
        </div>
        
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center border border-green-200 shrink-0">
            RQ
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="font-bold text-gray-900 text-sm truncate">User Account</h4>
            <p className="text-xs text-gray-500">ETR Member</p>
          </div>
          <NotificationDropdown />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {NAV_LINKS.map(link => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm font-semibold ${
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="shrink-0">{link.icon}</div>
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link href="/user/logout" className="flex items-center gap-3 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-semibold">
            <LogOut size={18} /> Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {children}
        </main>
      </div>
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
         <div onClick={() => setSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/20 z-0"></div>
      )}
    </div>
  );
}

// ArrowLeftRight needs manual import since it was missed from list
const ArrowLeftRight = require('lucide-react').ArrowLeftRight;
