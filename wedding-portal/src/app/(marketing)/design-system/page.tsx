import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System — WeddingPro (internal)",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  { token: "ivory",        hex: "#FBF8F3", bg: "bg-ivory",        dark: false },
  { token: "champagne",    hex: "#E8DCC4", bg: "bg-champagne",    dark: false },
  { token: "blush",        hex: "#EFD9CE", bg: "bg-blush",        dark: false },
  { token: "dusty-rose",   hex: "#C9A89D", bg: "bg-dusty-rose",   dark: false },
  { token: "gold",         hex: "#B8935A", bg: "bg-gold",         dark: false },
  { token: "gold-deep",    hex: "#8F6F3F", bg: "bg-gold-deep",    dark: true  },
  { token: "obsidian-soft",hex: "#2C2724", bg: "bg-obsidian-soft",dark: true  },
  { token: "obsidian",     hex: "#1A1614", bg: "bg-obsidian",     dark: true  },
] as const;

export default function DesignSystemPreview() {
  return (
    <div className="min-h-screen bg-ivory text-obsidian p-8 md:p-12 space-y-20">
      <header>
        <p className="text-micro-label text-gold">WeddingPro · Design System</p>
        <h1 className="text-editorial text-display-lg mt-4">
          Luxury tokens &amp;{" "}
          <em className="text-script-accent text-gold not-italic">typography</em>
        </h1>
        <p className="text-body-lux text-lg text-obsidian-soft mt-4 max-w-2xl">
          Internal preview page — noindex. Verifies design tokens, fluid type,
          and utility classes.
        </p>
      </header>

      {/* Color palette */}
      <section className="space-y-6">
        <h2 className="text-micro-label">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SWATCHES.map(({ token, hex, bg, dark }) => (
            <div key={token}>
              <div className={`aspect-square ${bg} border border-obsidian/10`} />
              <p className="text-micro-label mt-2">{token}</p>
              <p
                className="text-xs mt-0.5"
                style={{ color: dark ? "#1A1614" : "#6B5F5A" }}
              >
                {hex}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-10">
        <h2 className="text-micro-label">Typography Scale</h2>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">
            text-display-xl · clamp(3rem → 8rem)
          </p>
          <p className="text-editorial text-display-xl leading-none">
            הספקים שמייצרים{" "}
            <em className="text-script-accent text-gold not-italic">את הרגע</em>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">
            text-display-lg · clamp(2.5rem → 5rem)
          </p>
          <p className="text-editorial text-display-lg">
            Editorial Display Large
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">
            text-display-md · clamp(2rem → 3.5rem)
          </p>
          <p className="text-editorial text-display-md">
            כותרת משנה · Display Medium
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">text-body-lux</p>
          <p className="text-body-lux text-lg max-w-3xl">
            זה טקסט גוף של ה-Body Lux. משפטים ארוכים, נשימתיים, עם
            letter-spacing עדין שמבליט את התוכן בלי לצעוק. העברית צריכה
            להיראות נקייה גם בעוצמת 300.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">text-script-accent</p>
          <p className="text-script-accent text-5xl text-gold">
            accent script · רגע קסום
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-micro-label text-stone">text-micro-label</p>
          <p className="text-micro-label">the wedding collection</p>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-4">
        <h2 className="text-micro-label">Animations</h2>
        <div className="flex flex-wrap gap-8">
          <div
            className="w-32 h-32 bg-champagne flex items-center justify-center"
            style={{ animation: "var(--animate-fade-up)" }}
          >
            <span className="text-micro-label">fade-up</span>
          </div>
          <div
            className="w-32 h-32 bg-blush flex items-center justify-center"
            style={{ animation: "var(--animate-fade-in)" }}
          >
            <span className="text-micro-label">fade-in</span>
          </div>
          <div className="w-32 h-32 bg-champagne flex items-center justify-center skeleton">
            <span className="text-micro-label relative z-10">shimmer</span>
          </div>
        </div>
        <p className="text-body-lux text-sm text-stone">
          prefers-reduced-motion disables all animations.
        </p>
      </section>

      {/* Utility buttons */}
      <section className="space-y-4">
        <h2 className="text-micro-label">Component Utilities</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button className="btn-white">btn-white</button>
          <button className="btn-gold">btn-gold</button>
          <button className="btn-outline">btn-outline</button>
        </div>
        <div className="p-6 card-shadow bg-cream-white max-w-sm">
          <p className="text-body-lux text-sm">card-shadow</p>
        </div>
        <div className="p-6 glass max-w-sm">
          <p className="text-body-lux text-sm">glass</p>
        </div>
        <p className="gradient-gold text-display-md text-editorial">
          gradient-gold text
        </p>
      </section>
    </div>
  );
}
