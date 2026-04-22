"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { MapPin, ChevronDown, Star, Eye, MessageSquare, Instagram, Play } from "lucide-react";
import type { Vendor, VendorMedia } from "@/lib/db/schema";
import { useRef, useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "צלם חתונות",
  videography: "צלם וידאו",
  venue: "אולם אירועים",
  catering: "קייטרינג",
  flowers: "עיצוב פרחים",
  music: "מוזיקה חיה",
  dj: "DJ",
  makeup: "איפור כלה",
  dress: "שמלות כלה",
  suit: "חליפות חתן",
  cake: "עוגות חתונה",
  invitation: "הזמנות",
  transport: "הסעות",
  lighting: "תאורה",
  planning: "ייעוץ ותכנון",
  "wedding-dress-designers": "מעצבי שמלות כלה",
  "bridal-preparation": "התארגנות כלות",
  other: "ספק שירותים",
};

interface VendorHeroProps {
  vendor: Vendor;
  heroVideo?: VendorMedia | null;
  heroImageUrl?: string | null;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5"
            fill={i < full ? "#b8976a" : i === full && half ? "url(#half)" : "none"}
            stroke={i < full || (i === full && half) ? "#b8976a" : "rgba(255,255,255,0.3)"}
          />
        ))}
      </div>
      <span className="text-white/90 text-sm font-semibold">{rating.toFixed(1)}</span>
      <span className="text-white/50 text-xs">({count})</span>
    </div>
  );
}

export function VendorHero({ vendor, heroVideo, heroImageUrl }: VendorHeroProps) {
  const videoUrl = heroVideo?.url ?? null;
  const categoryLabel = CATEGORY_LABELS[vendor.category] ?? vendor.category;
  const sectionRef = useRef<HTMLElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);

  // Subtle parallax on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const isPremium = vendor.plan === "premium";
  const hasSocial = vendor.instagram || vendor.tiktok || vendor.youtube || vendor.facebook;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-obsidian"
      style={{ height: "100svh", minHeight: 600 }}
    >
      {/* ── Background with parallax ── */}
      <motion.div
        className="absolute inset-0"
        style={{ y: imageY }}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            autoPlay={videoPlaying}
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ scale: 1.05 }}
          />
        ) : heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={vendor.businessName}
            fill
            className="object-cover"
            style={{ scale: 1.05 }}
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-stone/70 to-dusty-rose/20" />
        )}
      </motion.div>

      {/* ── Multi-layer gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

      {/* ── Premium shimmer overlay ── */}
      {isPremium && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 120% 60% at 50% 100%, rgba(184,151,106,0.08) 0%, transparent 70%)",
          }}
        />
      )}

      {/* ── Top badges row ── */}
      <motion.div
        className="absolute top-5 right-5 flex items-center gap-2 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {isPremium && (
          <span
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(184,151,106,0.25) 0%, rgba(154,125,86,0.15) 100%)",
              border: "1px solid rgba(184,151,106,0.5)",
              color: "#e8c97a",
              backdropFilter: "blur(12px)",
            }}
          >
            <Star className="h-3 w-3 fill-current" />
            מומלץ
          </span>
        )}
        {vendor.featuredUntil && new Date(vendor.featuredUntil) > new Date() && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(219,135,151,0.2)",
              border: "1px solid rgba(219,135,151,0.4)",
              color: "#e8a5b5",
              backdropFilter: "blur(12px)",
            }}
          >
            מוצג
          </span>
        )}
      </motion.div>

      {/* ── Video play/pause control ── */}
      {videoUrl && (
        <motion.button
          className="absolute top-5 left-5 z-20 p-2.5 rounded-full"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
          onClick={() => setVideoPlaying((v) => !v)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          aria-label={videoPlaying ? "השהה וידאו" : "הפעל וידאו"}
        >
          {videoPlaying ? (
            <span className="block w-3.5 h-3.5 text-white/70 text-xs font-bold leading-none">⏸</span>
          ) : (
            <Play className="h-3.5 w-3.5 text-white/70 fill-current" />
          )}
        </motion.button>
      )}

      {/* ── Main content ── */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-end pb-28 px-6 text-center"
        style={{ y: contentY, opacity }}
      >
        {/* Category */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-script text-white/65 text-2xl sm:text-3xl mb-2"
        >
          {categoryLabel}
        </motion.p>

        {/* Business name */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl text-white italic leading-none mb-5"
          style={{ textShadow: "0 4px 48px rgba(0,0,0,0.4)" }}
        >
          {vendor.businessName}
        </motion.h1>

        {/* Gold divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="w-20 h-px mb-5"
          style={{ background: "linear-gradient(90deg, transparent, rgba(184,151,106,0.8), transparent)" }}
        />

        {/* Tagline */}
        {vendor.shortDescription && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
            className="text-white/75 text-base sm:text-lg max-w-lg leading-relaxed mb-5"
          >
            {vendor.shortDescription}
          </motion.p>
        )}

        {/* City + Region */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="flex items-center gap-1.5 text-white/50 text-sm mb-6"
        >
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{vendor.city}</span>
          {vendor.region && (
            <>
              <span className="text-white/25">·</span>
              <span>{vendor.region}</span>
            </>
          )}
        </motion.div>

        {/* ── Glassmorphism stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex items-center gap-0 rounded-2xl overflow-hidden mb-4"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {/* Rating */}
          {vendor.rating != null && vendor.reviewCount > 0 && (
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
            >
              <StarRating rating={vendor.rating} count={vendor.reviewCount} />
            </div>
          )}

          {/* Views */}
          {vendor.viewCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-5 py-3 text-white/60"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs">{vendor.viewCount.toLocaleString("he-IL")}</span>
            </div>
          )}

          {/* Lead count */}
          {vendor.leadCount > 0 && (
            <div className="flex items-center gap-1.5 px-5 py-3 text-white/60">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">{vendor.leadCount} פניות</span>
            </div>
          )}
        </motion.div>

        {/* ── Social links bar ── */}
        {hasSocial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex items-center gap-2"
          >
            {vendor.instagram && (
              <a
                href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-white/70" />
              </a>
            )}
            {vendor.tiktok && (
              <a
                href={`https://tiktok.com/@${vendor.tiktok.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                aria-label="TikTok"
              >
                <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
              </a>
            )}
            {vendor.youtube && (
              <a
                href={vendor.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                aria-label="YouTube"
              >
                <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            )}
            {vendor.facebook && (
              <a
                href={vendor.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Bottom gradient fade to page background ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[rgb(250_247_242)] pointer-events-none" />

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.25em]"
          style={{ color: "rgba(184,151,106,0.65)" }}
        >
          גלול
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5" style={{ color: "rgba(184,151,106,0.75)" }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
