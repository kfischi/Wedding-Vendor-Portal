"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface HeroEditorialProps {
  backgroundMedia: {
    type: "image" | "video";
    src: string;
    poster?: string;
    alt?: string;
  };
  preTitle?: string;
  titleLine1: string;
  titleHighlight: string;
  titleLine2: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const easeLuxury = [0.16, 1, 0.3, 1] as const;

export function HeroEditorial({
  backgroundMedia,
  preTitle = "אוצרות חתונות היוקרה של ישראל",
  titleLine1,
  titleHighlight,
  titleLine2,
  subtitle,
  primaryCta,
  secondaryCta,
}: HeroEditorialProps) {
  return (
    <section
      className="relative min-h-[100svh] w-full overflow-hidden bg-obsidian"
      aria-label="Hero"
    >
      {/* Background media */}
      <div className="absolute inset-0 z-0">
        {backgroundMedia.type === "video" ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={backgroundMedia.poster}
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <source src={backgroundMedia.src} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={backgroundMedia.src}
            alt={backgroundMedia.alt ?? ""}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-obsidian/60 via-obsidian/25 to-obsidian/50"
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 min-h-[100svh] grid grid-cols-12 gap-6 px-6 md:px-12 py-24 items-center">
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeLuxury }}
            className="text-micro-label text-ivory/75 mb-8"
          >
            {preTitle}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: easeLuxury }}
            className="text-editorial text-ivory text-5xl md:text-7xl lg:text-8xl xl:text-9xl mb-6"
          >
            {titleLine1}{" "}
            <em className="text-script-accent text-gold not-italic">
              {titleHighlight}
            </em>{" "}
            {titleLine2}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: easeLuxury }}
            className="text-body-lux text-ivory/85 text-lg md:text-xl max-w-2xl mb-12"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: easeLuxury }}
            className="flex flex-wrap gap-4"
          >
            <Link
              href={primaryCta.href}
              className="px-8 py-4 bg-ivory text-obsidian text-sm tracking-wide-lux uppercase font-medium hover:bg-gold hover:text-ivory transition-colors"
            >
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="px-8 py-4 border border-ivory/40 text-ivory text-sm tracking-wide-lux uppercase font-medium hover:border-ivory hover:bg-ivory/10 transition-all"
              >
                {secondaryCta.label}
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-3 text-ivory/60">
          <span className="text-micro-label">גלול</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-ivory/40"
          />
        </div>
      </motion.div>
    </section>
  );
}
