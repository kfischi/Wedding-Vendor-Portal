"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  Camera,
  Building2,
  UtensilsCrossed,
  Flower2,
  Music,
  Sparkles,
  Calendar,
  Headphones,
  Cake,
  Shirt,
  Heart,
} from "lucide-react";

const CATEGORIES = [
  { slug: "photography", label: "צילום חתונות", icon: Camera, color: "bg-blush/20 text-dusty-rose" },
  { slug: "wedding-dress-designers", label: "מעצבי שמלות כלה", icon: Shirt, color: "bg-fuchsia-50 text-fuchsia-500" },
  { slug: "venue", label: "אולמות ומקומות", icon: Building2, color: "bg-gold/10 text-gold" },
  { slug: "catering", label: "קייטרינג", icon: UtensilsCrossed, color: "bg-amber-50 text-amber-600" },
  { slug: "flowers", label: "פרחים ועיצוב", icon: Flower2, color: "bg-pink-50 text-pink-500" },
  { slug: "music", label: "מוזיקה חיה", icon: Music, color: "bg-purple-50 text-purple-500" },
  { slug: "makeup", label: "איפור ושיער", icon: Sparkles, color: "bg-rose-50 text-rose-500" },
  { slug: "planning", label: "תכנון אירועים", icon: Calendar, color: "bg-teal-50 text-teal-600" },
  { slug: "dj", label: "DJ", icon: Headphones, color: "bg-indigo-50 text-indigo-500" },
  { slug: "cake", label: "עוגות חתונה", icon: Cake, color: "bg-orange-50 text-orange-500" },
  { slug: "bridal-preparation", label: "התארגנות כלות", icon: Heart, color: "bg-rose-50 text-rose-400" },
];

export function AnimatedCategories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
    >
      {CATEGORIES.map(({ slug, label, icon: Icon, color }, i) => (
        <motion.div
          key={slug}
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
          whileHover={{
            y: -6,
            boxShadow: "0 14px 32px rgba(0,0,0,0.13)",
            transition: { duration: 0.2 },
          }}
          className="bg-cream-white rounded-2xl card-shadow"
        >
          <Link
            href={`/vendors?category=${slug}`}
            className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl text-center w-full h-full"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-obsidian leading-tight">{label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
