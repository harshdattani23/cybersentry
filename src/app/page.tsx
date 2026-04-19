import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";

export const revalidate = 60; // ISR: rebuild every 60 seconds

export default async function Home() {
  const { data: latestNews } = await supabase
    .from('news')
    .select('id, title, category, summary, source, created_at, image_url')
    .order('id', { ascending: false })
    .limit(12);

  const heroArticle = latestNews && latestNews.length > 0 ? latestNews[0] : null;
  const secondaryArticles = latestNews && latestNews.length > 1 ? latestNews.slice(1, 4) : [];
  const standardArticles = latestNews && latestNews.length > 4 ? latestNews.slice(4) : [];

  return (
    <div className="bg-surface font-body text-on-background min-h-screen">
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-16">

        {/* ── Masthead ─────────────────────────────────────── */}
        <header className="mb-14">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-accent bg-brand-primary inline-block px-3 py-1 rounded-sm mb-4">
                Latest Edition
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-headline text-brand-primary tracking-tighter leading-[0.95]">
                The Ministry of<br />Cyber Affairs
              </h1>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1 text-sm text-brand-secondary">
              <span className="font-semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="text-xs tracking-widest uppercase font-bold text-brand-secondary/60">
                Your Daily Security & Intelligence Briefing
              </span>
            </div>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-brand-primary via-brand-primary/40 to-transparent" />
        </header>

        {/* ── About the Initiative ─────────────────────────── */}
        <section className="mb-16 relative">
          <div className="grid md:grid-cols-[auto_1fr] gap-0 rounded-2xl overflow-hidden border border-outline-variant/30 bg-white shadow-sm">
            <div className="w-full md:w-2 bg-brand-primary" />
            <div className="p-6 md:p-8 lg:p-10">
              <h2 className="text-sm font-black font-headline text-brand-primary uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-brand-accent">info</span>
                About the Initiative
              </h2>
              <div className="text-slate-600 space-y-3 text-[15px] leading-relaxed">
                <p>
                  &ldquo;Ministry&rdquo; comes from Greek words like <em>diakoneo</em> (&ldquo;to serve&rdquo;) and <em>douleuo</em> (&ldquo;to serve as a slave&rdquo;). The Initiative <strong>Ministry of Cyber Affairs</strong> aims to serve the Cyber Space, by highlighting important events, news related to the cyberworld. This includes cybercrime, cybersecurity, Ai, Digitalisation etc.
                </p>
                <p>
                  Platform also aims to highlight the contributions of Cyber Police all around the world, which conventional media does not cover owing to various reasons.
                </p>
                <p>
                  Besides, public policy, regulations and Government Guidelines around the world, which actually makes an impact are posted for others countries to learn and implement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {!heroArticle ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-brand-secondary/30 mb-4 block">newspaper</span>
            <p className="text-xl text-slate-500">No news articles found. Be the first to publish.</p>
            <Link href="/publish-news">
              <button className="mt-6 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary/90 transition-all">
                Publish News
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* ── Hero Feature ───────────────────────────────── */}
            <section className="mb-16">
              <Link href={`/news/${generateSlug(heroArticle.title)}-${heroArticle.id}`} className="group block">
                <div className="relative rounded-3xl overflow-hidden bg-brand-primary min-h-[420px] md:min-h-[520px]">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    {heroArticle.image_url ? (
                      <img src={heroArticle.image_url} alt={heroArticle.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bastion-gradient flex items-center justify-center">
                        <span className="material-symbols-outlined text-7xl text-brand-accent/30">newspaper</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/70 to-brand-primary/20" />
                  </div>

                  {/* Content Overlay */}
                  <div className="relative z-10 flex flex-col justify-end h-full min-h-[420px] md:min-h-[520px] p-8 md:p-12 lg:p-16">
                    <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full bg-brand-accent text-brand-primary w-fit mb-5">
                      {heroArticle.category || "Headline"}
                    </span>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-headline text-white leading-[1.05] max-w-4xl group-hover:text-brand-accent transition-colors duration-300">
                      {heroArticle.title}
                    </h2>
                    <p className="text-base md:text-lg text-white/75 mt-5 max-w-2xl leading-relaxed line-clamp-3">
                      {heroArticle.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-6 text-xs text-white/50 font-bold uppercase tracking-widest">
                      <span>By {heroArticle.source || 'Sentry Desk'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span>{new Date(heroArticle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="ml-auto text-brand-accent font-bold tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read Article <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>

            {/* ── Trending Stories ────────────────────────────── */}
            {secondaryArticles.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-sm font-black font-headline text-brand-primary uppercase tracking-[0.15em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-brand-accent">trending_up</span>
                    Trending Now
                  </h3>
                  <div className="flex-1 h-px bg-outline-variant/30" />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {secondaryArticles.map((article: any, index: number) => (
                    <Link
                      href={`/news/${generateSlug(article.title)}-${article.id}`}
                      key={article.id}
                      className="group flex gap-5 items-start p-5 rounded-2xl bg-white border border-outline-variant/20 hover:border-brand-accent/40 hover:shadow-lg transition-all duration-300"
                    >
                      <span className="text-5xl font-black font-headline text-brand-accent/30 leading-none shrink-0 group-hover:text-brand-accent/60 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold font-headline text-brand-primary leading-snug group-hover:text-brand-primary/70 transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-brand-secondary line-clamp-2 mb-3">
                          {article.summary}
                        </p>
                        <span className="text-[10px] text-brand-secondary/60 font-bold uppercase tracking-widest">
                          {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── More News Grid ─────────────────────────────── */}
            {standardArticles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black font-headline text-brand-primary uppercase tracking-[0.15em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-brand-accent">feed</span>
                      More News
                    </h3>
                    <div className="hidden md:block flex-1 h-px bg-outline-variant/30 w-32" />
                  </div>
                  <Link href="/news" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors group">
                    All Coverage
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {standardArticles.map((article: any) => (
                    <Link
                      href={`/news/${generateSlug(article.title)}-${article.id}`}
                      key={article.id}
                      className="group flex flex-col rounded-2xl bg-white border border-outline-variant/20 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Card Image */}
                      <div className="relative w-full h-44 overflow-hidden bg-surface-container">
                        {article.image_url ? (
                          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bastion-gradient flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-brand-accent/40">newspaper</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-3 left-3 z-20">
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-white/95 text-brand-primary shadow-sm">
                            {article.category || "News"}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="text-[15px] font-bold font-headline text-brand-primary leading-snug group-hover:text-brand-primary/70 transition-colors mb-2 line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-brand-secondary line-clamp-2 mb-4 flex-grow">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15 text-[10px] text-brand-secondary/60 font-bold uppercase tracking-widest">
                          <span className="truncate max-w-[120px]">{article.source || 'Sentry Desk'}</span>
                          <span>{new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
