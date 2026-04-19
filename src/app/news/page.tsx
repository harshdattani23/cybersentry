import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { NewsFilteredGrid } from "@/components/news/NewsFilteredGrid";

export const revalidate = 60; // ISR: rebuild every 60 seconds

export const metadata = {
  title: 'All News Articles | Ministry of Cyber Affairs',
  description: 'Browse all cyber fraud news, advisories, and security alerts submitted by our publishers.',
};

export default async function AllNewsPage() {
  const { data: allNews, error, count } = await supabase
    .from('news')
    .select('id, title, category, summary, source, author_email, created_at, image_url, views', { count: 'exact' })
    .order('id', { ascending: false });

  return (
    <div className="bg-surface font-body text-on-background min-h-screen">
      {/* ── Hero Header ────────────────────────────────────── */}
      <section className="relative bg-brand-primary overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/8 rounded-full blur-[150px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -ml-48 -mb-48" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 relative z-10 pt-28 pb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-brand-accent transition-colors mb-10 text-sm font-bold group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="material-symbols-outlined text-brand-accent text-sm">newspaper</span>
              <span className="text-brand-accent text-xs font-bold tracking-[0.2em] uppercase">News Archive</span>
            </div>

            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-4">
              All News <span className="text-brand-accent">Articles</span>
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-2xl leading-relaxed">
              Browse every cyber fraud news article, advisory, and security alert submitted by our verified publishers.
            </p>

            {count != null && (
              <div className="mt-8 inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full">
                <span className="material-symbols-outlined text-brand-accent text-sm">article</span>
                <span className="text-white text-sm font-bold">{count} article{count !== 1 ? 's' : ''} published</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom curve */}
        <div className="h-6 bg-surface rounded-t-[2rem] relative z-10" />
      </section>

      {/* ── Filter Panel + News Grid ───────────────────────── */}
      <section className="pb-20 -mt-1 bg-surface">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
          {error ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
              <h3 className="font-headline text-2xl font-bold text-brand-primary mb-2">Unable to Load Articles</h3>
              <p className="text-brand-secondary">Something went wrong while fetching news articles. Please try again later.</p>
            </div>
          ) : allNews && allNews.length > 0 ? (
            <NewsFilteredGrid allNews={allNews.map((n: any) => ({
              ...n,
              image_url: n.image_url
                ? (n.image_url.startsWith('data:') ? `__base64__` : n.image_url)
                : null,
            }))} />
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-brand-secondary/40 mb-4 block">inbox</span>
              <h3 className="font-headline text-2xl font-bold text-brand-primary mb-2">No Articles Yet</h3>
              <p className="text-brand-secondary mb-6">No news articles have been published yet. Check back soon!</p>
              <Link href="/">
                <button className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all">
                  Back to Home
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
