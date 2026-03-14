"use client";

import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-6">
        <span className="text-3xl">😔</span>
      </div>

      <p className="font-script text-2xl text-gold mb-2">מצטערים...</p>
      <h1 className="font-display text-4xl text-obsidian mb-4">משהו השתבש</h1>
      <p className="text-stone/60 text-lg max-w-md mb-10 leading-relaxed">
        אירעה שגיאה לא צפויה. הצוות שלנו קיבל התראה ועובד על פתרון.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-white font-semibold hover:bg-gold/90 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          נסו שוב
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-champagne text-obsidian font-semibold hover:border-gold/40 hover:bg-champagne/30 transition-all"
        >
          <Home className="h-4 w-4" />
          חזרה לדף הבית
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-stone/30 font-mono">שגיאה: {error.digest}</p>
      )}
    </div>
  );
}
