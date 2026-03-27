import { ShieldAlert } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";
import { collectCardImages } from "@/lib/extractImage";
import { CardImageCarousel } from "@/components/news/CardImageCarousel";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: latestNews, error } = await supabase
      .from('news')
      .select('*')
      .order('id', { ascending: false })
      .limit(3);

  return (
    <div className="bg-surface font-body text-on-background">
      <main>
        {/* Section 1: Hero - Digital Bastion */}
        <section className="relative min-h-[90vh] flex items-center bastion-gradient pt-20 pb-20 overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-40"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-accent/10 rounded-full blur-[120px] -mr-96 -mt-96"></div>
          <div className="container mx-auto px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full dark-glass">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
                </span>
                <span className="text-brand-accent text-xs font-bold tracking-[0.2em] uppercase">National Defense Hub Active</span>
              </div>
              <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[1]">
                India&apos;s Central <br /><span className="text-brand-accent text-6xl md:text-7xl lg:text-8xl">Cyber Shield</span>
              </h1>
              <p className="text-slate-300 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
                Protecting 1.4 billion citizens and critical national infrastructure through real-time intelligence, proactive monitoring, and coordinated response.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/report">
                  <button className="bg-brand-accent text-brand-primary px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:shadow-[0_0_20px_rgba(111,251,190,0.4)] transition-all">
                    Report an Incident
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </button>
                </Link>
                <Link href="/cases">
                  <button className="glass-panel text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/20">
                    Latest Advisories
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-black text-white font-headline">24/7</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Protection</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white font-headline">99.9%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Reliability</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white font-headline">60m+</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Blocked/Day</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="dark-glass p-8 rounded-[2.5rem] relative">
                <div className="absolute -top-4 -left-4 bg-brand-accent p-4 rounded-2xl text-brand-primary font-black shadow-xl">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <img alt="Defense Visual" className="w-full h-auto rounded-3xl opacity-80 mix-blend-lighten" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDaHCWHzH2MqRmgX5ydnLcFGDEgMtR6JfKntRdLkAXvp7PBLVI6mE0FJ2oEkx19pggaPXkiozOYMqJudtKwhnyC_Xux9qZQ5rTxORag9axBbM-euSQ1lDpiWMOm7kq0qnT-_g3a0jFAJnqo1np0pYn4Gq9VNtjSAw-d24ppu_px3pDJ7D1_hDvsv5PjPgUaWXzTV_JQaYColuZJZIJLUND6QHeJbaH6igBqkqdRJYJbyBscoImRtMD3xlspMQf0xpAzMj1l2S2DwCq" />
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Response Time</div>
                    <div className="text-xl text-white font-headline font-bold">4.2 min avg</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Nodes Active</div>
                    <div className="text-xl text-white font-headline font-bold">14,204 units</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Cyber Health Dashboard (Modular Grid) */}
        <section className="py-24 bg-surface">
          <div className="container mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="font-headline text-4xl font-extrabold tracking-tight text-brand-primary mb-4">Cyber Health Dashboard</h2>
                <p className="text-brand-secondary text-lg">Real-time modular tracking of domestic digital security metrics and emerging fraud patterns.</p>
              </div>
              <div className="flex gap-4">
                <Link href="/statistics">
                  <button className="px-6 py-3 bg-surface-container text-brand-primary font-bold rounded-xl flex items-center gap-2 hover:bg-surface-container-high transition-all">
                    <span className="material-symbols-outlined">analytics</span>
                    Full Report
                  </button>
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-brand-accent/40 transition-all group">
                <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:bg-brand-accent/10 group-hover:text-brand-accent group-hover:drop-shadow-[0_0_8px_rgba(111,251,190,0.8)] transition-all">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <div className="text-xs text-brand-secondary font-bold uppercase tracking-widest mb-2">Defense Integrity</div>
                <div className="text-4xl font-headline font-black text-brand-primary mb-2">99.8%</div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Stable Network
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-red-200 transition-all group">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-100 group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all">
                  <span className="material-symbols-outlined">emergency_home</span>
                </div>
                <div className="text-xs text-brand-secondary font-bold uppercase tracking-widest mb-2">Emerging Threats</div>
                <div className="text-4xl font-headline font-black text-brand-primary mb-2">1,248</div>
                <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Elevated Alert
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/20 hover:border-brand-accent/40 transition-all group">
                <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center text-brand-primary mb-6 group-hover:bg-brand-accent/10 group-hover:text-brand-accent group-hover:drop-shadow-[0_0_8px_rgba(111,251,190,0.8)] transition-all">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className="text-xs text-brand-secondary font-bold uppercase tracking-widest mb-2">Blocked Fraud</div>
                <div className="text-4xl font-headline font-black text-brand-primary mb-2">₹12.4Cr</div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-sm">shield</span>
                  Assets Protected
                </div>
              </div>
              <div className="bg-brand-primary p-8 rounded-3xl shadow-xl text-white">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Global Position</div>
                <div className="text-4xl font-headline font-black mb-2">#04</div>
                <div className="text-slate-400 font-bold text-xs">
                  National Cyber Power Index
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Advisories - Card Based Grid */}
        <section className="py-24 bg-surface-container-low border-t border-b border-surface-container-high">
          <div className="container mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 text-center md:text-left">
              <div>
                <h2 className="font-headline text-4xl font-extrabold tracking-tight text-brand-primary mb-2">Latest News Articles</h2>
                <p className="text-brand-secondary text-lg">Stay updated with the latest cyber fraud news and advisories submitted by our publishers.</p>
              </div>
              <Link href="/news">
                  <button className="flex items-center gap-2 text-brand-primary font-bold border-b-2 border-brand-primary pb-1 hover:text-brand-accent transition-colors shrink-0">
                    Browse All News <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestNews && latestNews.length > 0 ? (
                latestNews.map((news) => {
                  const cardImages = collectCardImages(news.image_url, news.content);
                  let badgeColors = "bg-brand-accent/20 text-[#008f5d]";
                  if (news.category?.toLowerCase().includes("fraud") || news.category?.toLowerCase().includes("scam") || news.category?.toLowerCase().includes("critical")) {
                    badgeColors = "bg-red-100 text-red-700";
                  } else if (news.category?.toLowerCase().includes("warning") || news.category?.toLowerCase().includes("alert")) {
                    badgeColors = "bg-amber-100 text-amber-700";
                  }

                  return (
                    <div key={news.id} className="bg-white rounded-[2rem] shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-xl transition-shadow group overflow-hidden">
                      {/* Card Image Carousel */}
                      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-surface-container to-surface-container-high">
                        <CardImageCarousel images={cardImages} alt={news.title} />
                        <div className="absolute top-4 left-4 z-20">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${badgeColors} backdrop-blur-sm`}>
                            {news.category || "News"}
                          </span>
                        </div>
                      </div>
                      {/* Card Content */}
                      <div className="p-8 flex flex-col flex-1">
                        <Link href={`/news/${news.id}`} target="_blank">
                          <h4 className="text-xl font-bold font-headline mb-4 text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors uppercase cursor-pointer">
                            {news.title}
                          </h4>
                        </Link>
                        <p className="text-brand-secondary mb-8 line-clamp-3 leading-relaxed">{news.summary}</p>
                        <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                          <span className="text-xs font-bold text-brand-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            Ref: {news.source || 'CyberSentry News'}
                          </span>
                          <Link href={`/news/${news.id}`} target="_blank" className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1">
                            Read More
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-xl transition-shadow group">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest rounded-full">Critical</span>
                      <span className="text-xs text-brand-secondary">Latest</span>
                    </div>
                    <h4 className="text-xl font-bold font-headline mb-4 text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors">Digital Arrest Scams Surge Targeting Senior Citizens</h4>
                    <p className="text-brand-secondary mb-8 line-clamp-3 leading-relaxed">Scammers impersonating CBI or Customs officials are making video calls declaring fake "digital arrests" to extort money. Do NOT comply and report immediately.</p>
                    <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Ref: I4C-902
                      </span>
                      <Link href="/cases" className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1">
                        Read More
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-xl transition-shadow group">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-brand-accent/20 text-[#008f5d] text-[10px] font-black uppercase tracking-widest rounded-full">Secure Guide</span>
                      <span className="text-xs text-brand-secondary">Verified</span>
                    </div>
                    <h4 className="text-xl font-bold font-headline mb-4 text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors">Securing Financial Transactions: Mandatory Steps</h4>
                    <p className="text-brand-secondary mb-8 line-clamp-3 leading-relaxed">Ensure you never share OTPs, PINs, or install screen-sharing apps like AnyDesk or TeamViewer on instructions from unverified callers.</p>
                    <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Ref: PR-441
                      </span>
                      <Link href="/cases" className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1">
                        Read More
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-xl transition-shadow group">
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">Warning</span>
                      <span className="text-xs text-brand-secondary">Urgent</span>
                    </div>
                    <h4 className="text-xl font-bold font-headline mb-4 text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors">APK Fraud: Malicious Apps Bypassing Store Checks</h4>
                    <p className="text-brand-secondary mb-8 line-clamp-3 leading-relaxed">Beware of SMS messages containing links to download APK files for KYC updates or bill payments. These often contain malware designed to intercept bank SMS.</p>
                    <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Ref: AL-112
                      </span>
                      <Link href="/cases" className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1">
                        Read More
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Incident Reporting CTA Banner */}
        <section className="py-24 bg-surface">
          <div className="container mx-auto px-8">
            <div className="relative bastion-gradient p-12 md:p-20 rounded-[3rem] overflow-hidden text-center">
              <div className="absolute inset-0 grid-pattern opacity-20"></div>
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-white font-headline text-4xl md:text-5xl font-extrabold mb-6">Victim of a Cybercrime?</h2>
                <p className="text-slate-300 text-lg mb-10">Report incidents immediately to the National Cybercrime Reporting Portal. Quick action helps us prevent further spread and recover lost digital assets.</p>
                <div className="flex flex-wrap justify-center gap-6">
                  <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">
                      <button className="bg-brand-accent text-brand-primary px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform flex items-center gap-3">
                        <span className="material-symbols-outlined font-black">report_gmailerrorred</span>
                        NCRP OFFICIAL PORTAL
                      </button>
                  </a>
                  <Link href="/report">
                      <button className="glass-panel text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all border border-white/20">
                        Submit Internal Intel
                      </button>
                  </Link>
                </div>
                <p className="text-slate-500 text-sm mt-8 font-medium">Confidentiality guaranteed. Reports are handled by authorized law enforcement units.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
