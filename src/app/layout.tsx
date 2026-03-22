import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CyberSentry India – National Cyber Fraud Awareness Portal",
  description: "The official national portal for cyber fraud awareness and prevention in India.",
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
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
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
