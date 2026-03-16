export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, and, gte, count, desc } from "drizzle-orm";
import {
  Users,
  Eye,
  Star,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  PartyPopper,
  FileText,
  Image,
  TrendingUp,
  CheckCircle2,
  Circle,
  Rocket,
} from "lucide-react";
import type { Lead } from "@/lib/db/schema";

// ── Profile completion ────────────────────────────────────────────────────────

interface CompletionItem { label: string; done: boolean; weight: number }

function calcCompletion(vendor: {
  description: string | null;
  shortDescription: string | null;
  phone: string | null;
  coverImage: string | null;
  instagram: string | null;
  website: string | null;
}): { percent: number; items: CompletionItem[] } {
  const items: CompletionItem[] = [
    { label: "תיאור עסק",         done: !!(vendor.description && vendor.description.length > 20), weight: 30 },
    { label: "Tagline קצר",       done: !!vendor.shortDescription,                                  weight: 10 },
    { label: "טלפון / WhatsApp",  done: !!vendor.phone,                                             weight: 20 },
    { label: "תמונת כריכה",       done: !!vendor.coverImage,                                        weight: 30 },
    { label: "רשת חברתית / אתר", done: !!(vendor.instagram || vendor.website),                    weight: 10 },
  ];
  const percent = items.reduce((s, i) => s + (i.done ? i.weight : 0), 0);
  return { percent, items };
}

// ── Status colors ─────────────────────────────────────────────────────────────

const LEAD_STATUS_COLORS: Record<string, string> = {
  new:       "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  qualified: "bg-green-50 text-green-700 border-green-200",
  closed:    "bg-stone/10 text-stone border-stone/20",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "חדש", contacted: "יצרנו קשר", qualified: "מוסמך", closed: "סגור",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" }).format(new Date(d));
}

