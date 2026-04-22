import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

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
    <footer dir="rtl" className="bg-obsidian border-t border-ivory/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">

          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group"
              aria-label="WeddingPro — ראשי"
            >
              <div className="w-8 h-8 bg-ivory/5 border border-ivory/15 flex items-center justify-center shrink-0 group-hover:border-gold/40 transition-colors">
                <span className="text-script-accent text-gold leading-none text-lg">W</span>
              </div>
              <span className="text-micro-label text-ivory/90 group-hover:text-ivory transition-colors tracking-widest">
                WeddingPro
              </span>
            </Link>
            <p className="text-body-lux text-sm text-ivory/40 leading-relaxed max-w-[200px]">
              הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.
            </p>
            <div className="flex items-center gap-2">
              {[
                {
                  href: "https://instagram.com/weddingpro.il",
                  label: "Instagram",
                  icon: <Instagram className="h-3.5 w-3.5" />,
                },
                {
                  href: "https://facebook.com/weddingpro.il",
                  label: "Facebook",
                  icon: <Facebook className="h-3.5 w-3.5" />,
                },
                {
                  href: "https://tiktok.com/@weddingpro.il",
                  label: "TikTok",
                  icon: <span className="text-[10px] font-bold tracking-tight">TT</span>,
                },
              ].map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 bg-ivory/5 border border-ivory/10 flex items-center justify-center text-ivory/40 hover:text-gold hover:border-gold/30 transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-micro-label text-ivory/30 mb-5">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-body-lux text-sm text-ivory/50 hover:text-ivory/90 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter bar */}
        <div className="border border-ivory/10 p-6 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <p className="text-micro-label text-ivory/80">
                טיפים לחתונה במייל
              </p>
              <p className="text-body-lux text-sm text-ivory/35 mt-1">
                המדריכים הטובים ביותר ישירות לתיבה שלכם
              </p>
            </div>
            <form
              className="flex gap-2 w-full sm:w-auto"
              action="/contact"
              method="get"
            >
              <input
                type="email"
                placeholder="האימייל שלכם"
                dir="ltr"
                className="flex-1 sm:w-52 px-4 py-2.5 bg-ivory/5 border border-ivory/10 text-ivory/80 text-sm placeholder:text-ivory/25 focus:outline-none focus:border-gold/40 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gold text-obsidian text-micro-label shrink-0 hover:bg-gold/90 transition-colors"
              >
                הרשמה
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-micro-label text-ivory/25">
            © {YEAR} WeddingPro. כל הזכויות שמורות.
          </p>
          <p className="text-micro-label text-ivory/25">
            נבנה עם אהבה בישראל 🇮🇱
          </p>
        </div>
      </div>
    </footer>
  );
}
