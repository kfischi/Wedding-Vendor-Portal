"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import type { Review } from "@/lib/db/schema";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? "fill-gold text-gold" : "fill-champagne text-champagne"}`}
        />
      ))}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <h2 className="font-display text-3xl text-obsidian">ביקורות</h2>

        {/* Average rating badge */}
        <div className="flex items-center gap-3 bg-cream-white border border-champagne/60 rounded-2xl px-4 py-3 card-shadow">
          <span className="font-display text-3xl text-obsidian leading-none">{avg.toFixed(1)}</span>
          <div>
            <StarRating rating={Math.round(avg)} size="sm" />
            <p className="text-stone text-xs mt-1">{reviews.length} ביקורות</p>
          </div>
        </div>
      </div>

      {/* Mobile: horizontal scroll / Desktop: grid */}
      <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 sm:gap-4">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="shrink-0 w-[82vw] sm:w-auto snap-start bg-cream-white rounded-2xl p-6 card-shadow border border-champagne/50 relative overflow-hidden"
          >
            {/* Decorative quote mark */}
            <Quote
              className="absolute top-4 left-4 w-8 h-8 text-gold/8 fill-gold/8"
              aria-hidden
            />

            {/* Top row: stars + date */}
            <div className="flex items-start justify-between mb-4">
              <StarRating rating={review.rating} />
              <span className="text-stone text-xs">
                {new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(
                  new Date(review.createdAt)
                )}
              </span>
            </div>

            {/* Title */}
            {review.title && (
              <p className="font-display text-base text-obsidian mb-2 leading-snug">
                {review.title}
              </p>
            )}

            {/* Body */}
            <p className="text-stone text-sm leading-relaxed line-clamp-4">{review.body}</p>

            {/* Footer: author + verified */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-champagne/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blush to-dusty-rose/60 flex items-center justify-center text-white text-xs font-medium">
                  {review.authorName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-obsidian">{review.authorName}</span>
              </div>
              {review.isVerified && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>✓</span> מאומת
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