// ── Components ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-5 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
      accent
        ? "bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border-gold/25 shadow-[0_2px_16px_rgb(184_151_106/0.12)]"
        : "bg-white/80 backdrop-blur-sm border-champagne/50 shadow-[0_1px_8px_rgb(26_22_20/0.05)]"
    }`}>
      {accent && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      )}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-stone/60 leading-snug tracking-wide">{label}</p>
        <div className={`p-2 rounded-xl ${accent ? "bg-gold/15 shadow-[0_1px_6px_rgb(184_151_106/0.25)]" : "bg-champagne/50"}`}>
          <Icon className={`h-4 w-4 ${accent ? "text-gold" : "text-stone/50"}`} />
        </div>
      </div>
      <p className={`font-display text-3xl leading-none ${accent ? "text-gold" : "text-obsidian"}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-stone/45 mt-1.5">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { welcome } = await searchParams;

  let vendor = null;
  let leadsThisMonth = 0;
  let recentLeads: Lead[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const [{ value: leadsCount }] = await db
        .select({ value: count() })
        .from(leads)
        .where(and(eq(leads.vendorId, vendor.id), gte(leads.createdAt, firstOfMonth)));
      leadsThisMonth = Number(leadsCount) ?? 0;

      recentLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.vendorId, vendor.id))
        .orderBy(desc(leads.createdAt))
        .limit(5);
    }
  } catch {
    // DB not connected — show defaults
  }

  const businessName = vendor?.businessName ?? user.email ?? "הספק שלי";
  const status = vendor?.status ?? "pending";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = vendor ? `${appUrl}/vendors/${vendor.slug}` : null;
  const completion = vendor ? calcCompletion(vendor) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">

      {/* ── Hero greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-script text-xl text-gold">שלום,</p>
          <h1 className="font-display text-3xl lg:text-4xl text-obsidian mt-0.5 leading-tight">
            {businessName} 👋
          </h1>
          <p className="text-stone/60 text-sm mt-1">
            {new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </p>
        </div>
        {status === "active" && publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gold hover:underline font-medium shrink-0 mt-2"
          >
            צפה בפרופיל החי
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* ── Alert banners ──────────────────────────────────────────────────── */}
      {welcome && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
          <PartyPopper className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">ברוכים הבאים ל-WeddingPro!</p>
            <p className="text-green-700 text-xs mt-0.5">
              התשלום התקבל. מלא את פרטי הפרופיל שלך כדי להתחיל לקבל לידים.
            </p>
          </div>
        </div>
      )}

      {status === "pending" && !welcome && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">הפרופיל שלך ממתין לאישור</p>
            <p className="text-amber-700 text-xs mt-0.5">
              הצוות שלנו יאשר את הפרופיל תוך 24–48 שעות. תקבל הודעה באימייל.
            </p>
          </div>
        </div>
      )}

      {status === "active" && publicUrl && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-l from-gold/8 to-transparent border border-gold/20 shadow-[0_2px_12px_rgb(184_151_106/0.1)] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <p className="text-sm font-semibold text-obsidian">הפרופיל שלך פעיל וחי</p>
          </div>
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gold hover:text-gold/80 font-semibold transition-colors"
          >
            צפה באתר החי
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="לידים החודש"
          value={leadsThisMonth}
          icon={Users}
          sub="פניות שהתקבלו"
          accent
        />
        <StatCard
          label="סה״כ צפיות"
          value={vendor?.viewCount ?? 0}
          icon={Eye}
          sub="ביקורים בפרופיל"
        />
        <StatCard
          label="ביקורות"
          value={vendor?.reviewCount ?? 0}
          icon={MessageSquare}
          sub="חוות דעת"
        />
        <StatCard
          label="דירוג ממוצע"
          value={vendor?.rating != null ? vendor.rating.toFixed(1) : "—"}
          icon={Star}
          sub="מתוך 5"
        />
      </div>

      {/* ── Profile completion ────────────────────────────────────────────── */}
      {completion && completion.percent < 100 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-champagne/50 p-5 shadow-[0_2px_16px_rgb(26_22_20/0.05)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-obsidian text-sm">השלמת פרופיל</h3>
              <p className="text-xs text-stone/60 mt-0.5">מלא את הפרטים כדי למשוך יותר לקוחות</p>
            </div>
            <span className="font-display text-2xl text-gold">{completion.percent}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-champagne/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-l from-gold to-gold/60 rounded-full transition-all duration-700"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {/* Checklist */}
          <div className="grid sm:grid-cols-2 gap-2">
            {completion.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-champagne shrink-0" />
                )}
                <span className={`text-xs ${item.done ? "text-stone/50 line-through" : "text-obsidian"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/content"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-gold hover:underline"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            השלם את הפרופיל
          </Link>
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-champagne/50 p-5 shadow-[0_2px_16px_rgb(26_22_20/0.05)]">
        <h3 className="font-semibold text-obsidian text-sm mb-4">פעולות מהירות</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              href: "/dashboard/content",
              icon: FileText,
              title: "עדכן תוכן",
              sub: "תיאור ופרטי עסק",
              color: "bg-blue-50 text-blue-600",
            },
            {
              href: "/dashboard/media",
              icon: Image,
              title: "הוסף מדיה",
              sub: "תמונות וסרטונים",
              color: "bg-rose-50 text-rose-600",
            },
            {
              href: "/dashboard/leads",
              icon: Users,
              title: "הלידים שלי",
              sub: "פניות מלקוחות",
              color: "bg-amber-50 text-amber-600",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/60 border border-champagne/40 hover:bg-white/90 hover:border-champagne/70 hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
            >
              <div className={`p-2 rounded-xl ${action.color} shrink-0`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-obsidian group-hover:text-obsidian">{action.title}</p>
                <p className="text-xs text-stone/60">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Floating profile link (active vendors) ────────────────────────── */}
      {status === "active" && publicUrl && (
        <Link
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 left-4 lg:bottom-6 lg:left-6 z-20 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-l from-gold to-gold/80 text-white text-sm font-semibold shadow-[0_4px_20px_rgb(184_151_106/0.50)] hover:shadow-[0_6px_28px_rgb(184_151_106/0.65)] hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
        >
          <Rocket className="h-4 w-4 shrink-0" />
          צפה בפרופיל
        </Link>
      )}

      {/* ── Recent leads ──────────────────────────────────────────────────── */}
      {recentLeads.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-champagne/50 shadow-[0_2px_16px_rgb(26_22_20/0.05)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-champagne/40">
            <h3 className="font-semibold text-obsidian text-sm">לידים אחרונים</h3>
            <Link href="/dashboard/leads" className="text-xs text-gold hover:underline font-medium">
              כל הלידים ←
            </Link>
          </div>
          <div className="divide-y divide-champagne/30">
            {recentLeads.map((lead) => {
              const initials = lead.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              return (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-champagne/10 transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush/60 to-dusty-rose/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{initials}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-obsidian truncate">{lead.name}</p>
                    <p className="text-xs text-stone/60 truncate" dir="ltr">{lead.phone ?? lead.email}</p>
                  </div>
                  {/* Date + status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-stone/50">{formatDate(lead.createdAt)}</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${LEAD_STATUS_COLORS[lead.status] ?? ""}`}
                    >
                      {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
