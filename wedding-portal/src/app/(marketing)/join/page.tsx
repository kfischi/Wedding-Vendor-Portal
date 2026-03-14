import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { JoinROICalculator } from "@/components/marketing/JoinROICalculator";
import {
  Users, Star, TrendingUp, Shield, Smartphone, BarChart2,
  Check, ChevronLeft, MessageSquare, Camera, Building2, Music,
} from "lucide-react";

export const metadata: Metadata = {
  title: "הצטרפו כספק | WeddingPro",
  description: "הצטרפו ל-500+ ספקי חתונות מובחרים בישראל. קבלו לידים, נהלו את הפרופיל שלכם, וגדלו עם WeddingPro.",
};

const BENEFITS = [
  {
    icon: Users,
    title: "לידים איכותיים",
    desc: "קבלו פניות מזוגות מתחתנים שכבר מחפשים את השירות שלכם — לא צריך לרדוף אחרי לקוחות.",
  },
  {
    icon: Star,
    title: "פרופיל מקצועי",
    desc: "גלריית תמונות, מחירים, ביקורות — כל מה שלקוח צריך כדי לבחור בכם, במקום אחד.",
  },
  {
    icon: BarChart2,
    title: "אנליטיקס בזמן אמת",
    desc: "ראו כמה אנשים ביקרו בפרופיל, מאיפה הגיעו, ואיזה לידים נסגרו.",
  },
  {
    icon: Smartphone,
    title: "ניהול מהנייד",
    desc: "לוח הבקרה מותאם לנייד — נהלו לידים, עדכנו תוכן ועלו תמונות מכל מקום.",
  },
  {
    icon: Shield,
    title: "ביטחון ואמינות",
    desc: "פרופיל מאומת, ביקורות אותנטיות, ותמיכה אישית מצוות WeddingPro.",
  },
  {
    icon: TrendingUp,
    title: "SEO ונוכחות דיגיטלית",
    desc: "הפרופיל שלכם מופיע בגוגל, מייצר תנועה אורגנית, ומחזק את המותג שלכם.",
  },
];

const PLANS = [
  {
    name: "Standard",
    price: "₪149",
    period: "לחודש",
    color: "border-champagne",
    features: [
      "פרופיל בסיסי",
      "עד 20 תמונות",
      "קבלת לידים",
      "ניהול ביקורות",
      "דף מחירים",
      "סטטיסטיקות בסיסיות",
    ],
    cta: "התחילו Standard",
    ctaCls: "bg-obsidian text-white hover:bg-obsidian/90",
  },
  {
    name: "Premium",
    price: "₪349",
    period: "לחודש",
    popular: true,
    color: "border-gold",
    features: [
      "הכל ב-Standard",
      "גלריה ללא הגבלה",
      "עליית וידאו",
      "SEO מתקדם",
      "מיקום מועדף בחיפוש",
      "WhatsApp ישיר",
      "תמיכה עדיפות",
      "אנליטיקס מלא",
    ],
    cta: "התחילו Premium",
    ctaCls: "bg-gold text-white hover:bg-gold/90",
  },
];

const TESTIMONIALS = [
  {
    name: "רחל שמיר",
    role: "צלמת חתונות",
    city: "תל אביב",
    icon: Camera,
    text: "מאז שהצטרפתי ל-WeddingPro קיבלתי פי 3 יותר פניות. הלקוחות מגיעים כשהם כבר בשלים ומוכנים.",
    rating: 5,
  },
  {
    name: "מוטי לוי",
    role: "אולם אירועים",
    city: "ראשון לציון",
    icon: Building2,
    text: "הפרופיל המקצועי שבנינו פה שווה יותר מכל פרסומת שעשינו בעבר. ROI מדהים.",
    rating: 5,
  },
  {
    name: "גיל ולנטינה",
    role: "להקת חתונות",
    city: "חיפה",
    icon: Music,
    text: "התמיכה מהצוות מצוינת. בכל שאלה — מישהו עונה תוך שעה. ממליצים בחום.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "האם יש התחייבות לתקופה מינימלית?",
    a: "לא! כל החבילות הן חודשיות ואפשר לבטל בכל עת.",
  },
  {
    q: "כמה זמן לוקח לאשר את הפרופיל?",
    a: "בדרך כלל 24–48 שעות. אנחנו בודקים כל פרופיל ידנית כדי לשמור על איכות גבוהה.",
  },
  {
    q: "האם יש עלויות נסתרות על לידים?",
    a: "לא. המנוי החודשי כולל לידים ללא הגבלה.",
  },
  {
    q: "מה אם אני לא מרוצה?",
    a: "יש לנו אחריות שביעות רצון — אם ביטלתם ב-30 הימים הראשונים, נחזיר את התשלום במלואו.",
  },
  {
    q: "האם אפשר לנסות לפני שקונים?",
    a: "כן — ניתן ליצור פרופיל בחינם ולשדרג בכל עת.",
  },
];

