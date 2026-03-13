"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&q=80",
];

const hidden = { opacity: 0, y: 24 };
const visible = { opacity: 1, y: 0 };

export function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[92svh] flex items-center overflow-hidden">
      {/* Rotating background images */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={IMAGES[current]}
              alt="חתונה מושלמת"
              fill
              className="object-cover"
              priority={current === 0}
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="max-w-2xl backdrop-blur-[1px]">
          <motion.p
            initial={hidden}
            animate={visible}
            transition={{ delay: 0, duration: 0.65, ease: "easeOut" }}
            className="font-script text-gold text-2xl sm:text-3xl mb-3 drop-shadow"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
          >
            היום הגדול שלכם מתחיל כאן
          </motion.p>

          <h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 drop-shadow-lg"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
          >
            <motion.span
              initial={hidden}
              animate={visible}
              transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
              className="block"
            >
              מצאו את ספקי
            </motion.span>
            <motion.span
              initial={hidden}
              animate={visible}
              transition={{ delay: 0.3, duration: 0.65, ease: "easeOut" }}
              className="block text-gold"
            >
              החתונה המושלמים
            </motion.span>
          </h1>

          <motion.p
            initial={hidden}
            animate={visible}
            transition={{ delay: 0.45, duration: 0.65, ease: "easeOut" }}
            className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            מעל 500 ספקים מובחרים בישראל — צלמים, אולמות, קייטרינג, פרחים ועוד.
            כל מה שצריך למסע אל חתונת החלומות.
          </motion.p>

          <motion.div
            initial={hidden}
            animate={visible}
            transition={{ delay: 0.6, duration: 0.65, ease: "easeOut" }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-obsidian font-semibold text-sm hover:bg-gold/90 transition-colors shadow-lg"
            >
              חפשו ספקים
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium text-sm hover:bg-white/25 transition-colors"
            >
              הצטרפו כספק
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/50">
        <span className="text-xs tracking-widest uppercase">גלול למטה</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 right-8 z-10 flex gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-gold w-4" : "bg-white/40 w-1.5"
            }`}
            aria-label={`תמונה ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
