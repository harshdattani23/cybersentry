"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { user, userData, loading } = useAuth();

  return (
    <header className="sticky top-0 w-full z-50 bg-[#f9f9ff]/80 backdrop-blur-md shadow-[0px_20px_40px_rgba(17,28,45,0.06)] transition-colors duration-300 border-b border-outline-variant/20">
      <nav className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-full mx-auto">
        
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold text-[#0D1B2A] tracking-tighter font-headline">
          CYBER SENTRY
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex gap-8 items-center">
          <Link href="/statistics" className="font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
            Dashboard
          </Link>
          <Link href="/cases" className="font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
            Advisories
          </Link>
          <Link href="/check" className="font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
            Fraud Check
          </Link>
          <Link href="/resources" className="font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
            Resources
          </Link>
          <Link href="/publish-news" className="font-headline font-bold tracking-tight text-[#44474c] hover:text-[#111c2d] transition-all duration-200">
            Publish
          </Link>
        </div>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-4 md:gap-6">
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                {userData?.role === 'admin' && (
                  <Link href="/harsh" className="hidden md:block py-2 px-4 text-xs font-bold rounded-lg border border-brand-accent bg-brand-accent/10 text-brand-primary hover:bg-brand-accent/20 transition-colors">
                    Admin Portal
                  </Link>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px]">account_circle</span>
                  <span className="text-xs font-bold text-brand-primary truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-wider"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-xs font-bold text-brand-primary uppercase tracking-wider hover:text-brand-accent transition-colors">
                  Log In
                </Link>
                <Link href="/register" className="hidden sm:block px-4 py-2 font-bold text-xs bg-brand-primary text-white rounded hover:bg-brand-primary/80 transition-colors uppercase tracking-wider">
                  Register
                </Link>
              </div>
            )
          )}
          
          <Link href="/report">
            <button className="bg-brand-primary text-white border border-brand-primary px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider active:scale-95 duration-100 hover:bg-brand-accent hover:text-brand-primary hover:border-brand-accent transition-all shadow-md">
              Report Incident
            </button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
