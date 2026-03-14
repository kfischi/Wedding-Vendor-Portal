import Link from "next/link";
import { Heart, Instagram, Facebook } from "lucide-react";

const YEAR = new Date().getFullYear();

const COLS = [
  {
    title: "ניווט",
    links: [
      { href: "/vendors",  label: "דירקטורי ספקים" },
      { href: "/blog",     label: "בלוג" },
      { href: "/about",    label: "אודות" },
      { href: "/pricing",  label: "מחירים" },
    ],
  },
  {
    title: "לספקים",
    links: [
      { href: "/join",       label: "הצטרפו כספק" },
      { href: "/auth/login", label: "התחברות" },
      { href: "/contact",    label: "תמיכה" },
    ],
  },
  {
    title: "משפטי",
    links: [
      { href: "/privacy",       label: "מדיניות פרטיות" },
      { href: "/terms",         label: "תנאי שימוש" },
      { href: "/accessibility", label: "הצהרת נגישות" },
      { href: "/cookies",       label: "מדיניות עוגיות" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-obsidian text-white/70 mt-0" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="space-y-4 lg:col-span-1">
            <div>
              <p className="font-script text-gold text-2xl leading-none mb-1">WeddingPro</p>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com/weddingpro.il"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/weddingpro.il"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com/@weddingpro.il"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold"
              >
                TT
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="bg-white/5 rounded-2xl p-5 mb-10 border border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white text-sm font-semibold mb-0.5">טיפים לחתונה במייל</p>
              <p className="text-white/40 text-xs">הישארו מעודכנים עם המדריכים הטובים ביותר</p>
            </div>
            <form className="flex gap-2 w-full sm:w-auto" action="/contact" method="get">
              <input
                type="email"
                placeholder="האימייל שלכם"
                dir="ltr"
                className="flex-1 sm:w-52 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors shrink-0"
              >
                הרשמה
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {YEAR} WeddingPro. כל הזכויות שמורות.
          </p>
          <p className="text-xs text-white/25 flex items-center gap-1.5">
            נבנה עם <Heart className="w-3 h-3 text-dusty-rose fill-dusty-rose" /> בישראל 🇮🇱
          </p>
        </div>
      </div>
    </footer>
  );
}
