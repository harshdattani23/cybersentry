"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user, userData, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-[0px_20px_40px_rgba(17,28,45,0.06)] transition-colors duration-300 border-b border-outline-variant/20">
      <nav className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-[1600px] mx-auto">
        
        <div className="flex items-center gap-8 lg:gap-14">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold text-[#0D1B2A] tracking-tighter font-headline shrink-0">
            MINISTRY OF CYBER AFFAIRS
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden xl:flex gap-8 items-center">
            <Link href="/cases" className="text-[15px] font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
              Advisories
            </Link>
            <Link href="/about" className="text-[15px] font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
              About Us
            </Link>
            <Link href="/resources" className="text-[15px] font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
              Resources
            </Link>
            <Link href="/publish-news" className="text-[15px] font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
              Publish
            </Link>
          </div>
        </div>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-4 md:gap-6">
          {loading ? (
            <div className="hidden xl:flex items-center gap-4 animate-pulse">
              <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-16 bg-slate-200 rounded-md"></div>
            </div>
          ) : user ? (
              <div className="hidden xl:flex items-center gap-3">
                {userData?.role === 'admin' && (
                  <Link href="/harsh" className="py-2 px-4 text-xs font-bold rounded-lg border border-brand-accent bg-brand-accent/10 text-brand-primary hover:bg-brand-accent/20 transition-colors whitespace-nowrap">
                    Admin Portal
                  </Link>
                )}
                <Link href="/profile" className="text-xs font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider transition-colors">
                  Profile
                </Link>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-wider ml-2 pl-4 border-l border-slate-300 whitespace-nowrap"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-4">
                <Link href="/login" className="px-5 py-2.5 text-xs font-bold text-brand-primary uppercase tracking-wider hover:bg-brand-primary/5 rounded-lg transition-all">
                  Log In
                </Link>
                <Link href="/register" className="px-5 py-2.5 font-bold text-xs bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-all uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-0.5">
                  Register
                </Link>
              </div>
            )}


          {/* Mobile Menu Toggle */}
          <button 
            className="xl:hidden text-brand-primary p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden absolute top-20 left-0 w-full bg-white border-b border-outline-variant/20 shadow-xl flex flex-col p-4 z-40 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <Link href="/cases" onClick={() => setIsMobileMenuOpen(false)} className="py-3 font-headline font-bold text-lg text-brand-primary border-b border-slate-100">
            Advisories
          </Link>
          <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="py-3 font-headline font-bold text-lg text-brand-primary border-b border-slate-100">
            About Us
          </Link>
          <Link href="/resources" onClick={() => setIsMobileMenuOpen(false)} className="py-3 font-headline font-bold text-lg text-brand-primary border-b border-slate-100">
            Resources
          </Link>
          <Link href="/publish-news" onClick={() => setIsMobileMenuOpen(false)} className="py-3 font-headline font-bold text-lg text-brand-primary border-b border-slate-100">
            Publish
          </Link>

          <div className="pt-6 pb-2 flex flex-col gap-4">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user ? (
                <>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-3 text-sm font-bold rounded-lg border border-brand-secondary/30 bg-surface-container-low text-brand-primary">
                    Edit Profile
                  </Link>
                  {userData?.role === 'admin' && (
                    <Link href="/harsh" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-3 text-sm font-bold rounded-lg border border-brand-accent bg-brand-accent/10 text-brand-primary">
                      Admin Portal
                    </Link>
                  )}
                  <button 
                    onClick={() => { supabase.auth.signOut(); setIsMobileMenuOpen(false); }}
                    className="py-3 text-sm font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-3 text-sm font-bold text-brand-primary border border-brand-primary rounded-lg">
                    Log In
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-3 font-bold text-sm bg-brand-primary text-white rounded-lg">
                    Register
                  </Link>
                </div>
              )}

          </div>
        </div>
      )}
    </header>
  );
}
