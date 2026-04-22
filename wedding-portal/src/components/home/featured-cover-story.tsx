"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface FeaturedCoverStoryProps {
  vendor: {
    slug: string;
    businessName: string;
    category: string;
    city: string | null;
    description: string | null;
    coverImage: string | null;
  };
  month: string;
  pullQuote?: string | null;
}

const easeLuxury = [0.16, 1, 0.3, 1] as const;

export function FeaturedCoverStory({
  vendor,
  month,
  pullQuote,
}: FeaturedCoverStoryProps) {
  if (!vendor.coverImage) return null;

  return (
    <section
      className="py-32 md:py-48 px-6 md:px-12 bg-ivory"
      aria-label="כתבת החודש"
    >
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: easeLuxury }}
          className="md:col-span-7 md:col-start-1 relative aspect-[4/5] overflow-hidden"
        >
          <Image
            src={vendor.coverImage}
            alt={vendor.businessName}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition-transform duration-[1500ms] ease-out hover:scale-[1.02]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.2, ease: easeLuxury }}
          className="md:col-span-4 md:col-start-9"
        >
          <p className="text-micro-label text-gold mb-6">
            כתבת החודש · {month}
          </p>
          <h2 className="text-editorial text-5xl md:text-7xl mb-8 text-obsidian">
            {vendor.businessName}
          </h2>
          <p className="text-micro-label text-obsidian/50 mb-8">
            {vendor.category}
            {vendor.city ? ` · ${vendor.city}` : ""}
          </p>

          {vendor.description && (
            <p className="text-body-lux text-lg text-obsidian/80 mb-10 max-w-prose">
              {vendor.description.slice(0, 280)}
              {vendor.description.length > 280 ? "…" : ""}
            </p>
          )}

          {pullQuote && (
            <blockquote className="text-script-accent text-3xl md:text-4xl text-gold mb-10 leading-tight">
              &ldquo;{pullQuote}&rdquo;
            </blockquote>
          )}

          <Link
            href={`/vendors/${vendor.slug}`}
            className="inline-flex items-center gap-3 text-micro-label text-obsidian border-b border-obsidian pb-1 hover:gap-5 transition-all"
          >
            קרא את הסיפור המלא
            <span aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
