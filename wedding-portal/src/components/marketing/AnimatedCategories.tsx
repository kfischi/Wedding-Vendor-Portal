"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  {
    slug: "photography",
    label: "צילום חתונות",
    img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "wedding-dress-designers",
    label: "מעצבי שמלות כלה",
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4e49?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "venue",
    label: "אולמות ומקומות",
    img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "catering",
    label: "קייטרינג",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "flowers",
    label: "פרחים ועיצוב",
    img: "https://images.unsplash.com/photo-1487530811015-780c45f2cfe8?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "music",
    label: "מוזיקה חיה",
    img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "makeup",
    label: "איפור ושיער",
    img: "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "planning",
    label: "תכנון אירועים",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "dj",
    label: "DJ",
    img: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "cake",
    label: "עוגות חתונה",
    img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=120&h=120&q=80&fit=crop",
  },
  {
    slug: "bridal-preparation",
    label: "התארגנות כלות",
    img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=120&h=120&q=80&fit=crop",
  },
];

export function AnimatedCategories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {CATEGORIES.map(({ slug, label, img }, i) => (
        <motion.div
          key={slug}
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
          whileHover={{
            y: -6,
            boxShadow: "0 14px 32px rgba(0,0,0,0.3)",
            transition: { duration: 0.2 },
          }}
          className="bg-cream-white rounded-2xl card-shadow overflow-hidden"
        >
          <Link
            href={`/vendors?category=${slug}`}
            className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl text-center w-full h-full"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-200">
              <img
                src={img}
                alt={label}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-sm font-medium text-obsidian leading-tight">{label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
