import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  Video,
  Building2,
  UtensilsCrossed,
  Flower2,
  Music,
  Sparkles,
  Calendar,
  Headphones,
  Cake,
  Shirt,
  MessageCircle,
  Star,
  Users,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import type { Vendor } from "@/lib/db/schema";
import { VendorCard } from "@/components/vendor/VendorCard";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/shared/CookieBanner";

// ─── Category grid data ────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "photography", label: "צילום חתונות", icon: Camera, color: "bg-blush/20 text-dusty-rose" },
  { slug: "videography", label: "וידאו קינמטי", icon: Video, color: "bg-stone/10 text-stone" },
  { slug: "venue", label: "אולמות ומקומות", icon: Building2, color: "bg-gold/10 text-gold" },
  { slug: "catering", label: "קייטרינג", icon: UtensilsCrossed, color: "bg-amber-50 text-amber-600" },
  { slug: "flowers", label: "פרחים ועיצוב", icon: Flower2, color: "bg-pink-50 text-pink-500" },
  { slug: "music", label: "מוזיקה חיה", icon: Music, color: "bg-purple-50 text-purple-500" },
  { slug: "makeup", label: "איפור ושיער", icon: Sparkles, color: "bg-rose-50 text-rose-500" },
  { slug: "planning", label: "תכנון אירועים", icon: Calendar, color: "bg-teal-50 text-teal-600" },
  { slug: "dj", label: "DJ", icon: Headphones, color: "bg-indigo-50 text-indigo-500" },
  { slug: "cake", label: "עוגות חתונה", icon: Cake, color: "bg-orange-50 text-orange-500" },
  { slug: "wedding-dress-designers", label: "מעצבי שמלות כלה", icon: Shirt, color: "bg-fuchsia-50 text-fuchsia-500" },
];

const STATS = [
  { value: "500+", label: "ספקים מובחרים" },
  { value: "10,000+", label: "זוגות מאושרים" },
  { value: "15", label: "קטגוריות" },
  { value: "4.9★", label: "דירוג ממוצע" },
];

// ─── Mock featured vendors (fallback when DB is unavailable) ──────────────────

