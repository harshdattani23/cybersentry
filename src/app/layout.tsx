import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { AuthProvider } from "@/context/AuthContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ministry of Cyber Affairs India – Cyber News & Updates",
  description: "Your trusted source for cyber news and updates in India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans`}>
        <AuthProvider>
          <div className="bg-amber-100 border-b border-amber-200 py-2 text-center text-amber-900 text-xs sm:text-sm font-bold tracking-wide px-4">
            ⚠️ DISCLAIMER: This is an independent news website and is NOT an official government or ministry portal.
          </div>
          <Header />

          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
