// ISR: revalidate vendor pages every hour — fresh data without SSR overhead
export const revalidate = 3600;

import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia, vendorPricing, reviews } from "@/lib/db/schema";
import { PLAN_LIMITS } from "@/lib/stripe/config";
import type { Vendor, VendorMedia, VendorPricing, Review } from "@/lib/db/schema";
import { VendorHero } from "@/components/vendor/VendorHero";
import { VendorNavbar } from "@/components/vendor/VendorNavbar";
import { VendorInfo } from "@/components/vendor/VendorInfo";
import { MasonryGallery } from "@/components/vendor/MasonryGallery";
import { PricingSection } from "@/components/vendor/PricingSection";
import { HowItWorks } from "@/components/vendor/HowItWorks";
import { ReviewsSection } from "@/components/vendor/ReviewsSection";
import { ReviewSubmitForm } from "@/components/vendor/ReviewSubmitForm";
import { LeadCaptureForm } from "@/components/vendor/LeadCaptureForm";
import { WhatsAppButton } from "@/components/vendor/WhatsAppButton";
import { ViewCountTracker } from "@/components/vendor/ViewCountTracker";
import { Footer } from "@/components/layout/Footer";

// ─── Mock data (for /vendors/demo and DB-fallback during development) ──────────

const MOCK_VENDOR: Vendor = {
  id: "mock-001",
  userId: "mock-user-001",
  slug: "demo",
  businessName: "סטודיו ניב כהן",
  category: "photography",
  description:
    "אני מאמין שכל חתונה היא עולם ומלואו — רגעים אמיתיים, רגשות עמוקים, סיפור שאסור לאבד.\n\nמעל 12 שנות ניסיון בצילום חתונות בישראל ובחו\"ל לימדו אותי שהאור הנכון, הרגע הנכון והחיוך האמיתי שווים יותר מכל סטייג\'ינג מושלם.\n\nאני עובד עם ציוד Sony A-series מקצועי ועדשות פריים פסייט, ומספק גלריה מעובדת ב-RAW תוך 4 שבועות.",
  shortDescription: "צלם חתונות פרמיום — מגשים רגעים לצמיתות",
  city: "תל אביב",
  region: "מרכז",
  phone: "050-1234567",
  email: "niv@studio-example.co.il",
  website: "https://example.co.il",
  whatsapp: null,
  instagram: "niv.studio",
  tiktok: null,
  youtube: null,
  facebook: null,
  coverImage:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&fit=crop",
  logoImage: null,
  plan: "premium",
  status: "active",
  role: "vendor",
  featuredUntil: null,
  viewCount: 1842,
  leadCount: 73,
  rating: 4.9,
  reviewCount: 38,
  seoTitle: "סטודיו ניב כהן — צלם חתונות תל אביב והמרכז | WeddingPro",
  seoDescription:
    "צלם חתונות מקצועי עם 12 שנות ניסיון בתל אביב. תמונות שמספרות סיפור, עיבוד RAW, גלריה תוך 4 שבועות.",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  subscriptionCurrentPeriodEnd: null,
  trialEndsAt: null,
  createdAt: new Date("2022-03-15"),
  updatedAt: new Date("2024-11-01"),
};

const MOCK_IMAGES: VendorMedia[] = [
  {
    id: "m1", vendorId: "mock-001", sortOrder: 0, type: "image",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&fit=crop",
    publicId: null,
    altText: "טבעות נישואין מוזהבות",
    createdAt: new Date(),
  },
  {
    id: "m2", vendorId: "mock-001", sortOrder: 1, type: "image",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80&fit=crop",
    publicId: null,
    altText: "הזוג תחת אור הזהב",
    createdAt: new Date(),
  },
  {
    id: "m3", vendorId: "mock-001", sortOrder: 2, type: "image",
    url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80&fit=crop",
    publicId: null,
    altText: "פרחי כלה לבנים",
    createdAt: new Date(),
  },
  {
    id: "m4", vendorId: "mock-001", sortOrder: 3, type: "image",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fit=crop",
    publicId: null,
    altText: "אולם קבלת פנים",
    createdAt: new Date(),
  },
  {
    id: "m5", vendorId: "mock-001", sortOrder: 4, type: "image",
    url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80&fit=crop",
    publicId: null,
    altText: "הכלה בשמלה",
    createdAt: new Date(),
  },
  {
    id: "m6", vendorId: "mock-001", sortOrder: 5, type: "image",
    url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80&fit=crop",
    publicId: null,
    altText: "טקס תחת החופה",
    createdAt: new Date(),
  },
  {
    id: "m7", vendorId: "mock-001", sortOrder: 6, type: "image",
    url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80&fit=crop",
    publicId: null,
    altText: "ריקוד ראשון",
    createdAt: new Date(),
  },
  {
    id: "m8", vendorId: "mock-001", sortOrder: 7, type: "image",
    url: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80&fit=crop",
    publicId: null,
    altText: "פרטים של שולחן",
    createdAt: new Date(),
  },
];

