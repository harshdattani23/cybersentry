import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { NewsFilteredGrid } from "@/components/news/NewsFilteredGrid";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'All News Articles | CyberSentry',
  description: 'Browse all cyber fraud news, advisories, and security alerts submitted by our publishers.',
};

export default async function AllNewsPage() {
  const { data: allNews, error } = await supabase
    .from('news')
    .select('*')
    .order('id', { ascending: false });

  return (
    <div className="bg-surface font-body text-on-background min-h-screen">
      {/* Hero Header */}
      <section className="relative bastion-gradient pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full blur-[120px] -mr-72 -mt-72"></div>
        <div className="container mx-auto px-8 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-accent transition-colors mb-8 text-sm font-bold">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full dark-glass mb-6">
              <span className="material-symbols-outlined text-brand-accent text-sm">newspaper</span>
              <span className="text-brand-accent text-xs font-bold tracking-[0.2em] uppercase">News Archive</span>
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
              All News <span className="text-brand-accent">Articles</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
              Browse every cyber fraud news article, advisory, and security alert submitted by our verified publishers.
            </p>
            {allNews && (
              <div className="mt-6 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <span className="material-symbols-outlined text-brand-accent text-sm">article</span>
                <span className="text-white text-sm font-bold">{allNews.length} article{allNews.length !== 1 ? 's' : ''} published</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filter Panel + News Articles Grid */}
      <section className="py-16 bg-surface-container-low">
        <div className="container mx-auto px-8">
          {error ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
              <h3 className="font-headline text-2xl font-bold text-brand-primary mb-2">Unable to Load Articles</h3>
              <p className="text-brand-secondary">Something went wrong while fetching news articles. Please try again later.</p>
            </div>
          ) : allNews && allNews.length > 0 ? (
            <NewsFilteredGrid allNews={allNews} />
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