export default function JoinPage() {
  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero */}
        <section className="relative bg-obsidian text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
          <div className="max-w-4xl mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full border border-gold/30 mb-6">
              <Users className="h-4 w-4" />
              500+ ספקים מובחרים כבר בפלטפורמה
            </div>
            <h1 className="font-display text-5xl lg:text-6xl leading-tight mb-6">
              הצטרפו למשפחת
              <br />
              <span className="font-script text-gold">WeddingPro</span>
            </h1>
            <p className="text-white/70 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              קבלו לידים איכותיים, נהלו את הפרופיל שלכם, וגדלו עם הפלטפורמה המובילה לספקי חתונות בישראל.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-xl bg-gold text-white font-semibold text-lg hover:bg-gold/90 transition-all shadow-lg"
              >
                הצטרפו עכשיו
              </Link>
              <a href="#calculator" className="px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-all">
                חשבו את ה-ROI שלכם
              </a>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="font-script text-2xl text-gold mb-2">למה WeddingPro?</p>
            <h2 className="font-display text-4xl text-obsidian">כל מה שצריך להצליח</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl border border-champagne/60 p-6 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-gold/10 flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="font-semibold text-obsidian text-base mb-2">{b.title}</h3>
                <p className="text-stone/60 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ROI Calculator */}
        <section id="calculator" className="bg-white border-y border-champagne/60 py-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="font-script text-2xl text-gold mb-2">מחשבון לידים</p>
              <h2 className="font-display text-3xl text-obsidian">כמה לידים תקבלו?</h2>
              <p className="text-stone/60 mt-2">הכניסו את הפרטים שלכם וראו את ההערכה שלנו</p>
            </div>
            <JoinROICalculator />
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="font-script text-2xl text-gold mb-2">תוכניות</p>
            <h2 className="font-display text-4xl text-obsidian">מחיר שמתאים לכם</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-3xl border-2 ${plan.color} p-8 shadow-sm`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-6 bg-gold text-white text-xs font-bold px-3 py-1 rounded-full">
                    הכי פופולרי
                  </div>
                )}
                <h3 className="font-display text-2xl text-obsidian mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl text-gold">{plan.price}</span>
                  <span className="text-stone/60 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-stone/70">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold transition-all ${plan.ctaCls}`}
                >
                  {plan.cta} <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white border-y border-champagne/60 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="font-script text-2xl text-gold mb-2">ספקים מספרים</p>
              <h2 className="font-display text-4xl text-obsidian">הם כבר שם — בואו להצטרף</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-[#faf9f7] rounded-2xl border border-champagne/60 p-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-stone/70 text-sm leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
                      <t.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-obsidian">{t.name}</p>
                      <p className="text-xs text-stone/50">{t.role} · {t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-obsidian">שאלות נפוצות</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl border border-champagne/60 p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-obsidian text-sm mb-2">{faq.q}</h3>
                    <p className="text-stone/60 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-obsidian to-obsidian/90 text-white py-20 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <p className="font-script text-3xl text-gold mb-3">מוכנים להתחיל?</p>
            <h2 className="font-display text-4xl leading-tight mb-6">
              הצטרפו היום וקבלו<br />את הלידים הראשונים השבוע
            </h2>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gold text-white font-semibold text-lg hover:bg-gold/90 transition-all shadow-lg"
            >
              הצטרפו עכשיו <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
