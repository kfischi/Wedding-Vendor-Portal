export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { ExternalLink, Bell, Shield, Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "הגדרות | WeddingPro" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
  } catch {
    // DB not connected
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא.</p>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/vendors/${vendor.slug}`;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <p className="font-script text-xl text-gold">חשבון</p>
        <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">הגדרות</h1>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-stone/50" />
          <h2 className="font-semibold text-obsidian text-sm">פרטי חשבון</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone/60 mb-1 font-medium uppercase tracking-wide">אימייל</p>
            <p className="text-sm text-obsidian font-medium" dir="ltr">{user.email}</p>
            <p className="text-xs text-stone/40 mt-0.5">לשינוי אימייל — פנו לתמיכה</p>
          </div>
          <div>
            <p className="text-xs text-stone/60 mb-1 font-medium uppercase tracking-wide">מזהה משתמש</p>
            <p className="text-xs text-stone/50 font-mono" dir="ltr">{user.id}</p>
          </div>
          <div>
            <p className="text-xs text-stone/60 mb-1 font-medium uppercase tracking-wide">Slug פרופיל</p>
            <p className="text-sm font-mono text-obsidian" dir="ltr">{vendor.slug}</p>
            <p className="text-xs text-stone/40 mt-0.5">כתובת הפרופיל שלך — לא ניתן לשינוי</p>
          </div>
          <div>
            <p className="text-xs text-stone/60 mb-1 font-medium uppercase tracking-wide">חבר מאז</p>
            <p className="text-sm text-obsidian">
              {new Intl.DateTimeFormat("he-IL", {
                day: "2-digit", month: "long", year: "numeric",
              }).format(new Date(vendor.createdAt))}
            </p>
          </div>
        </div>
      </div>

      {/* Profile link */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="h-4 w-4 text-stone/50" />
          <h2 className="font-semibold text-obsidian text-sm">קישור לפרופיל</h2>
        </div>
        <div className="flex items-center gap-3 bg-champagne/20 rounded-xl px-4 py-3">
          <p className="flex-1 text-sm font-mono text-stone/70 truncate" dir="ltr">{publicUrl}</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-gold hover:underline whitespace-nowrap"
          >
            פתח →
          </a>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-stone/50" />
          <h2 className="font-semibold text-obsidian text-sm">התראות</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "לידים חדשים", sub: "קבל אימייל כאשר מישהו שולח פנייה", enabled: true },
            { label: "ביקורות חדשות", sub: "קבל אימייל כאשר לקוח מפרסם ביקורת", enabled: true },
            { label: "עדכוני מערכת", sub: "עדכונים על שינויים בפלטפורמה", enabled: false },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-obsidian font-medium">{n.label}</p>
                <p className="text-xs text-stone/50">{n.sub}</p>
              </div>
              <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                n.enabled ? "bg-gold/80 justify-end" : "bg-champagne justify-start"
              }`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          ))}
          <p className="text-xs text-stone/40 pt-1">
            לשינוי הגדרות התראות — פנו לתמיכה: support@weddingpro.co.il
          </p>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-4 w-4 text-red-400" />
          <h2 className="font-semibold text-red-600 text-sm">אזור מסוכן</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-obsidian font-medium">מחיקת חשבון</p>
            <p className="text-xs text-stone/50">
              פעולה זו אינה הפיכה. כל הנתונים יימחקו לצמיתות.
            </p>
          </div>
          <a
            href="mailto:support@weddingpro.co.il?subject=בקשה למחיקת חשבון"
            className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            בקש מחיקה
          </a>
        </div>
      </div>
    </div>
  );
}
