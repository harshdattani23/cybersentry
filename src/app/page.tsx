import { ShieldAlert } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";
import { collectCardImages } from "@/lib/extractImage";
import { generateSlug } from "@/lib/utils";
import { CardImageCarousel } from "@/components/news/CardImageCarousel";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: latestNews, error } = await supabase
      .from('news')
      .select('*')
      .order('id', { ascending: false })
      .limit(12);

  const heroArticle = latestNews && latestNews.length > 0 ? latestNews[0] : null;
  const secondaryArticles = latestNews && latestNews.length > 1 ? latestNews.slice(1, 4) : [];
  const standardArticles = latestNews && latestNews.length > 4 ? latestNews.slice(4) : [];

  return (
    <div className="bg-surface font-body text-on-background min-h-screen">
      <main className="container mx-auto px-4 md:px-8 py-12">
        {/* Newspaper Style Header */}
        <div className="mb-12 border-b-4 border-brand-primary pb-6 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 text-center md:text-left">
          <div>
            <h1 className="text-5xl md:text-7xl font-black font-headline text-brand-primary tracking-tighter uppercase">
              The Cyber Sentry
            </h1>
            <p className="text-brand-secondary font-bold tracking-[0.2em] uppercase mt-2 text-sm">
              Your Daily Security & Intelligence Briefing
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <div className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-1 mb-1">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             <div className="text-xs uppercase text-brand-accent font-black tracking-widest bg-brand-primary text-white px-3 py-1 rounded">
               Latest Edition
             </div>
          </div>
        </div>

        {!heroArticle ? (
          <div className="py-24 text-center">
             <p className="text-xl text-slate-500">No news articles found. Be the first to publish.</p>
             <Link href="/publish-news">
               <button className="mt-6 bg-brand-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-primary/90">
                 Publish News
               </button>
             </Link>
          </div>
        ) : (
          <>
            {/* Top Stories Grids */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              {/* Hero Story (Left/Main column) */}
              <div className="lg:col-span-8 group cursor-pointer border-b border-outline-variant/30 pb-8 lg:pb-0 lg:border-b-0 lg:border-r lg:pr-8">
                <Link href={`/news/${generateSlug(heroArticle.title)}-${heroArticle.id}`}>
                  <div className="flex flex-col gap-6">
                    <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden bg-slate-100 rounded-xl">
                      <CardImageCarousel images={collectCardImages(heroArticle.image_url, heroArticle.content)} alt={heroArticle.title} />
                      <div className="absolute top-4 left-4 z-20">
                          <span className="px-3 py-1 text-xs font-black uppercase tracking-widest rounded bg-brand-primary text-white">
                            {heroArticle.category || "Headline"}
                          </span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-4xl md:text-5xl font-black font-headline text-brand-primary leading-tight group-hover:text-brand-accent transition-colors">
                        {heroArticle.title}
                      </h2>
                      <p className="text-lg text-slate-600 mt-4 leading-relaxed line-clamp-3">
                        {heroArticle.summary}
                      </p>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-6 flex items-center gap-2">
                        <span>By {heroArticle.source || 'Sentry Desk'}</span>
                        <span>•</span>
                        <span>{new Date(heroArticle.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Secondary Stories (Right column) */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="border-b-2 border-slate-900 pb-2 mb-2">
                  <h3 className="font-bold uppercase tracking-widest text-brand-primary text-sm">Trending Now</h3>
                </div>
                {secondaryArticles.map((article: any) => (
                  <Link href={`/news/${generateSlug(article.title)}-${article.id}`} key={article.id} className="group flex flex-col gap-3 pb-8 border-b border-outline-variant/30 last:border-0 last:pb-0">
                    <h4 className="text-xl font-bold font-headline text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                      {new Date(article.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Standard News Grid */}
            {standardArticles.length > 0 && (
              <div className="pt-16 border-t border-slate-200">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black font-headline text-brand-primary uppercase">More News</h3>
                  <Link href="/news" className="text-sm font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1">
                    All Coverage <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                  {standardArticles.map((article: any) => (
                    <Link href={`/news/${generateSlug(article.title)}-${article.id}`} key={article.id} className="group flex flex-col">
                      <div className="relative w-full h-40 overflow-hidden bg-slate-100 rounded-lg mb-4">
                        <CardImageCarousel images={collectCardImages(article.image_url, article.content)} alt={article.title} />
                        <div className="absolute top-2 left-2 z-20">
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-white/90 text-brand-primary border border-slate-200">
                              {article.category || "News"}
                            </span>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold font-headline text-brand-primary leading-snug group-hover:text-brand-primary/70 transition-colors mb-2">
                        {article.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">
                        {article.summary}
                      </p>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-auto">
                        {article.source || 'Sentry Desk'} • {new Date(article.created_at).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
