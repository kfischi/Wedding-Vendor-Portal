"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Accessibility, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "a11y-prefs";

interface A11yPrefs {
  fontSize: number;   // -1 | 0 | 1 | 2  (steps of 10% each)
  contrast: boolean;
  linksUnderline: boolean;
}

const DEFAULT_PREFS: A11yPrefs = { fontSize: 0, contrast: false, linksUnderline: false };

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;
  // Font size: base 100%, each step ±10%
  root.style.fontSize = prefs.fontSize === 0 ? "" : `${100 + prefs.fontSize * 10}%`;
  root.classList.toggle("a11y-contrast", prefs.contrast);
  root.classList.toggle("a11y-links", prefs.linksUnderline);
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);

  // Load saved prefs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as A11yPrefs;
        applyPrefs(parsed);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPrefs(parsed);
      }
    } catch {}
  }, []);

  function update(next: Partial<A11yPrefs>) {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      applyPrefs(merged);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
      return merged;
    });
  }

  function reset() {
    setPrefs(DEFAULT_PREFS);
    applyPrefs(DEFAULT_PREFS);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  const isDefault = prefs.fontSize === 0 && !prefs.contrast && !prefs.linksUnderline;

  return (
    <>
      {/* Floating trigger button — bottom-left (CookieBanner is bottom-right) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full bg-obsidian text-white shadow-lg hover:bg-obsidian/80 active:scale-95 transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Accessibility className="w-5 h-5" />
        {!isDefault && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold border-2 border-white" />
        )}
      </button>

      {/* Overlay (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="אפשרויות נגישות"
            dir="rtl"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-20 left-5 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-champagne/70"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-champagne/50">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-gold" />
                <span className="font-semibold text-obsidian text-sm">כלי נגישות</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-stone/50 hover:text-obsidian hover:bg-champagne/40 transition-colors"
                aria-label="סגור תפריט נגישות"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 py-4 space-y-4">

              {/* Font size */}
              <div>
                <p className="text-xs font-semibold text-stone/60 uppercase tracking-wider mb-2">גודל טקסט</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update({ fontSize: Math.max(-1, prefs.fontSize - 1) })}
                    disabled={prefs.fontSize <= -1}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-champagne text-sm text-obsidian hover:bg-champagne/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="הקטן טקסט"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                    הקטן
                  </button>
                  <span className="text-xs text-stone/50 w-10 text-center font-mono">
                    {prefs.fontSize === 0 ? "רגיל" : `${100 + prefs.fontSize * 10}%`}
                  </span>
                  <button
                    onClick={() => update({ fontSize: Math.min(2, prefs.fontSize + 1) })}
                    disabled={prefs.fontSize >= 2}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-champagne text-sm text-obsidian hover:bg-champagne/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="הגדל טקסט"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    הגדל
                  </button>
                </div>
              </div>

              {/* Toggle options */}
              <div className="space-y-2">
                <ToggleRow
                  label="ניגודיות גבוהה"
                  active={prefs.contrast}
                  onToggle={() => update({ contrast: !prefs.contrast })}
                />
                <ToggleRow
                  label="הדגש קישורים"
                  active={prefs.linksUnderline}
                  onToggle={() => update({ linksUnderline: !prefs.linksUnderline })}
                />
              </div>

              {/* Reset */}
              {!isDefault && (
                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-stone/60 hover:text-obsidian hover:bg-champagne/30 transition-colors border border-dashed border-champagne"
                >
                  <RotateCcw className="w-3 h-3" />
                  איפוס הגדרות
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-champagne/40 bg-champagne/10 rounded-b-2xl">
              <Link
                href="/accessibility"
                onClick={() => setOpen(false)}
                className="text-xs text-stone/50 hover:text-gold transition-colors"
              >
                הצהרת נגישות ←
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface ToggleRowProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, active, onToggle }: ToggleRowProps) {
  return (
    <button
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all",
        active
          ? "bg-obsidian/5 border-obsidian/20 text-obsidian font-medium"
          : "border-champagne/60 text-stone/70 hover:bg-champagne/20"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "w-9 h-5 rounded-full relative transition-colors duration-200",
          active ? "bg-obsidian" : "bg-stone/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
            active ? "right-0.5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
