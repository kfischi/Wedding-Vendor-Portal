export const dynamic = "force-dynamic";

import { db } from "@/lib/db/db";
import { blogPosts } from "@/lib/db/schema";
import { desc, count, eq } from "drizzle-orm";
import Link from "next/link";
import { FileText, PlusCircle, Eye, Globe, Archive, FileEdit } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "בלוג | WeddingPro Admin" };

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  published: "פורסם",
  archived: "בארכיון",
};

const STATUS_COLORS: Record<string, { color: string; background: string; border: string }> = {
  draft:     { color: "#9ca3af", background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.25)" },
  published: { color: "#34d399", background: "rgba(52,211,153,0.1)",  border: "1px solid rgba(52,211,153,0.25)" },
  archived:  { color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)" },
};

export default async function AdminBlogPage() {
  let posts: Awaited<ReturnType<typeof db.select>>= [];
  let totalCount = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let dbError = false;

  try {
    posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(50);

    const [tot] = await db.select({ value: count() }).from(blogPosts);
    const [pub] = await db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.status, "published"));
    const [dft] = await db.select({ value: count() }).from(blogPosts).where(eq(blogPosts.status, "draft"));
    totalCount = Number(tot?.value ?? 0);
    publishedCount = Number(pub?.value ?? 0);
    draftCount = Number(dft?.value ?? 0);
  } catch {
    dbError = true;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0f0d0c] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-[#b8976a] mb-1">ניהול בלוג</h1>
            <p className="text-white/50 text-sm">כתיבה ידנית ו-AI לתוכן SEO</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors"
            >
              <Globe className="h-4 w-4" />
              צפה בבלוג
            </Link>
            <button
              disabled
              title="בקרוב"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b8976a] text-white text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              <PlusCircle className="h-4 w-4" />
              פוסט חדש
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "סה״כ פוסטים", value: totalCount, icon: FileText, color: "#b8976a" },
            { label: "פורסמו", value: publishedCount, icon: Globe, color: "#34d399" },
            { label: "טיוטות", value: draftCount, icon: FileEdit, color: "#9ca3af" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-5 w-5" style={{ color }} />
                <span className="text-white/50 text-sm">{label}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="rounded-2xl border border-[#b8976a]/30 bg-[#b8976a]/5 p-6 mb-8 text-center">
          <FileText className="h-10 w-10 text-[#b8976a]/60 mx-auto mb-3" />
          <h2 className="font-display text-xl text-[#b8976a] mb-2">עורך בלוג — בקרוב</h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-md mx-auto">
            כאן תוכל לכתוב פוסטים ידנית או לייצר תוכן SEO בעזרת AI.
            עריכה, תזמון פרסום, ניהול תגיות וקטגוריות — הכל במקום אחד.
          </p>
        </div>

        {dbError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm text-red-400">
            שגיאה בטעינת הנתונים מה-DB. ייתכן שטבלת blog_posts טרם נוצרה — הרץ migration.
          </div>
        )}

        {/* Posts table */}
        {!dbError && posts.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-white/80 text-sm">פוסטים</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-right text-white/40 font-medium px-6 py-3">כותרת</th>
                  <th className="text-right text-white/40 font-medium px-4 py-3">קטגוריה</th>
                  <th className="text-right text-white/40 font-medium px-4 py-3">סטטוס</th>
                  <th className="text-right text-white/40 font-medium px-4 py-3">צפיות</th>
                  <th className="text-right text-white/40 font-medium px-4 py-3">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const p = post as {
                    id: string; slug: string; title: string; status: string;
                    category: string; viewCount: number; publishedAt: Date | null; createdAt: Date;
                  };
                  const colors = STATUS_COLORS[p.status] ?? STATUS_COLORS.draft;
                  return (
                    <tr key={p.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white/80 truncate max-w-xs">{p.title}</div>
                        <div className="text-white/30 text-xs mt-0.5">/blog/{p.slug}</div>
                      </td>
                      <td className="px-4 py-4 text-white/50">{p.category}</td>
                      <td className="px-4 py-4">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={colors}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-white/50 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {p.viewCount ?? 0}
                      </td>
                      <td className="px-4 py-4 text-white/40 text-xs">
                        {(p.publishedAt ?? p.createdAt)?.toLocaleDateString("he-IL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!dbError && posts.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>אין פוסטים עדיין</p>
          </div>
        )}

      </div>
    </div>
  );
}
