import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Heart, Users, Target, Eye, ChevronLeft, Calendar, TrendingUp, Award } from "lucide-react";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export const metadata: Metadata = {
  title: "אודות WeddingPro",
  description: "הכירו את WeddingPro — הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.",
};

async function getVendorCount(): Promise<number> {
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(vendors)
      .where(eq(vendors.status, "active"));
    return Number(value) ?? 0;
  } catch {
    return 0;
  }
}

const VALUES = [
  {
    icon: Heart,
    title: "אנחנו ספקים בעצמנו",
    desc: "חלק מהצוות הגיע מעולם הצילום והאירועים. אנחנו מבינים את הכאב משני הצדדים — ובנינו בהתאם.",
  },
  {
    icon: Target,
    title: "ללא עמלות על עסקאות",
    desc: "לא לוקחים אחוז מכל ליד. הספק משלם מנוי קבוע וכל הלידים שלו — שלו. בלי הפתעות.",
  },
  {
    icon: Eye,
    title: "שקיפות מלאה",
    desc: "כל ספק רואה כמה צפיות קיבל, כמה פנו, ומאיפה הגיעו. נתונים אמיתיים, לא 'תסמוך עלינו'.",
  },
];

const MILESTONES = [
  {
    year: "ינואר 2023",
    icon: Calendar,
    title: "ההתחלה — בגרוש",
    desc: "רן ואיתי בנו את הגרסה הראשונה בשבועיים, מהדירה של רן ברמת גן. 12 ספקים נרשמו ביום הראשון — כולם חברים.",
  },
  {
    year: "יוני 2023",
    icon: TrendingUp,
    title: "100 ספקים פעילים",
    desc: "חודשיים של פגישות עם צלמים, מעצבי פרחים ובעלי אולמות. הבנו מה הם צריכים — ושינינו לפי זה.",
  },
  {
    year: "ינואר 2024",
    icon: Award,
    title: "1,000 זוגות ראשונים",
    desc: "הגענו לאלף זוגות שמצאו ספק דרכנו. קיבלנו מייל מכלה שכתבה: 'הצלתם לי את החתונה.' שמרנו אותו.",
  },
  {
    year: "2025",
    icon: Heart,
    title: "הרחבה לכל הארץ",
    desc: "מתל אביב ל-13 ערים. שיתופי פעולה עם אולמות ועיריות, וצוות של 7 אנשים שכולם אוהבים חתונות.",
  },
];

const TEAM = [
  {
    name: "רן כהן",
    role: "מייסד ומנכ\"ל",
    bio: "לשעבר מפתח ב-monday.com. התחתן ב-2022 ובזבז שלושה שבועות על מציאת צלם. הוציא מכך מוצר.",
    initial: "ר",
  },
  {
    name: "איתי לוי",
    role: "מייסד שותף ו-CTO",
    bio: "בוגר טכניון, 8 שנים בהיי-טק. אחראי על כל מה שרץ מאחורי הקלעים — ועל כך שהוא רץ מהר.",
    initial: "א",
  },
  {
    name: "מיכל ברנשטיין",
    role: "ראש צוות ספקים",
    bio: "10 שנים כמתכננת חתונות עצמאית. מכירה כל ספק בישראל בשמו הפרטי. דואגת שהפלטפורמה תעבוד להם באמת.",
    initial: "מ",
  },
];

