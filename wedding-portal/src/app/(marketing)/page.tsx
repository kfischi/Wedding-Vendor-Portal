export const dynamic = "force-dynamic";

import Link from "next/link";
import {
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
import { HeroSlideshow } from "@/components/marketing/HeroSlideshow";
import { AnimatedStats } from "@/components/marketing/AnimatedStats";
import { AnimatedCategories } from "@/components/marketing/AnimatedCategories";

// ─── Stats data ────────────────────────────────────────────────────────────────

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wedding-vendor-portal.netlify.app";

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WeddingPro",
    url: appUrl,
    description: "הפלטפורמה המובילה לספקי חתונות בישראל — מצאו צלמים, אולמות, קייטרינג ועוד",
    inLanguage: "he",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${appUrl}/vendors?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WeddingPro",
    url: appUrl,
    logo: `${appUrl}/favicon.ico`,
    description: "פלטפורמת ספקי חתונות בישראל",
    areaServed: { "@type": "Country", name: "Israel" },
    sameAs: [],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
    <div className="min-h-screen bg-ivory" dir="rtl">

      {/* ── HERO (rotating images + animated text) ─────────────────────────────── */}
      <HeroSlideshow />

      {/* ── STATS (count-up on scroll) ─────────────────────────────────────────── */}
      <AnimatedStats stats={STATS} />

      {/* ── CATEGORIES (stagger on scroll + hover lift) ────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-script text-gold text-xl mb-1">כל מה שצריך</p>
            <h2 className="font-display text-4xl sm:text-5xl text-obsidian">
              קטגוריות פופולריות
            </h2>
          </div>

          <AnimatedCategories />
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
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-7 shadow-[0_4px_24px_rgb(26_22_20/0.06)] border border-white/80 hover:shadow-[0_8px_32px_rgb(26_22_20/0.1)] hover:-translate-y-1 transition-all duration-300 text-center flex flex-col items-center gap-4"
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
            מקצוענים בתחום החתונות?
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            הגדילו את הנוכחות הדיגיטלית שלכם, קבלו לידים איכותיים וצמחו עם פלטפורמה שבנויה
            במיוחד לענף החתונות בישראל.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/join/free"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold text-obsidian font-semibold text-sm hover:bg-gold/90 transition-colors shadow-lg shadow-gold/25"
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
    </>
  );
}
