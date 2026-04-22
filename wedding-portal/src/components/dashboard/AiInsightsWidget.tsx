"use client";

import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface Insights {
  summary: string;
  conversionRate: number;
  hotLeads: number;
  tips: string[];
  urgentAction: string;
  trend: "positive" | "neutral" | "negative";
}

interface Stats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  unhandled: number;
  closed: number;
}

export function AiInsightsWidget() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/lead-insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setInsights(data.insights);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }

  const TrendIcon = insights?.trend === "positive"
    ? TrendingUp
    : insights?.trend === "negative"
    ? TrendingDown
    : Minus;

  const trendColor = insights?.trend === "positive"
    ? "text-green-600"
    : insights?.trend === "negative"
    ? "text-red-500"
    : "text-stone/50";

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        background: "linear-gradient(135deg, rgba(184,151,106,0.06) 0%, rgba(255,255,255,0.8) 100%)",
        borderColor: "rgba(184,151,106,0.3)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-semibold text-obsidian">תובנות AI</span>
        </div>
        {!insights && (
          <button
            onClick={loadInsights}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #b8976a, #9a7d56)",
              color: "#fff",
            }}
          >
            {loading
              ? <><Loader2 className="h-3 w-3 animate-spin" /> מנתח...</>
              : "נתח לידים"
            }
          </button>
        )}
        {insights && (
          <TrendIcon className={`h-5 w-5 ${trendColor}`} />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Summary */}
          <p className="text-sm text-stone leading-relaxed">{insights.summary}</p>

          {/* Stats pills */}
          {stats && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 font-medium">
                🔥 {stats.hot} חמים
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
                ☀️ {stats.warm} פושרים
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100 font-medium">
                ❄️ {stats.cold} קרים
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
                ✅ {stats.closed} סגורים
              </span>
            </div>
          )}

          {/* Urgent action */}
          {insights.urgentAction && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: "rgba(184,151,106,0.1)", border: "1px solid rgba(184,151,106,0.25)" }}
            >
              <AlertCircle className="h-3.5 w-3.5 text-gold mt-0.5 flex-shrink-0" />
              <span className="text-obsidian font-medium">{insights.urgentAction}</span>
            </div>
          )}

          {/* Tips */}
          {insights.tips?.length > 0 && (
            <ul className="space-y-1.5">
              {insights.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-stone">
                  <span className="text-gold font-bold mt-0.5">›</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {/* Refresh */}
          <button
            onClick={loadInsights}
            disabled={loading}
            className="text-xs text-stone/40 hover:text-gold transition-colors flex items-center gap-1"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "↺"} עדכן ניתוח
          </button>
        </div>
      )}
    </div>
  );
}
