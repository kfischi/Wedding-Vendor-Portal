import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import type { Vendor } from "@/lib/db/schema";
import { VendorCard } from "@/components/vendor/VendorCard";
import { Footer } from "@/components/layout/Footer";
import { ChevronLeft, Users } from "lucide-react";

const CATEGORIES: Record<string, { label: string; emoji: string; tip: string }> = {
  photography:              { label: "צלמי חתונות",         emoji: "📷", tip: "בדקו פורטפוליו שלם — לא רק תמונות נבחרות. חשוב לראות אלבום חתונה שלם." },
  videography:              { label: "צלמי וידאו",           emoji: "🎬", tip: "בקשו לראות סרטון Highlight מלא — 3–5 דקות שמספרים את סיפור החתונה." },
  venue:                    { label: "אולמות אירועים",        emoji: "🏛️", tip: "הגיעו לסיור בשעות הצהריים וגם בערב — האולם נראה שונה לגמרי בתאורת ערב." },
  catering:                 { label: "קייטרינג",              emoji: "🍽️", tip: "בקשו טעימה לפני שחותמים. תפריט טוב = אורחים מרוצים." },
  flowers:                  { label: "עיצוב פרחים",          emoji: "💐", tip: "שתפו תמונות השראה מ-Pinterest — מעצב הפרחים צריך להבין את הסגנון שלכם." },
  music:                    { label: "מוזיקה חיה",           emoji: "🎶", tip: "שמעו הרכב מנגן בחתונה אחרת לפני שסוגרים. דמו לא מספיק." },
  dj:                       { label: "DJ לחתונה",            emoji: "🎧", tip: "שתפו את הרשימת שירים האהובים — DJ טוב יתאים לטעם שלכם." },
  makeup:                   { label: "איפור כלה",            emoji: "💄", tip: "עשו גאון Test session לפחות חודש לפני — כדי לוודא שהאיפור עומד 10+ שעות." },
  dress:                    { label: "שמלות כלה",            emoji: "👗", tip: "תחילו לקנות לפחות 6 חודשים מראש — שמלות רבות מגיעות תוך 4–5 חודשים." },
  suit:                     { label: "חליפות חתן",           emoji: "🤵", tip: "גם החתן צריך תלבושת! חשבו על צבע שמשלים את שמלת הכלה." },
  cake:                     { label: "עוגות חתונה",          emoji: "🎂", tip: "טעמו לפחות 3 טעמים שונים — ולא רק תסתכלו על תמונות יפות." },
  invitation:               { label: "הזמנות",               emoji: "✉️",  tip: "שלחו הזמנות לפחות 6–8 שבועות לפני — אנשים צריכים לתכנן." },
  transport:                { label: "הסעות",                emoji: "🚌", tip: "דאגו להסעות בין הטקס למסיבה — זה חוסך בלבול לאורחים." },
  lighting:                 { label: "תאורה לאירועים",       emoji: "💡", tip: "תאורה טובה יכולה להפוך אולם רגיל לקסום. שווה להשקיע." },
  planning:                 { label: "מתכנני חתונות",        emoji: "📋", tip: "מתכנן טוב חוסך לכם זמן, כסף, ועצבים — שווה כל שקל." },
  "wedding-dress-designers":{ label: "מעצבי שמלות כלה",     emoji: "✂️",  tip: "שמלה בהזמנה אישית לוקחת 6–12 חודשים — התחילו מוקדם." },
  "bridal-preparation":     { label: "התארגנות כלות",        emoji: "👰", tip: "חבילת ספא + איפור + שיער ביום החתונה — שמרו על זמן פנוי." },
  other:                    { label: "ספקים נוספים",         emoji: "⭐", tip: "יש עוד המון ספקים מדהימים — גלו את כולם בדירקטורי המלא." },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES[slug];
  if (!cat) return {};
  return {
    title: `${cat.label} | WeddingPro`,
    description: `מצאו ${cat.label} מובחרים לחתונה שלכם — ביקורות אמיתיות, מחירים ופרטי קשר.`,
  };
}

async function getCategoryVendors(category: string): Promise<Vendor[]> {
  try {
    return await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.status, "active"), eq(vendors.category, category as Vendor["category"])))
      .limit(12);
  } catch {
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = CATEGORIES[slug];
  if (!cat) notFound();

  const vendorList = await getCategoryVendors(slug);

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-champagne/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-stone/50">
            <Link href="/" className="hover:text-obsidian transition-colors">בית</Link>
            <span>/</span>
            <Link href="/vendors" className="hover:text-obsidian transition-colors">ספקים</Link>
            <span>/</span>
            <span className="text-obsidian">{cat.label}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-white border-b border-champagne/60 py-14">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="text-5xl mb-4">{cat.emoji}</div>
            <h1 className="font-display text-4xl lg:text-5xl text-obsidian leading-tight mb-4">
              {cat.label}
            </h1>
            <p className="text-stone/60 text-lg max-w-2xl mx-auto leading-relaxed">
              מצאו את ה{cat.label} המושלמים לחתונה שלכם — ביקורות אמיתיות, מחירים שקופים, קשר ישיר.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Tip card */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-5 flex items-start gap-3">
            <span className="text-2xl shrink-0">💡</span>
            <div>
              <p className="font-semibold text-obsidian text-sm mb-1">טיפ מהמומחים</p>
              <p className="text-stone/65 text-sm">{cat.tip}</p>
            </div>
          </div>

          {/* Vendors */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-obsidian">
                {vendorList.length > 0 ? `${vendorList.length} ספקים` : "ספקים"}
              </h2>
              <Link
                href={`/vendors?category=${slug}`}
                className="flex items-center gap-1 text-sm text-gold hover:underline font-medium"
              >
                ראו את כולם <ChevronLeft className="h-4 w-4" />
              </Link>
            </div>

            {vendorList.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {vendorList.map((vendor) => (
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
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-champagne/60">
                <Users className="h-10 w-10 text-stone/30 mx-auto mb-4" />
                <p className="font-display text-2xl text-obsidian mb-2">עדיין אין ספקים בקטגוריה זו</p>
                <p className="text-stone/50 text-sm mb-6">היו הראשונים להצטרף!</p>
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold/90 transition-colors"
                >
                  הצטרפו כספק
                </Link>
              </div>
            )}
          </div>

          {/* CTA to join */}
          <div className="bg-obsidian rounded-3xl p-8 text-center text-white">
            <p className="font-script text-2xl text-gold mb-2">ספק {cat.label}?</p>
            <h3 className="font-display text-2xl mb-3">הצטרפו ל-WeddingPro</h3>
            <p className="text-white/60 text-sm mb-6">קבלו לידים איכותיים מזוגות שמחפשים בדיוק את השירות שלכם.</p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-white font-semibold hover:bg-gold/90 transition-all"
            >
              הצטרפו עכשיו <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
