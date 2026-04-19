"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  author_email: string;
  source: string;
  created_at: string;
  image_url: string | null;
  views: number;
}

interface NewsFilteredGridProps {
  allNews: NewsItem[];
}

const NEWS_CATEGORIES = [
  "AI Updates",
  "Cybercrime Trends",
  "Global Trends",
  "Internet Governance",
  "Events",
  "Internship and Job Opportunities",
  "Cybersecurity",
  "Laws and Policies",
];

const CATEGORY_ICONS: Record<string, string> = {
  "AI Updates": "smart_toy",
  "Cybercrime Trends": "warning",
  "Global Trends": "public",
  "Internet Governance": "gavel",
  "Events": "event",
  "Internship and Job Opportunities": "work",
  "Cybersecurity": "shield",
  "Laws and Policies": "menu_book",
};

const PAGE_SIZE = 24;

function imgSrc(news: { id: string; image_url: string | null }) {
  if (!news.image_url) return null;
  if (news.image_url === '__base64__') return `/api/news-image?id=${news.id}`;
  return news.image_url;
}

export function NewsFilteredGrid({ allNews }: NewsFilteredGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    allNews.forEach((news) => {
      if (news.author_email) authors.add(news.author_email);
    });
    return Array.from(authors).sort();
  }, [allNews]);

  const filteredNews = useMemo(() => {
    return allNews.filter((news) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAuthor = news.author_email?.toLowerCase().includes(query);
        const matchesTitle = news.title?.toLowerCase().includes(query);
        if (!matchesAuthor && !matchesTitle) {
          return false;
        }
      }
      if (selectedCategory) {
        const isMatch = news.category === selectedCategory || news.category.startsWith(`${selectedCategory} (`);
        if (!isMatch) return false;
      }
      if (dateFrom) {
        const articleDate = new Date(news.created_at).setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (articleDate < fromDate) return false;
      }
      if (dateTo) {
        const articleDate = new Date(news.created_at).setHours(23, 59, 59, 999);
        const toDate = new Date(dateTo).setHours(23, 59, 59, 999);
        if (articleDate > toDate) return false;
      }
      return true;
    });
  }, [allNews, searchQuery, selectedCategory, dateFrom, dateTo]);

  // Reset visible count when filters change
  const visibleNews = filteredNews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNews.length;

  const hasActiveFilters =
    searchQuery || selectedCategory || dateFrom || dateTo;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setDateFrom("");
    setDateTo("");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      {/* ── Filter Panel ────────────────────────────────────── */}
      <div className="mb-10">
        {/* Toggle */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-outline-variant/30 hover:border-brand-primary/30 transition-all duration-200 mb-4 shadow-sm text-brand-primary"
        >
          <span className="material-symbols-outlined text-brand-accent text-base">tune</span>
          <span className="font-bold text-sm">Filter Articles</span>
          <span className={`material-symbols-outlined text-brand-secondary text-sm transition-transform duration-200 ${isFiltersOpen ? "rotate-180" : ""}`}>
            expand_more
          </span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
          )}
        </button>

        {/* Panel Body */}
        <div className={`transition-all duration-400 ease-in-out overflow-hidden ${isFiltersOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="rounded-2xl bg-white border border-outline-variant/20 p-6 md:p-8 shadow-sm">

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Search */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">search</span>
                  Search Articles
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                    list="author-suggestions"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 text-brand-primary placeholder:text-brand-secondary/40 text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all"
                  />
                  <datalist id="author-suggestions">
                    {uniqueAuthors.map((author) => (
                      <option key={author} value={author} />
                    ))}
                  </datalist>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary/50 hover:text-brand-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">calendar_month</span>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 text-brand-primary text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all"
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">event</span>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 text-brand-primary text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">category</span>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/30 text-brand-primary text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23515f74' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="">All Categories</option>
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="mt-6 flex flex-wrap gap-2 pt-5 border-t border-outline-variant/15">
              <button
                onClick={() => { setSelectedCategory(""); setVisibleCount(PAGE_SIZE); }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                  selectedCategory === ""
                    ? "bg-brand-primary text-white shadow-md"
                    : "bg-surface text-brand-secondary border border-outline-variant/30 hover:border-brand-primary/30 hover:text-brand-primary"
                }`}
              >
                <span className="material-symbols-outlined text-sm">apps</span>
                All
              </button>
              {NEWS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(selectedCategory === cat ? "" : cat); setVisibleCount(PAGE_SIZE); }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                    selectedCategory === cat
                      ? "bg-brand-primary text-white shadow-md"
                      : "bg-surface text-brand-secondary border border-outline-variant/30 hover:border-brand-primary/30 hover:text-brand-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[cat] || "label"}</span>
                  {cat}
                </button>
              ))}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-outline-variant/15">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-brand-secondary">
                    Showing <span className="text-brand-primary font-bold">{filteredNews.length}</span> of <span className="text-brand-primary font-bold">{allNews.length}</span> articles
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/10 text-brand-primary text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">search</span>
                        {searchQuery}
                        <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-red-500 transition-colors text-base leading-none">x</button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/10 text-brand-primary text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">category</span>
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-500 transition-colors text-base leading-none">x</button>
                      </span>
                    )}
                    {(dateFrom || dateTo) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/10 text-brand-primary text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">date_range</span>
                        {dateFrom || "..."} → {dateTo || "..."}
                        <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-1 hover:text-red-500 transition-colors text-base leading-none">x</button>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-sm">filter_list_off</span>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Grid ────────────────────────────────────── */}
      {visibleNews.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleNews.map((news, index) => {
              let badgeColors = "bg-emerald-50 text-emerald-700 border-emerald-100";
              if (
                news.category?.toLowerCase().includes("fraud") ||
                news.category?.toLowerCase().includes("scam") ||
                news.category?.toLowerCase().includes("crime") ||
                news.category?.toLowerCase().includes("critical")
              ) {
                badgeColors = "bg-red-50 text-red-700 border-red-100";
              } else if (
                news.category?.toLowerCase().includes("warning") ||
                news.category?.toLowerCase().includes("alert")
              ) {
                badgeColors = "bg-amber-50 text-amber-700 border-amber-100";
              }

              return (
                <div
                  key={news.id}
                  className="group bg-white rounded-2xl border border-outline-variant/20 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 overflow-hidden bg-surface-container">
                    {imgSrc(news) ? (
                      <img src={imgSrc(news)!} alt={news.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bastion-gradient flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-brand-accent/40">newspaper</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-3 left-3 z-20">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${badgeColors}`}>
                        {news.category || "News"}
                      </span>
                    </div>
                    {news.created_at && (
                      <div className="absolute top-3 right-3 z-20">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/95 text-brand-secondary shadow-sm">
                          {new Date(news.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <Link href={`/news/${generateSlug(news.title)}-${news.id}`} target="_blank">
                      <h4 className="text-lg font-bold font-headline mb-3 text-brand-primary leading-snug group-hover:text-brand-primary/70 transition-colors cursor-pointer line-clamp-2">
                        {news.title}
                      </h4>
                    </Link>
                    <p className="text-brand-secondary text-sm mb-6 line-clamp-3 leading-relaxed">
                      {news.summary}
                    </p>
                    <div className="mt-auto pt-4 border-t border-outline-variant/15 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-secondary/70 flex items-center gap-1.5 truncate max-w-[55%]">
                        <span className="material-symbols-outlined text-xs text-brand-accent">verified</span>
                        {news.source || "Ministry of Cyber Affairs News"}
                      </span>
                      <Link
                        href={`/news/${generateSlug(news.title)}-${news.id}`}
                        target="_blank"
                        className="text-[11px] font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1 shrink-0"
                      >
                        Read
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-sm">expand_more</span>
                Load More Articles
              </button>
              <p className="text-xs text-brand-secondary/60 mt-3">
                Showing {visibleNews.length} of {filteredNews.length} articles
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-container mb-6">
            <span className="material-symbols-outlined text-4xl text-brand-secondary/40">search_off</span>
          </div>
          <h3 className="font-headline text-2xl font-bold text-brand-primary mb-3">No Articles Found</h3>
          <p className="text-brand-secondary mb-8 max-w-md mx-auto">
            No articles match your current filters. Try adjusting your search criteria or clearing the filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">filter_list_off</span>
            Clear All Filters
          </button>
        </div>
      )}
    </>
  );
}
