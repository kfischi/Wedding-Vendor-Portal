"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const CATEGORIES = [
  {
    slug: "photography",
    label: "צילום חתונות",
    img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "wedding-dress-designers",
    label: "מעצבי שמלות כלה",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=75&fit=crop&crop=top",
  },
  {
    slug: "venue",
    label: "אולמות ומקומות",
    img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "catering",
    label: "קייטרינג",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "flowers",
    label: "פרחים ועיצוב",
    img: "https://images.unsplash.com/photo-1487530811015-780c45f2cfe8?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "music",
    label: "מוזיקה חיה",
    img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "makeup",
    label: "איפור ושיער",
    img: "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=400&q=75&fit=crop&crop=top",
  },
  {
    slug: "planning",
    label: "תכנון אירועים",
    img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "dj",
    label: "DJ",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=75&fit=crop&crop=center",
  },
  {
    slug: "cake",
    label: "עוגות חתונה",
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75&fit=crop&crop=top",
  },
  {
    slug: "bridal-preparation",
    label: "התארגנות כלות",
    img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=75&fit=crop&crop=top",
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
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.07, duration: 0.45, ease: "easeOut" }}
          whileHover={{ y: -5, transition: { duration: 0.25, ease: "easeOut" } }}
          className="rounded-2xl overflow-hidden card-shadow"
          style={{ willChange: "transform" }}
        >
          <Link
            href={`/vendors?category=${slug}`}
            className="block relative h-36 sm:h-40"
          >
            <img
              src={img}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            {/* label */}
            <span className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-6 text-sm font-medium text-white text-center leading-tight">
              {label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
