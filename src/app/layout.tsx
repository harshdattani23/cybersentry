import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { AuthProvider } from "@/context/AuthContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CyberSentry India – Cyber News & Updates",
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
