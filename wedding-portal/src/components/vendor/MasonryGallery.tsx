"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { VendorMedia } from "@/lib/db/schema";

interface MasonryGalleryProps {
  images: VendorMedia[];
  cloudName: string;
}

function getUrl(media: VendorMedia, cloudName: string, size: "thumb" | "full"): string {
  if (media.publicId) {
    const transform = size === "thumb"
      ? "w_800,c_fill,f_auto,q_auto"
      : "f_auto,q_auto,w_1920";
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${media.publicId}`;
  }
  // Direct URL (mock / already built)
  if (size === "full") return media.url;
  return media.url;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const lightboxVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const imgVariants = {
  enter: { opacity: 0, scale: 0.94 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export function MasonryGallery({ images, cloudName }: MasonryGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  const goPrev = useCallback(
    () => setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  );
  const goNext = useCallback(
    () => setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  );

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goNext();  // RTL: left arrow = next
      if (e.key === "ArrowRight") goPrev(); // RTL: right arrow = prev
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIdx, closeLightbox, goPrev, goNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  if (images.length === 0) return null;

  return (
    <>
      <section>
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="font-display text-3xl text-obsidian">גלריה</h2>
          <span className="text-stone text-sm">{images.length} תמונות</span>
        </div>

        {/* CSS Masonry */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="[column-count:2] lg:[column-count:3] [column-gap:0.75rem]"
        >
          {images.map((media, idx) => (
            <motion.div
              key={media.id}
              variants={itemVariants}
              transition={{ duration: 0.55 }}
              className="break-inside-avoid mb-3 relative overflow-hidden rounded-xl cursor-pointer group"
              onClick={() => setLightboxIdx(idx)}
            >
              <Image
                src={getUrl(media, cloudName, "thumb")}
                alt={media.altText ?? `תמונה ${idx + 1}`}
                width={800}
                height={600}
                className="w-full h-auto block transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                {/* Zoom icon top-left */}
                <div className="flex justify-start">
                  <span className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </span>
                </div>
                {/* Alt text bottom */}
                {media.altText && (
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {media.altText}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            variants={lightboxVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button
              className="absolute top-5 left-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              onClick={closeLightbox}
              aria-label="סגור"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/45 text-sm tabular-nums">
              {lightboxIdx + 1} / {images.length}
            </div>

            {/* Prev / Next — swapped for RTL */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label="הקודם"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <button
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label="הבא"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image with key-driven re-animation */}
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                src={getUrl(images[lightboxIdx], cloudName, "full")}
                alt={images[lightboxIdx].altText ?? "תצוגה מוגדלת"}
                className="max-w-[88vw] max-h-[82vh] object-contain rounded-lg shadow-2xl"
                variants={imgVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {/* Alt text caption */}
            {images[lightboxIdx].altText && (
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm text-center max-w-md px-4">
                {images[lightboxIdx].altText}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
