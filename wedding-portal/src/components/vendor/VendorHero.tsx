"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, ChevronDown } from "lucide-react";
import type { Vendor, VendorMedia } from "@/lib/db/schema";

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
  other: "ספק שירותים",
};

interface VendorHeroProps {
  vendor: Vendor;
  heroVideo?: VendorMedia | null;
  heroImageUrl?: string | null;
}

export function VendorHero({ vendor, heroVideo, heroImageUrl }: VendorHeroProps) {
  const videoUrl = heroVideo?.url ?? null;
  const categoryLabel = CATEGORY_LABELS[vendor.category] ?? vendor.category;

  return (
    <section className="relative w-full overflow-hidden bg-obsidian" style={{ height: "100svh", minHeight: 600 }}>
      {/* ── Background ── */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt={vendor.businessName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-obsidian via-stone/70 to-dusty-rose/20" />
      )}

      {/* ── Layered gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

      {/* ── Content ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center">

        {/* Category — script font */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-script text-white/65 text-2xl sm:text-3xl mb-2"
        >
          {categoryLabel}
        </motion.p>

        {/* Business name — Cormorant, italic, large */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl text-white italic leading-none mb-5"
          style={{ textShadow: "0 4px 48px rgba(0,0,0,0.35)" }}
        >
          {vendor.businessName}
        </motion.h1>

        {/* Thin gold divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="w-16 h-px mb-5"
          style={{ background: "rgba(184,147,90,0.7)" }}
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

        {/* City */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="flex items-center gap-1.5 text-white/50 text-sm"
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
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <span className="text-white/30 text-[10px] uppercase tracking-[0.2em]">גלול</span>
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-white/35" />
        </motion.div>
      </motion.div>
    </section>
  );
}
