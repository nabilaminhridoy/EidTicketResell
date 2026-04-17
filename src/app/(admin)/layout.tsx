"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Ticket, DollarSign, Wallet, Users, 
  Settings, LogOut, Menu, ArrowLeftRight, FileText, Bell, TrendingUp, ShieldAlert
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const NAV_LINKS = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Business Intelligence', href: '/admin/analytics', icon: <TrendingUp size={20} /> },
    { name: 'Security & Operations', href: '/admin/security', icon: <ShieldAlert size={20} /> },
    { name: 'Tickets', href: '/admin/tickets', icon: <Ticket size={20} /> },
    { name: 'Purchases', href: '/admin/purchases', icon: <DollarSign size={20} /> },
    { name: 'Payouts', href: '/admin/payouts', icon: <Wallet size={20} /> },
    { name: 'Transactions', href: '/admin/transactions', icon: <ArrowLeftRight size={20} /> },
    { name: 'Reports & Refunds', href: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Users', href: '/admin/users/users', icon: <Users size={20} /> },
    { name: 'System Settings', href: '/admin/system-settings/general-settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} shrink-0 hidden md:flex`}>
        <div className="h-16 flex items-center justify-between px-4 bg-gray-950 border-b border-gray-800">
          {sidebarOpen && <span className="font-bold text-xl tracking-tight text-primary">ETR Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white mx-auto md:mx-0">
            <Menu size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {NAV_LINKS.map(link => (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="shrink-0">{link.icon}</div>
              {sidebarOpen && <span className="text-sm truncate">{link.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link href="/admin/logout" className="flex items-center gap-3 text-red-400 hover:text-red-300 px-3 py-2 rounded-xl transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-semibold">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 w-full card-shadow">
          <div className="font-semibold text-gray-800 truncate pl-2 capitalize relative">
            {pathname.split('/').slice(2).join(' / ') || 'Dashboard'}
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-8 bg-green-100 text-green-700 font-bold rounded-full flex items-center justify-center border border-green-200">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Children */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
