import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-4 text-center">
      {/* Wedding ring illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full border-[6px] border-champagne flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-[4px] border-gold/40 flex items-center justify-center">
            <span className="font-script text-4xl text-gold/60">404</span>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blush/40 border-2 border-dusty-rose/30" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 rounded-full bg-gold/20 border border-gold/30" />
      </div>

      <p className="font-script text-2xl text-gold mb-2">אופס...</p>
      <h1 className="font-display text-4xl lg:text-5xl text-obsidian mb-4 leading-tight">
        הדף לא נמצא
      </h1>
      <p className="text-stone/60 text-lg max-w-md mb-10 leading-relaxed">
        נראה שהקישור לא תקין, הדף הועבר, או שהוא פשוט לא קיים. אבל יש לנו המון דברים נהדרים אחרים!
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-obsidian text-white font-semibold hover:bg-obsidian/90 transition-all"
        >
          <Home className="h-4 w-4" />
          חזרה לדף הבית
        </Link>
        <Link
          href="/vendors"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-champagne text-obsidian font-semibold hover:border-gold/40 hover:bg-champagne/30 transition-all"
        >
          <Search className="h-4 w-4" />
          חפשו ספקים
        </Link>
      </div>
    </div>
  );
}
