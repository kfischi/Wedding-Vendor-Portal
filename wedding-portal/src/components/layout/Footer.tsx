import Link from "next/link";
import { Heart } from "lucide-react";

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="bg-obsidian text-white/70 mt-0" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

          {/* Column 1 — About */}
          <div className="space-y-4">
            <div>
              <p className="font-script text-gold text-2xl leading-none mb-1">WeddingPro</p>
              <h2 className="font-display text-lg text-white leading-tight">
                WeddingPro
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.
              מאות ספקים מובחרים, כלים דיגיטליים חכמים, חוויה חלקה.
            </p>
          </div>

          {/* Column 2 — Navigation */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              ניווט
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/vendors", label: "דירקטורי ספקים" },
                { href: "/pricing", label: "מחירים לספקים" },
                { href: "/auth/login", label: "הצטרף כספק" },
                { href: "/categories/photography", label: "צלמי חתונות" },
                { href: "/categories/venue", label: "אולמות אירועים" },
              ].map(({ href, label }) => (
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

          {/* Column 3 — Legal */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              מידע משפטי
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: "/privacy", label: "מדיניות פרטיות" },
                { href: "/terms", label: "תנאי שימוש" },
                { href: "/accessibility", label: "הצהרת נגישות" },
                { href: "/cookies", label: "מדיניות עוגיות" },
              ].map(({ href, label }) => (
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
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            © {YEAR} WeddingPro. כל הזכויות שמורות.
          </p>
          <p className="text-xs text-white/25 flex items-center gap-1.5">
            נבנה עם <Heart className="w-3 h-3 text-dusty-rose fill-dusty-rose" /> בישראל
          </p>
        </div>
      </div>
    </footer>
  );
}