export default async function AboutPage() {
  const vendorCount = await getVendorCount();

  const STATS = [
    { value: vendorCount > 0 ? `${vendorCount}+` : "עשרות", label: "ספקים פעילים" },
    { value: "18",    label: "קטגוריות ספקים" },
    { value: "₪0",   label: "עמלות על עסקאות" },
    { value: "3",     label: "חודשי ניסיון חינם" },
  ];

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">

        {/* Hero */}
        <section className="relative bg-obsidian text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-gold/20 to-blush/10" />
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <p className="font-script text-3xl text-gold mb-3">הסיפור שלנו</p>
            <h1 className="font-display text-5xl lg:text-6xl leading-tight mb-6">
              נולדנו מתוך<br />
              <span className="text-gold">חתונה אחת</span>
            </h1>
            <p className="text-white/70 text-xl leading-relaxed max-w-2xl mx-auto">
              לא מ-PowerPoint של משקיע. מחיפוש מתסכל בגוגל,
              300 תוצאות לא רלוונטיות, וצלם שלא החזיר טלפון.
            </p>
          </div>
        </section>

        {/* The real story */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-script text-2xl text-gold mb-3">מה שבאמת קרה</p>
              <h2 className="font-display text-3xl text-obsidian mb-5">איך הכל התחיל</h2>
              <div className="space-y-4 text-stone/70 leading-relaxed">
                <p>
                  רן התחתן בספטמבר 2022. שלושה שבועות לפני החתונה עדיין לא היה לו צלם — לא כי לא חיפש,
                  אלא כי כל הכלים שמצא היו גרועים. גוגל, קבוצות פייסבוק, המלצות שמועות מחברים.
                </p>
                <p>
                  בסוף הוא מצא צלם מעולה — דרך חבר של חבר. בדרך הכי לא יעילה שיש.
                  בדרך חזרה מהחתונה, מהמושב האחורי של האוטו, הוא שלח הודעה לאיתי:
                  <span className="font-medium text-obsidian"> &ldquo;יש פה משהו שצריך לבנות.&rdquo;</span>
                </p>
                <p>
                  שלושה חודשים אחר כך — גרסה ראשונה. לא יפה, לא מושלמת. אבל עבדה.
                  הספק הראשון שנרשם היה הצלם של רן עצמו.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-champagne/60 p-8 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center p-4 bg-[#faf9f7] rounded-2xl border border-champagne/60">
                    <p className="font-display text-3xl text-gold">{s.value}</p>
                    <p className="text-xs text-stone/60 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-white border-y border-champagne/60 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl text-obsidian">מה עשינו עד עכשיו</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MILESTONES.map((m) => (
                <div key={m.year} className="bg-[#faf9f7] rounded-2xl border border-champagne/60 p-6">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
                    <m.icon className="h-5 w-5 text-gold" />
                  </div>
                  <p className="text-xs font-semibold text-gold/80 uppercase tracking-wider mb-1">{m.year}</p>
                  <h3 className="font-semibold text-obsidian text-sm mb-2">{m.title}</h3>
                  <p className="text-stone/60 text-xs leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="font-script text-2xl text-gold mb-2">מי אנחנו</p>
            <h2 className="font-display text-4xl text-obsidian">הצוות</h2>
            <p className="text-stone/60 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              7 אנשים. חלקם מהיי-טק, חלקם מעולם האירועים.
              המכנה המשותף: כולם השתתפו לפחות בשלוש חתונות ב-12 החודשים האחרונים.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TEAM.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-champagne/60 p-6 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-obsidian flex items-center justify-center mb-4">
                  <span className="font-display text-2xl text-gold">{t.initial}</span>
                </div>
                <h3 className="font-semibold text-obsidian">{t.name}</h3>
                <p className="text-xs text-gold/80 font-medium mb-3">{t.role}</p>
                <p className="text-stone/60 text-sm leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-white border-t border-champagne/60 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl text-obsidian">למה שתסמכו עלינו</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-[#faf9f7] rounded-2xl border border-champagne/60 p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="font-semibold text-obsidian mb-2">{v.title}</h3>
                  <p className="text-stone/60 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-champagne/60 p-8 shadow-sm">
              <Target className="h-8 w-8 text-gold mb-4" />
              <h3 className="font-display text-2xl text-obsidian mb-3">המשימה שלנו</h3>
              <p className="text-stone/65 leading-relaxed text-sm">
                לאפשר לכל זוג למצוא ספקים אמינים בפחות מ-30 דקות —
                לא שלושה שבועות. ולאפשר לספקים טובים להיחשף, בלי שיצטרכו
                להתחרות רק על מחיר.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-champagne/60 p-8 shadow-sm">
              <Eye className="h-8 w-8 text-gold mb-4" />
              <h3 className="font-display text-2xl text-obsidian mb-3">לאן אנחנו הולכים</h3>
              <p className="text-stone/65 leading-relaxed text-sm">
                הפלטפורמה המרכזית לתעשיית החתונות בישראל —
                לא רק דירקטורי, אלא כלי עבודה שלם לספקים וחוויית תכנון
                שלמה לזוגות. מתחילים כאן. לא מפסיקים.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center max-w-2xl mx-auto px-4">
          <p className="font-script text-3xl text-gold mb-3">ורד הצלם של רן?</p>
          <h2 className="font-display text-4xl text-obsidian mb-3">
            הוא עדיין בפלטפורמה.
          </h2>
          <p className="text-stone/60 mb-8 leading-relaxed">
            ויש לו 47 ביקורות של 5 כוכבים.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/vendors"
              className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-obsidian text-obsidian font-semibold hover:bg-obsidian/5 transition-all"
            >
              <Users className="h-4 w-4" /> מצאו ספקים
            </Link>
            <Link
              href="/join"
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-white font-semibold hover:bg-gold/90 transition-all"
            >
              הצטרפו כספק <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
