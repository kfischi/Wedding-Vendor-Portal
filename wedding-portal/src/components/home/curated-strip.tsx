"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface CuratedVendor {
  slug: string;
  businessName: string;
  category: string;
  city: string | null;
  coverImage: string | null;
}

interface CuratedStripProps {
  vendors: CuratedVendor[];
  title?: string;
  eyebrow?: string;
}

const easeLuxury = [0.16, 1, 0.3, 1] as const;

export function CuratedStrip({
  vendors,
  title = "הבחירה של העורכים",
  eyebrow = "אוצרות",
}: CuratedStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Cap to 6 per spec — keep the strip curated, not a dump.
  const items = vendors.slice(0, 6);
  if (items.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // One card's worth (approx 70% of viewport width on mobile, 1/3 on desktop)
    const card = el.querySelector<HTMLElement>("[data-curated-card]");
    const delta = card ? card.offsetWidth + 24 : el.offsetWidth * 0.7;
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Match RTL: ArrowLeft moves forward in visual order → scroll right.
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(1);
    }
  };

  return (
    <section
      className="py-24 md:py-32 bg-cream-white"
      aria-label="ספקים מומלצים"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-12">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: easeLuxury }}
          className="text-micro-label text-gold mb-4"
        >
          {eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeLuxury }}
          className="text-editorial text-4xl md:text-6xl text-obsidian"
        >
          {title}
        </motion.h2>
      </div>

      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label="גלילה בין ספקים מומלצים"
        onKeyDown={handleKey}
        className="flex gap-6 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth px-6 md:px-12 pb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-cream-white"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((v, i) => (
          <motion.article
            key={v.slug}
            data-curated-card
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: easeLuxury }}
            className="snap-start flex-none w-[75vw] sm:w-[50vw] md:w-[38vw] lg:w-[28vw] xl:w-[22vw]"
          >
            <Link
              href={`/vendors/${v.slug}`}
              className="block group focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-4"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-champagne/30">
                {v.coverImage ? (
                  <Image
                    src={v.coverImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 75vw, (max-width: 1280px) 38vw, 22vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                  />
                ) : null}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-obsidian/45 via-transparent to-transparent"
                />
              </div>
              <div className="pt-5">
                <p className="text-micro-label text-obsidian/50 mb-2">
                  {v.category}
                  {v.city ? ` · ${v.city}` : ""}
                </p>
                <h3 className="text-editorial text-2xl md:text-3xl text-obsidian">
                  {v.businessName}
                </h3>
              </div>
            </Link>
          </motion.article>
        ))}
        {/* Terminal spacer so last card can fully align-start with room */}
        <div aria-hidden="true" className="flex-none w-6 md:w-12" />
      </div>
    </section>
  );
}
