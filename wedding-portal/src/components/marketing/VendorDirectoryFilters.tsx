"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useRef } from "react";

const CATEGORIES = [
  { value: "", label: "כל הקטגוריות" },
  { value: "photography", label: "צילום" },
  { value: "videography", label: "וידאו" },
  { value: "venue", label: "אולמות" },
  { value: "catering", label: "קייטרינג" },
  { value: "flowers", label: "פרחים" },
  { value: "music", label: "מוזיקה" },
  { value: "dj", label: "DJ" },
  { value: "makeup", label: "איפור" },
  { value: "dress", label: "שמלות כלה" },
  { value: "cake", label: "עוגות" },
  { value: "planning", label: "תכנון" },
  { value: "lighting", label: "תאורה" },
  { value: "other", label: "אחר" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "דירוג" },
  { value: "views", label: "פופולריות" },
  { value: "createdAt", label: "חדשים ביותר" },
];

export function VendorDirectoryFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);

  const push = useCallback(
    (overrides: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) sp.set(k, v);
        else sp.delete(k);
      });
      sp.delete("page"); // reset to first page on filter change
      router.push(`?${sp.toString()}`);
    },
    [params, router]
  );

  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const city = params.get("city") ?? "";
  const sort = params.get("sort") ?? "rating";
  const hasFilters = q || category || city;

  const clearAll = () => {
    router.push("?");
    if (searchRef.current) searchRef.current.value = "";
  };

  return (
    <div className="bg-cream-white rounded-2xl card-shadow p-4 sm:p-5" dir="rtl">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/50 pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            defaultValue={q}
            placeholder="חיפוש ספק..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-champagne bg-ivory text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                push({ q: (e.target as HTMLInputElement).value });
              }
            }}
            onBlur={(e) => {
              if (e.target.value !== q) push({ q: e.target.value });
            }}
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => push({ category: e.target.value })}
          className="px-3 py-2.5 rounded-xl border border-champagne bg-ivory text-sm text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/40 sm:w-44"
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* City */}
        <input
          type="text"
          defaultValue={city}
          placeholder="עיר..."
          className="px-3 py-2.5 rounded-xl border border-champagne bg-ivory text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/40 sm:w-36"
          onKeyDown={(e) => {
            if (e.key === "Enter") push({ city: (e.target as HTMLInputElement).value });
          }}
          onBlur={(e) => {
            if (e.target.value !== city) push({ city: e.target.value });
          }}
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          className="px-3 py-2.5 rounded-xl border border-champagne bg-ivory text-sm text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/40 sm:w-40"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              מיון: {label}
            </option>
          ))}
        </select>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-champagne text-sm text-stone hover:bg-champagne/40 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            נקה
          </button>
        )}
      </div>
    </div>
  );
}
