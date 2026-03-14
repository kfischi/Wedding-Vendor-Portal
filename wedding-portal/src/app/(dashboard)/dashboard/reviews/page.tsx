export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, reviews } from "@/lib/db/schema";
import { Star, MessageSquare } from "lucide-react";
import type { Review } from "@/lib/db/schema";

export const metadata: Metadata = { title: "ביקורות | WeddingPro" };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "text-gold fill-gold" : "text-champagne"}`}
        />
      ))}
    </div>
  );
}

function ReviewStatus({ review }: { review: Review }) {
  if (review.isPublished && review.isVerified) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        מאומת ומפורסם
      </span>
    );
  }
  if (review.isVerified && !review.isPublished) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        מאומת — ממתין לפרסום
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-stone/10 text-stone border border-champagne">
      ממתין לאימות
    </span>
  );
}

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let vendorReviews: Review[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      vendorReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.vendorId, vendor.id))
        .orderBy(desc(reviews.createdAt));
    }
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

  const published = vendorReviews.filter((r) => r.isPublished && r.isVerified);
  const pending = vendorReviews.filter((r) => !r.isPublished || !r.isVerified);
  const avgRating =
    published.length > 0
      ? (published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-script text-xl text-gold">הפרופיל שלי</p>
          <h1 className="font-display text-4xl text-obsidian">ביקורות</h1>
        </div>
        {avgRating && (
          <div className="text-left bg-cream-white border border-champagne card-shadow rounded-2xl px-5 py-3">
            <p className="text-xs text-stone mb-1">דירוג ממוצע</p>
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl text-obsidian">{avgRating}</span>
              <div>
                <StarRating rating={Math.round(Number(avgRating))} />
                <p className="text-xs text-stone mt-0.5">{published.length} ביקורות</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {vendorReviews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'סה"כ ביקורות', value: vendorReviews.length },
            { label: "מפורסמות", value: published.length },
            { label: "ממתינות לאישור", value: pending.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-cream-white rounded-2xl border border-champagne card-shadow p-4 text-center"
            >
              <p className="font-display text-3xl text-obsidian">{value}</p>
              <p className="text-xs text-stone mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {vendorReviews.length === 0 ? (
        <div className="text-center py-20 bg-cream-white rounded-2xl border border-champagne card-shadow">
          <div className="w-16 h-16 rounded-full bg-champagne/40 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-stone/50" />
          </div>
          <p className="font-display text-2xl text-obsidian mb-2">עדיין אין ביקורות</p>
          <p className="text-stone text-sm max-w-xs mx-auto leading-relaxed">
            ביקורות יופיעו כאן לאחר שלקוחות ישאירו חוות דעת בפרופיל שלכם.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendorReviews.map((review) => (
            <div
              key={review.id}
              className="bg-cream-white rounded-2xl border border-champagne card-shadow p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="font-medium text-obsidian text-sm">
                      {review.authorName}
                    </span>
                    <StarRating rating={review.rating} />
                    <ReviewStatus review={review} />
                  </div>

                  {review.title && (
                    <p className="font-display text-lg text-obsidian mb-1">
                      {review.title}
                    </p>
                  )}

                  <p className="text-sm text-stone leading-relaxed">{review.body}</p>
                </div>

                <div className="text-xs text-stone/50 whitespace-nowrap flex-shrink-0">
                  {new Intl.DateTimeFormat("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(review.createdAt))}
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-3 pt-3 border-t border-champagne/50 flex items-center gap-4">
                <a
                  href={`mailto:${review.authorEmail}`}
                  className="text-xs text-stone hover:text-dusty-rose transition-colors"
                  dir="ltr"
                >
                  {review.authorEmail}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="p-4 rounded-2xl bg-champagne/20 border border-champagne">
        <p className="text-xs text-stone leading-relaxed">
          <strong className="text-obsidian">שימו לב:</strong> ביקורות מפורסמות הן אלו שאומתו ואושרו על ידי צוות WeddingPro.
          ביקורות ממתינות עדיין עוברות בדיקה. אין אפשרות למחוק ביקורות שהושאלו על ידי לקוחות.
        </p>
      </div>
    </div>
  );
}