const MOCK_PRICING: VendorPricing[] = [
  {
    id: "p1", vendorId: "mock-001", sortOrder: 0,
    name: "חבילת כסף",
    description: "מתאים לחתונות אינטימיות עד 80 איש",
    price: 4900,
    currency: "ILS",
    isPopular: false,
    features: ["8 שעות צילום", "500+ תמונות מעובדות", "גלריה דיגיטלית פרטית", "אלבום מודפס A4"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p2", vendorId: "mock-001", sortOrder: 1,
    name: "חבילת זהב",
    description: "הבחירה הפופולרית ביותר",
    price: 7900,
    currency: "ILS",
    isPopular: true,
    features: [
      "10 שעות צילום",
      "800+ תמונות מעובדות",
      "צלם שני",
      "גלריה דיגיטלית + USB",
      "אלבום מעוצב A3",
      "עריכת RAW מלאה",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "p3", vendorId: "mock-001", sortOrder: 2,
    name: "חבילת פלטינה",
    description: "חוויה מלאה ללא פשרות",
    price: 12900,
    currency: "ILS",
    isPopular: false,
    features: [
      "12 שעות צילום",
      "1000+ תמונות מעובדות",
      "2 צלמים",
      "וידאו Cinematic",
      "Drone",
      "אלבום פרמיום A2",
      "USB + USB גיבוי",
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1", vendorId: "mock-001", rating: 5,
    authorName: "נועה ויואב כהן",
    authorEmail: "noa@example.com",
    title: "חתונת החלומות — תמונות שמביאות דמעות",
    body: "ניב פשוט גאון. הוא תפס כל רגע קטן — מאיש העסקים הסבא שבכה לשמחה ועד הריקוד של הילדים. קיבלנו 920 תמונות מדהימות תוך 3 שבועות. ממליצים בחום!",
    isVerified: true, isPublished: true,
    createdAt: new Date("2024-08-20"),
  },
  {
    id: "r2", vendorId: "mock-001", rating: 5,
    authorName: "מיכל וגל לוי",
    authorEmail: "michal@example.com",
    title: "מקצועיות ואנושיות בשילוב מושלם",
    body: "ניב הגיע שעה לפני כולם, הסתובב בשקט, לא הפריע לאף אחד ובסוף יצרו תמונות שאנחנו לא מאמינים שהן שלנו. נלך איתו שוב בעשור הבא.",
    isVerified: true, isPublished: true,
    createdAt: new Date("2024-09-14"),
  },
  {
    id: "r3", vendorId: "mock-001", rating: 5,
    authorName: "שיר ואורי ברק",
    authorEmail: "shir@example.com",
    title: "הצלם הטוב ביותר שהיינו איתו",
    body: "אחרי שראינו עבודות של עשרות צלמים, בחרנו בניב ולא התחרטנו לרגע. הוא מבין אור, מבין רגע, ומבין מה חשוב לבני הזוג.",
    isVerified: true, isPublished: true,
    createdAt: new Date("2024-10-02"),
  },
  {
    id: "r4", vendorId: "mock-001", rating: 5,
    authorName: "ליאת ודניאל אלון",
    authorEmail: "liat@example.com",
    title: "תמונות כמו מגזין חתונות",
    body: "כל מי שראה את התמונות שאל מי הצלם. העיצוב, הצבעים, ההבעות — הכל ברמה בין-לאומית. שווה כל שקל.",
    isVerified: true, isPublished: true,
    createdAt: new Date("2024-11-18"),
  },
];

// ─── Data fetching ─────────────────────────────────────────────────────────────

interface VendorData {
  vendor: Vendor;
  media: VendorMedia[];
  pricing: VendorPricing[];
  reviews: Review[];
}

const MOCK_FALLBACK = () => ({
  vendor: MOCK_VENDOR,
  media: MOCK_IMAGES,
  pricing: MOCK_PRICING,
  reviews: MOCK_REVIEWS,
});

async function getVendorData(slug: string): Promise<VendorData | null> {
  try {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.slug, slug), eq(vendors.status, "active")))
      .limit(1);

    if (!vendor) {
      return slug === "demo" ? MOCK_FALLBACK() : null;
    }

    const [media, pricing, vendorReviews] = await Promise.all([
      db
        .select()
        .from(vendorMedia)
        .where(eq(vendorMedia.vendorId, vendor.id))
        .orderBy(vendorMedia.sortOrder),
      vendor.plan === "premium"
        ? db
            .select()
            .from(vendorPricing)
            .where(eq(vendorPricing.vendorId, vendor.id))
            .orderBy(vendorPricing.sortOrder)
        : Promise.resolve([]),
      db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.vendorId, vendor.id),
            eq(reviews.isVerified, true),
            eq(reviews.isPublished, true)
          )
        )
        .orderBy(reviews.createdAt),
    ]);

    return { vendor, media, pricing, reviews: vendorReviews };
  } catch (err) {
    console.error(`[vendor-page] Error for slug="${slug}":`, err);
    return slug === "demo" ? MOCK_FALLBACK() : null;
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVendorData(slug);
  if (!data) return { title: "ספק לא נמצא" };

  const { vendor } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const ogImage =
    vendor.coverImage && cloudName && !vendor.coverImage.startsWith("http")
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/${vendor.coverImage}`
      : vendor.coverImage?.startsWith("http")
      ? vendor.coverImage
      : undefined;

  return {
    title: vendor.seoTitle ?? `${vendor.businessName} | WeddingPro`,
    description:
      vendor.seoDescription ??
      vendor.shortDescription ??
      `${vendor.businessName} — ${vendor.city}`,
    openGraph: {
      title: vendor.businessName,
      description: vendor.shortDescription ?? undefined,
      url: `${appUrl}/vendors/${slug}`,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: vendor.businessName,
      description: vendor.shortDescription ?? undefined,
      images: ogImage ? [ogImage] : [],
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function VendorPage({ params }: Props) {
  const { slug } = await params;
  const data = await getVendorData(slug);
  if (!data) notFound();

  const { vendor, media, pricing, reviews: vendorReviews } = data;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Build hero image URL — handle both Cloudinary IDs and direct URLs
  const heroImageUrl = vendor.coverImage
    ? vendor.coverImage.startsWith("http")
      ? vendor.coverImage
      : cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920/${vendor.coverImage}`
      : null
    : null;

  const planLimits = PLAN_LIMITS[vendor.plan];

  const heroVideo = planLimits.hasVideo
    ? (media.find((m) => m.type === "video") ?? null)
    : null;

  const galleryImages = media
    .filter((m) => m.type === "image")
    .slice(0, planLimits.maxImages === Infinity ? undefined : planLimits.maxImages);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: vendor.businessName,
    description: vendor.description ?? vendor.shortDescription ?? undefined,
    url: `${appUrl}/vendors/${slug}`,
    telephone: vendor.phone ?? undefined,
    email: vendor.email,
    image: heroImageUrl ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: vendor.city,
      addressRegion: vendor.region ?? undefined,
      addressCountry: "IL",
    },
    sameAs: [
      vendor.instagram && `https://instagram.com/${vendor.instagram.replace("@", "")}`,
      vendor.tiktok && `https://tiktok.com/@${vendor.tiktok.replace("@", "")}`,
      vendor.youtube,
      vendor.facebook,
      vendor.website,
    ].filter(Boolean),
    ...(vendor.rating != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: vendor.rating,
        reviewCount: vendor.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  // Build scroll-spy nav sections dynamically
  const navSections = [
    { id: "about", label: "אודות" },
    ...(galleryImages.length > 0 ? [{ id: "gallery", label: "גלריה" }] : []),
    ...(pricing.length > 0 ? [{ id: "pricing", label: "מחירים" }] : []),
    { id: "how-it-works", label: "תהליך" },
    ...(vendorReviews.length > 0 ? [{ id: "reviews", label: "ביקורות" }] : []),
    { id: "contact-form", label: "צור קשר" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-ivory">
        {/* ── Full-bleed Hero ── */}
        <VendorHero vendor={vendor} heroVideo={heroVideo} heroImageUrl={heroImageUrl} />

        {/* ── Sticky Navbar ── */}
        <VendorNavbar businessName={vendor.businessName} sections={navSections} />

        {/* ── Main content + Sidebar ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">

            {/* ── Main column (2/3) ── */}
            <div className="lg:col-span-2 space-y-10">
              <div id="about">
                <VendorInfo vendor={vendor} />
              </div>

              {galleryImages.length > 0 && (
                <div id="gallery">
                  <MasonryGallery images={galleryImages} cloudName={cloudName} />
                </div>
              )}

              {pricing.length > 0 && (
                <div id="pricing">
                  <PricingSection packages={pricing} />
                </div>
              )}

              <div id="how-it-works">
                <HowItWorks />
              </div>

              <div id="reviews">
                {vendorReviews.length > 0 && (
                  <ReviewsSection reviews={vendorReviews} />
                )}
                <ReviewSubmitForm
                  vendorId={vendor.id}
                  vendorName={vendor.businessName}
                />
              </div>
            </div>

            {/* ── Sidebar (1/3) — sticky lead form ── */}
            <aside className="lg:col-span-1">
              <div
                id="contact-form"
                className="lg:sticky lg:top-24 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_32px_rgb(26_22_20/0.1)] border border-white/60 ring-1 ring-champagne/30 p-6"
              >
                <LeadCaptureForm vendorId={vendor.id} vendorName={vendor.businessName} />
              </div>
            </aside>
          </div>
        </div>

        {/* ── Footer ── */}
        <Footer />

        {/* ── Floating WhatsApp (standard/premium only) ── */}
        {planLimits.hasWhatsApp && (
          <WhatsAppButton phone={vendor.whatsapp ?? vendor.phone} />
        )}

        {/* ── View count tracker (client-side, fire-and-forget) ── */}
        {vendor.id !== "mock-001" && <ViewCountTracker vendorId={vendor.id} />}
      </div>
    </>
  );
}
