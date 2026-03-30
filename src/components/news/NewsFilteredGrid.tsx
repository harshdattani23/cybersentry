"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { collectCardImages } from "@/lib/extractImage";
import { generateSlug } from "@/lib/utils";
import { CardImageCarousel } from "@/components/news/CardImageCarousel";

interface NewsItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
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
  "Banking Fraud",
  "UPI Fraud",
  "Cyber Advisory",
  "Policy Update",
  "Emerging Scam",
  "AI Fraud",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Banking Fraud": "account_balance",
  "UPI Fraud": "phone_android",
  "Cyber Advisory": "shield",
  "Policy Update": "gavel",
  "Emerging Scam": "warning",
  "AI Fraud": "smart_toy",
};

export function NewsFilteredGrid({ allNews }: NewsFilteredGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

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
      if (selectedCategory && news.category !== selectedCategory) {
        return false;
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

  const hasActiveFilters =
    searchQuery || selectedCategory || dateFrom || dateTo;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      {/* ── Filter Panel ────────────────────────────────────── */}
      <div className="mb-10">
        {/* Toggle Button */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="group inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#0b1225] border border-[#1e2a45] hover:border-brand-accent/50 transition-all duration-300 mb-4 shadow-lg"
        >
          <span className="material-symbols-outlined text-brand-accent text-lg">
            tune
          </span>
          <span className="text-white font-bold text-sm tracking-wide">
            Filter Articles
          </span>
          <span
            className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-300 ${isFiltersOpen ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
          {hasActiveFilters && (
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
          )}
        </button>

        {/* Filter Panel */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${isFiltersOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="relative rounded-3xl bg-[#0b1225] border border-[#1e2a45] p-8 shadow-2xl overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-accent/8 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {/* Search Articles */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">
                    search
                  </span>
                  Search Articles
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    list="author-suggestions"
                    className="w-full px-4 py-3 rounded-xl bg-[#141d33] border border-[#253352] text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all duration-300"
                  />
                  <datalist id="author-suggestions">
                    {uniqueAuthors.map((author) => (
                      <option key={author} value={author} />
                    ))}
                  </datalist>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">
                    calendar_month
                  </span>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-[#141d33] border border-[#253352] text-white text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all duration-300 [color-scheme:dark]"
                />
              </div>

              {/* Date To */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">
                    event
                  </span>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-[#141d33] border border-[#253352] text-white text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all duration-300 [color-scheme:dark]"
                />
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-brand-accent text-sm">
                    category
                  </span>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#141d33] border border-[#253352] text-white text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all duration-300 appearance-none cursor-pointer [color-scheme:dark]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="">All Categories</option>
                  {NEWS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills (quick select) */}
            <div className="mt-6 flex flex-wrap gap-2.5 relative z-10">
              <button
                onClick={() => setSelectedCategory("")}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
                  selectedCategory === ""
                    ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/30"
                    : "bg-[#141d33] text-slate-300 border border-[#253352] hover:border-brand-accent/40 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  apps
                </span>
                All
              </button>
              {NEWS_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? "" : cat)
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
                    selectedCategory === cat
                      ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/30"
                      : "bg-[#141d33] text-slate-300 border border-[#253352] hover:border-brand-accent/40 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {CATEGORY_ICONS[cat] || "label"}
                  </span>
                  {cat}
                </button>
              ))}
            </div>

            {/* Active Filter Summary & Clear */}
            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-[#1e2a45] relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-400 font-medium">
                    Showing{" "}
                    <span className="text-brand-accent font-bold text-base">
                      {filteredNews.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-white font-bold text-base">
                      {allNews.length}
                    </span>{" "}
                    articles
                  </span>
                  {/* Active filter tags */}
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">
                          search
                        </span>
                        {searchQuery}
                        <button
                          onClick={() => setSearchQuery("")}
                          className="ml-1 hover:text-white transition-colors text-base leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">
                          category
                        </span>
                        {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory("")}
                          className="ml-1 hover:text-white transition-colors text-base leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {(dateFrom || dateTo) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-bold border border-brand-accent/20">
                        <span className="material-symbols-outlined text-xs">
                          date_range
                        </span>
                        {dateFrom || "..."} → {dateTo || "..."}
                        <button
                          onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                          }}
                          className="ml-1 hover:text-white transition-colors text-base leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/25 hover:text-red-300 transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-sm">
                    filter_list_off
                  </span>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results Grid ────────────────────────────────────── */}
      {filteredNews.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((news, index) => {
            const cardImages = collectCardImages(news.image_url, news.content);
            let badgeColors = "bg-brand-accent/20 text-[#008f5d]";
            if (
              news.category?.toLowerCase().includes("fraud") ||
              news.category?.toLowerCase().includes("scam") ||
              news.category?.toLowerCase().includes("critical")
            ) {
              badgeColors = "bg-red-100 text-red-700";
            } else if (
              news.category?.toLowerCase().includes("warning") ||
              news.category?.toLowerCase().includes("alert")
            ) {
              badgeColors = "bg-amber-100 text-amber-700";
            }

            return (
              <div
                key={news.id}
                className="bg-white rounded-[2rem] shadow-sm border border-outline-variant/20 flex flex-col hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Card Image Carousel */}
                <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-surface-container to-surface-container-high">
                  <CardImageCarousel images={cardImages} alt={news.title} />
                  <div className="absolute top-4 left-4 z-20">
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${badgeColors} backdrop-blur-sm`}
                    >
                      {news.category || "News"}
                    </span>
                  </div>
                  {news.created_at && (
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-white/90 text-brand-secondary backdrop-blur-sm">
                        {new Date(news.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {/* Card Content */}
                <div className="p-8 flex flex-col flex-1">
                  <Link href={`/news/${generateSlug(news.title)}-${news.id}`} target="_blank">
                    <h4 className="text-xl font-bold font-headline mb-4 text-brand-primary leading-tight group-hover:text-brand-primary/70 transition-colors uppercase cursor-pointer">
                      {news.title}
                    </h4>
                  </Link>
                  <p className="text-brand-secondary mb-8 line-clamp-3 leading-relaxed">
                    {news.summary}
                  </p>
                  <div className="mt-auto pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        verified
                      </span>
                      Ref: {news.source || "CyberSentry News"}
                    </span>
                    <Link
                      href={`/news/${generateSlug(news.title)}-${news.id}`}
                      target="_blank"
                      className="text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-brand-accent transition-colors flex items-center gap-1"
                    >
                      Read More
                      <span className="material-symbols-outlined text-sm">
                        open_in_new
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#0b1225] border border-[#1e2a45] mb-6">
            <span className="material-symbols-outlined text-4xl text-slate-400">
              search_off
            </span>
          </div>
          <h3 className="font-headline text-2xl font-bold text-brand-primary mb-3">
            No Articles Found
          </h3>
          <p className="text-brand-secondary mb-8 max-w-md mx-auto">
            No articles match your current filters. Try adjusting your search
            criteria or clearing the filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-white font-bold text-sm hover:bg-brand-accent/90 transition-all duration-300 shadow-lg shadow-brand-accent/25"
          >
            <span className="material-symbols-outlined text-sm">
              filter_list_off
            </span>
            Clear All Filters
          </button>
        </div>
      )}
    </>
  );
}
