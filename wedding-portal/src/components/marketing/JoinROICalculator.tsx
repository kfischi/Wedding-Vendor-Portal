"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

const CATEGORY_LEADS: Record<string, number> = {
  photography: 18,
  venue: 25,
  makeup: 14,
  flowers: 10,
  music: 12,
  dj: 15,
  catering: 20,
  dress: 11,
  planning: 16,
  other: 10,
};

const CITY_MULTIPLIER: Record<string, number> = {
  "תל אביב": 1.5,
  "ירושלים": 1.2,
  "חיפה": 1.1,
  "ראשון לציון": 1.3,
  "נתניה": 1.1,
  "אחר": 1.0,
};

const CATEGORIES = [
  { value: "photography", label: "צילום חתונות" },
  { value: "venue",       label: "אולם אירועים" },
  { value: "makeup",      label: "איפור כלה" },
  { value: "flowers",     label: "עיצוב פרחים" },
  { value: "music",       label: "מוזיקה חיה" },
  { value: "dj",          label: "DJ" },
  { value: "catering",    label: "קייטרינג" },
  { value: "dress",       label: "שמלת כלה" },
  { value: "planning",    label: "מתכנן חתונות" },
  { value: "other",       label: "אחר" },
];

const CITIES = ["תל אביב", "ירושלים", "חיפה", "ראשון לציון", "נתניה", "אחר"];

const inputCls = "w-full px-4 py-3 rounded-xl border border-champagne bg-[#faf9f7] text-sm text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors";

export function JoinROICalculator() {
  const [category, setCategory] = useState("photography");
  const [city, setCity] = useState("תל אביב");

  const base = CATEGORY_LEADS[category] ?? 10;
  const mult = CITY_MULTIPLIER[city] ?? 1.0;
  const leads = Math.round(base * mult);
  const closedLeads = Math.round(leads * 0.25);
  const revenue = closedLeads * 4500;

  return (
    <div className="bg-white rounded-3xl border border-champagne/60 shadow-sm overflow-hidden">
      <div className="bg-champagne/20 p-6 border-b border-champagne/60">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone/60 uppercase tracking-wide mb-2">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone/60 uppercase tracking-wide mb-2">עיר</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-6">
          <div className="bg-[#faf9f7] rounded-2xl p-4 border border-champagne/60">
            <p className="font-display text-3xl text-gold">{leads}</p>
            <p className="text-xs text-stone/55 mt-1">לידים/חודש</p>
          </div>
          <div className="bg-[#faf9f7] rounded-2xl p-4 border border-champagne/60">
            <p className="font-display text-3xl text-obsidian">{closedLeads}</p>
            <p className="text-xs text-stone/55 mt-1">עסקאות פוטנציאליות</p>
          </div>
          <div className="bg-[#faf9f7] rounded-2xl p-4 border border-champagne/60">
            <p className="font-display text-3xl text-green-600">₪{(revenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-stone/55 mt-1">הכנסה פוטנציאלית</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-stone/45 bg-champagne/20 rounded-xl p-3">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>ממוצעים מבוססים על נתוני ספקים בפלטפורמה. הכנסה מחושבת לפי 25% סגירת עסקאות ועלות עסקה ממוצעת של ₪4,500.</p>
        </div>
      </div>
    </div>
  );
}
