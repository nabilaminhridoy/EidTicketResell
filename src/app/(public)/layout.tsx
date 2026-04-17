"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const NAV_LINKS = [
    { name: 'Home', href: '/' },
    { name: 'Find Tickets', href: '/find-tickets' },
    { name: 'Sell Tickets', href: '/sell-tickets' },
    { name: 'How It Works', href: '/how-it-works' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Dynamic Navbar */}
      <nav className="bg-white border-b border-gray-100 fixed w-full top-0 z-50 card-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">E</div>
                <span className="font-bold text-2xl tracking-tight text-gray-900">ETR</span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === link.href ? 'text-primary' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="flex items-center gap-4 ml-6 border-l pl-6 border-gray-200">
                <Link href="/user/login" className="text-sm font-bold text-gray-700 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/user/register" className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm">
                  Register
                </Link>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-gray-700 hover:text-primary hover:bg-green-50"
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-4 border-t border-gray-100 pt-4 px-3 flex flex-col gap-3">
                 <Link href="/user/login" className="block text-center w-full font-bold text-gray-700 bg-gray-50 py-3 rounded-xl border border-gray-200">Login</Link>
                 <Link href="/user/register" className="block text-center w-full font-bold text-white bg-primary py-3 rounded-xl">Register</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="bg-gray-900 text-white mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
           <div>
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm">E</div> ETR
             </h3>
             <p className="text-gray-400 text-sm">Bangladesh's safest ticket marketplace for Eid and beyond.</p>
           </div>
           <div>
             <h4 className="font-bold mb-4">Quick Links</h4>
             <ul className="text-gray-400 text-sm flex flex-col gap-2">
               <li><Link href="/find-tickets" className="hover:text-primary transition-colors">Find Tickets</Link></li>
               <li><Link href="/sell-tickets" className="hover:text-primary transition-colors">Sell Tickets</Link></li>
               <li><Link href="/about-us" className="hover:text-primary transition-colors">About Us</Link></li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold mb-4">Support</h4>
             <ul className="text-gray-400 text-sm flex flex-col gap-2">
               <li><Link href="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
               <li><Link href="/contact-us" className="hover:text-primary transition-colors">Contact Us</Link></li>
               <li><Link href="/safety-guidelines" className="hover:text-primary transition-colors">Safety Guidelines</Link></li>
             </ul>
           </div>
           <div>
             <h4 className="font-bold mb-4">Policies</h4>
             <ul className="text-gray-400 text-sm flex flex-col gap-2">
               <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
               <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
               <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
             </ul>
           </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
           &copy; {new Date().getFullYear()} ETR Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
