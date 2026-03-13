export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import {
  Users,
  Eye,
  Star,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  PartyPopper,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, sub }: StatCardProps) {
  return (
    <div className="bg-cream-white rounded-2xl card-shadow border border-champagne/60 p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-stone">{label}</p>
        <div className="p-2 rounded-xl bg-champagne/40">
          <Icon className="h-4 w-4 text-dusty-rose" />
        </div>
      </div>
      <p className="font-display text-3xl text-obsidian">{value}</p>
      {sub && <p className="text-xs text-stone mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { welcome } = await searchParams;

  // ── נתוני ספק + סטטיסטיקות ───────────────────────────────────────────────
  let vendor = null;
  let leadsThisMonth = 0;

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
        .where(
          and(
            eq(leads.vendorId, vendor.id),
            gte(leads.createdAt, firstOfMonth)
          )
        );
      leadsThisMonth = Number(leadsCount) ?? 0;
    }
  } catch {
    // DB לא מחובר — מציג ברירות מחדל
  }

  const businessName = vendor?.businessName ?? user.email ?? "הספק שלי";
  const status = vendor?.status ?? "pending";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = vendor ? `${appUrl}/vendors/${vendor.slug}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ברכה */}
      <div>
        <p className="font-script text-xl text-gold">שלום,</p>
        <h1 className="font-display text-4xl text-obsidian mt-0.5">
          {businessName}
        </h1>
      </div>

      {/* Banner — ברכת הצטרפות */}
      {welcome && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-200">
          <PartyPopper className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-800 text-sm">
              ברוכים הבאים ל-WeddingPro!
            </p>
            <p className="text-green-700 text-xs mt-0.5">
              התשלום התקבל. מלא את פרטי הפרופיל שלך כדי להתחיל לקבל לידים.
            </p>
          </div>
        </div>
      )}

      {/* Banner — ממתין לאישור */}
      {status === "pending" && !welcome && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 text-sm">
              הפרופיל שלך ממתין לאישור
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              הצוות שלנו יאשר את הפרופיל תוך 24–48 שעות. תקבל הודעה באימייל.
            </p>
          </div>
        </div>
      )}

      {/* Banner — פרופיל פעיל */}
      {status === "active" && publicUrl && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-cream-white border border-champagne card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <p className="text-sm font-medium text-obsidian">
              הפרופיל שלך פעיל
            </p>
          </div>
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gold hover:underline font-medium"
          >
            צפה באתר החי
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4 כרטיסי סטטיסטיקה */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="לידים החודש"
          value={leadsThisMonth}
          icon={Users}
          sub="פניות שהתקבלו"
        />
        <StatCard
          label="סה&quot;כ צפיות"
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
          value={
            vendor?.rating != null ? vendor.rating.toFixed(1) : "—"
          }
          icon={Star}
          sub="מתוך 5"
        />
      </div>

      {/* קישורי פעולה מהירה */}
      <div className="bg-cream-white rounded-2xl card-shadow border border-champagne/60 p-6">
        <h3 className="font-medium text-obsidian mb-4">פעולות מהירות</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/content"
            className="flex flex-col gap-1 p-4 rounded-xl bg-champagne/30 hover:bg-champagne/60 transition-colors"
          >
            <span className="text-sm font-medium text-obsidian">עדכן תוכן</span>
            <span className="text-xs text-stone">תיאור ופרטי עסק</span>
          </Link>
          <Link
            href="/dashboard/media"
            className="flex flex-col gap-1 p-4 rounded-xl bg-champagne/30 hover:bg-champagne/60 transition-colors"
          >
            <span className="text-sm font-medium text-obsidian">הוסף מדיה</span>
            <span className="text-xs text-stone">תמונות וסרטונים</span>
          </Link>
          <Link
            href="/dashboard/leads"
            className="flex flex-col gap-1 p-4 rounded-xl bg-champagne/30 hover:bg-champagne/60 transition-colors"
          >
            <span className="text-sm font-medium text-obsidian">הלידים שלי</span>
            <span className="text-xs text-stone">פניות מלקוחות</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
