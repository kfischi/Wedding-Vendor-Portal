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
    <footer
      dir="rtl"
      style={{
        background: "rgb(9 9 11)",
        borderTop: "1px solid rgb(39 39 42)",
        color: "rgb(113 113 122)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgb(24 24 27)", border: "1px solid rgb(39 39 42)" }}
              >
                <span className="font-script leading-none" style={{ color: "rgb(201 168 84)", fontSize: "1rem" }}>W</span>
              </div>
              <span className="font-semibold text-[15px]" style={{ color: "rgb(250 250 250)" }}>
                WeddingPro
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "rgb(82 82 91)" }}>
              הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {[
                { href: "https://instagram.com/weddingpro.il", label: "Instagram", icon: <Instagram className="h-3.5 w-3.5" /> },
                { href: "https://facebook.com/weddingpro.il",  label: "Facebook",  icon: <Facebook  className="h-3.5 w-3.5" /> },
                { href: "https://tiktok.com/@weddingpro.il",   label: "TikTok",    icon: <span className="text-[10px] font-bold">TT</span> },
              ].map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: "rgb(24 24 27)", border: "1px solid rgb(39 39 42)", color: "rgb(113 113 122)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(250 250 250)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(113 113 122)"}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "rgb(82 82 91)" }}
              >
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm transition-colors"
                      style={{ color: "rgb(82 82 91)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(212 212 216)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(82 82 91)"}
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
        <div
          className="rounded-xl p-5 mb-10"
          style={{
            background: "rgb(15 15 18)",
            border: "1px solid rgb(39 39 42)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "rgb(212 212 216)" }}>
                טיפים לחתונה במייל
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgb(82 82 91)" }}>
                המדריכים הטובים ביותר ישירות לתיבה שלכם
              </p>
            </div>
            <form className="flex gap-2 w-full sm:w-auto" action="/contact" method="get">
              <input
                type="email"
                placeholder="האימייל שלכם"
                dir="ltr"
                className="flex-1 sm:w-52 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: "rgb(24 24 27)",
                  border: "1px solid rgb(39 39 42)",
                  color: "rgb(212 212 216)",
                }}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 transition-opacity"
                style={{ background: "rgb(250 250 250)", color: "rgb(9 9 11)" }}
              >
                הרשמה
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgb(39 39 42)" }}
        >
          <p className="text-xs" style={{ color: "rgb(63 63 70)" }}>
            © {YEAR} WeddingPro. כל הזכויות שמורות.
          </p>
          <p className="text-xs" style={{ color: "rgb(63 63 70)" }}>
            נבנה עם ❤️ בישראל 🇮🇱
          </p>
        </div>
      </div>
    </footer>
  );
}
