"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage not available (SSR / private mode)
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {}
    setVisible(false);
  };

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-5 sm:max-w-sm z-50"
        >
          <div className="bg-ivory rounded-2xl card-shadow gold-border p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-4 h-4 text-gold" />
                </div>
                <p className="text-sm font-medium text-obsidian">עוגיות אתר</p>
              </div>
              <button
                onClick={dismiss}
                className="text-stone/50 hover:text-stone transition-colors mt-0.5"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <p className="text-xs text-stone leading-relaxed">
              אנו משתמשים בעוגיות לשיפור חווית הגלישה, ניתוח תנועה ושיפור השירות.
              הגלישה באתר מהווה הסכמה לשימוש בעוגיות.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 text-xs font-medium bg-obsidian text-white rounded-xl hover:bg-obsidian/80 transition-colors"
              >
                אני מסכים/ה
              </button>
              <Link
                href="/cookies"
                className="flex-1 py-2 text-xs font-medium text-center border border-champagne text-stone rounded-xl hover:bg-champagne/40 transition-colors"
              >
                קרא עוד
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