const FEATURED_MOCK: Vendor[] = [
  {
    id: "f1",
    userId: "u1",
    slug: "demo",
    businessName: "סטודיו ניב כהן",
    category: "photography",
    shortDescription: "צלם חתונות פרמיום — מגשים רגעים לצמיתות",
    description: null,
    city: "תל אביב",
    region: "מרכז",
    phone: "050-1234567",
    email: "niv@example.co.il",
    website: null,
    instagram: "niv.studio",
    facebook: null,
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&fit=crop",
    logoImage: null,
    plan: "premium",
    status: "active",
    role: "vendor",
    featuredUntil: null,
    viewCount: 1842,
    leadCount: 73,
    rating: 4.9,
    reviewCount: 38,
    seoTitle: null,
    seoDescription: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    createdAt: new Date("2022-03-15"),
    updatedAt: new Date("2024-11-01"),
  },
  {
    id: "f2",
    userId: "u2",
    slug: "demo",
    businessName: "אולם גן עדן",
    category: "venue",
    shortDescription: "אולם אירועים יוקרתי עם גן ומרפסת פנורמית בהרצליה פיתוח",
    description: null,
    city: "הרצליה",
    region: "מרכז",
    phone: "09-9876543",
    email: "info@ganeden.co.il",
    website: null,
    instagram: null,
    facebook: null,
    coverImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fit=crop",
    logoImage: null,
    plan: "premium",
    status: "active",
    role: "vendor",
    featuredUntil: null,
    viewCount: 3210,
    leadCount: 210,
    rating: 4.8,
    reviewCount: 62,
    seoTitle: null,
    seoDescription: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    createdAt: new Date("2021-06-01"),
    updatedAt: new Date("2024-10-15"),
  },
  {
    id: "f3",
    userId: "u3",
    slug: "demo",
    businessName: "מעדנייה של גיא",
    category: "catering",
    shortDescription: "קייטרינג פרמיום כשר למהדרין — תפריטים מותאמים אישית לכל אירוע",
    description: null,
    city: "ירושלים",
    region: "ירושלים",
    phone: "02-5556677",
    email: "guy@catering.co.il",
    website: null,
    instagram: null,
    facebook: null,
    coverImage: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80&fit=crop",
    logoImage: null,
    plan: "premium",
    status: "active",
    role: "vendor",
    featuredUntil: null,
    viewCount: 980,
    leadCount: 45,
    rating: 4.7,
    reviewCount: 29,
    seoTitle: null,
    seoDescription: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    createdAt: new Date("2023-01-10"),
    updatedAt: new Date("2024-09-20"),
  },
];

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getFeaturedVendors(): Promise<Vendor[]> {
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.status, "active"), eq(vendors.plan, "premium")))
      .orderBy(desc(vendors.viewCount))
      .limit(6);
    return rows.length > 0 ? rows : FEATURED_MOCK;
  } catch {
    return FEATURED_MOCK;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const featuredVendors = await getFeaturedVendors();

  return (
    <div className="min-h-screen bg-ivory" dir="rtl">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92svh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1920&q=85&fit=crop"
            alt="חתונה מושלמת"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-obsidian/75 via-obsidian/50 to-obsidian/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-2xl">
            <p className="font-script text-gold text-2xl sm:text-3xl mb-3 drop-shadow">
              היום הגדול שלכם מתחיל כאן
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-tight mb-6 drop-shadow-lg">
              מצאו את ספקי
              <br />
              <span className="text-gold">החתונה המושלמים</span>
            </h1>
            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg">
              מעל 500 ספקים מובחרים בישראל — צלמים, אולמות, קייטרינג, פרחים ועוד.
              כל מה שצריך למסע אל חתונת החלומות.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendors"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-obsidian font-semibold text-sm hover:bg-gold/90 transition-colors shadow-lg"
              >
                חפשו ספקים
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-medium text-sm hover:bg-white/25 transition-colors"
              >
                הצטרפו כספק
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/50">
          <span className="text-xs tracking-widest uppercase">גלול למטה</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section className="bg-obsidian text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-x-reverse sm:divide-white/10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center sm:px-8">
                <p className="font-display text-3xl sm:text-4xl text-gold">{value}</p>
                <p className="text-white/50 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-script text-gold text-xl mb-1">כל מה שצריך</p>
            <h2 className="font-display text-4xl sm:text-5xl text-obsidian">
              קטגוריות פופולריות
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.map(({ slug, label, icon: Icon, color }) => (
              <Link
                key={slug}
                href={`/vendors?category=${slug}`}
                className="group flex flex-col items-center gap-3 p-4 sm:p-5 bg-cream-white rounded-2xl card-shadow hover:shadow-md transition-shadow text-center"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-obsidian leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED VENDORS ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-cream-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-script text-gold text-xl mb-1">הטובים ביותר</p>
              <h2 className="font-display text-4xl sm:text-5xl text-obsidian">
                ספקים מובחרים
              </h2>
            </div>
            <Link
              href="/vendors"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-dusty-rose hover:text-dusty-rose/80 transition-colors"
            >
              כל הספקים
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredVendors.slice(0, 6).map((vendor) => (
              <VendorCard
                key={vendor.id}
                id={vendor.id}
                slug={vendor.slug}
                businessName={vendor.businessName}
                shortDescription={vendor.shortDescription}
                city={vendor.city}
                category={vendor.category}
                coverImage={vendor.coverImage}
                plan={vendor.plan}
                rating={vendor.rating}
                reviewCount={vendor.reviewCount}
                featured
              />
            ))}
          </div>

          <div className="text-center mt-10 sm:hidden">
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-champagne text-sm font-medium text-stone hover:bg-champagne/40 transition-colors"
            >
              כל הספקים
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (for couples) ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-script text-gold text-xl mb-1">בשלושה צעדים פשוטים</p>
            <h2 className="font-display text-4xl sm:text-5xl text-obsidian">
              איך זה עובד?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: MessageCircle,
                title: "חפשו ומצאו",
                description: "עיינו בין מאות ספקים מאומתים לפי קטגוריה, עיר ומחיר — כולל תמונות ורשמי לקוחות.",
                color: "bg-blush/20 text-dusty-rose",
              },
              {
                step: "02",
                icon: Star,
                title: "השוו ובחרו",
                description: "קראו ביקורות אמיתיות, צפו בגלריות עבודות וקבלו הצעות מחיר ישירות דרך הפלטפורמה.",
                color: "bg-gold/15 text-gold",
              },
              {
                step: "03",
                icon: Users,
                title: "צרו קשר",
                description: "שלחו פנייה ישירות לספק — באמצעות הטופס, WhatsApp או טלפון. מענה תוך 24 שעות.",
                color: "bg-teal-50 text-teal-600",
              },
            ].map(({ step, icon: Icon, title, description, color }) => (
              <div
                key={step}
                className="bg-cream-white rounded-2xl p-7 card-shadow text-center flex flex-col items-center gap-4"
              >
                <span className="text-xs font-medium text-stone/40 tracking-widest uppercase">
                  שלב {step}
                </span>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-2xl text-obsidian">{title}</h3>
                <p className="text-stone text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-obsidian text-white overflow-hidden relative">
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-dusty-rose blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-script text-gold text-2xl sm:text-3xl mb-3">
            הצטרפו אלינו
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            אתם ספקי חתונות?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            הגדילו את הנוכחות הדיגיטלית שלכם, קבלו לידים איכותיים וצמחו עם פלטפורמה שבנויה
            במיוחד לענף החתונות בישראל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold text-obsidian font-semibold text-sm hover:bg-gold/90 transition-colors shadow-lg"
            >
              הצטרפו בחינם
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-colors"
            >
              צפו במחירים
            </Link>
          </div>

          {/* Plan prices */}
          <p className="mt-8 text-white/30 text-xs">
            חינם לתמיד · Standard ₪149/חודש · Premium ₪349/חודש
          </p>
        </div>
      </section>

      <Footer />
      <CookieBanner />
    </div>
  );
}
