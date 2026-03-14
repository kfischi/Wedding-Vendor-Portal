import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Heart, Users, Star, Building2, Target, Eye, ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "אודות WeddingPro",
  description: "הכירו את WeddingPro — הפלטפורמה המובילה לחיבור בין ספקי חתונות לזוגות מתחתנים בישראל.",
};

const STATS = [
  { value: "500+", label: "ספקים מוסמכים" },
  { value: "2,000+", label: "זוגות מאושרים" },
  { value: "18", label: "קטגוריות" },
  { value: "4.8★", label: "דירוג ממוצע" },
];

const VALUES = [
  { icon: Heart,    title: "אהבה ליום הגדול", desc: "אנחנו מאמינים שכל זוג ראוי לחתונה מושלמת, ועוזרים לכם למצוא את הספקים שיהפכו את החלום למציאות." },
  { icon: Target,   title: "שקיפות ואמינות",  desc: "רק ספקים שעברו אימות, עם ביקורות אמיתיות מזוגות שהשתמשו בשירות." },
  { icon: Eye,      title: "חדשנות",           desc: "כלים דיגיטליים חכמים שעוזרים לספקים לנהל את העסק ולזוגות לתכנן את היום המושלם." },
];

const TEAM = [
  { name: "דנה כהן",  role: "מנכ״לית ומייסדת",  initials: "ד.כ" },
  { name: "יואב לוי", role: "CTO",               initials: "י.ל" },
  { name: "שיר רוז",  role: "ראש שיווק",          initials: "ש.ר" },
  { name: "עמית בן דוד", role: "ראש תמיכה",      initials: "ע.ב" },
];

export default function AboutPage() {
  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero */}
        <section className="relative bg-obsidian text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-gold/20 to-blush/10" />
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <p className="font-script text-3xl text-gold mb-3">הסיפור שלנו</p>
            <h1 className="font-display text-5xl lg:text-6xl leading-tight mb-6">
              אנחנו מחברים בין<br />
              <span className="text-gold">חלומות למציאות</span>
            </h1>
            <p className="text-white/70 text-xl leading-relaxed">
              WeddingPro נוסדה מתוך אהבה לרגע הגדול — ומאמונה שכל זוג ראוי לספקים הטובים ביותר.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-script text-2xl text-gold mb-3">הסיפור</p>
              <h2 className="font-display text-3xl text-obsidian mb-5">איך הכל התחיל</h2>
              <div className="space-y-4 text-stone/70 leading-relaxed">
                <p>
                  בשנת 2022, לאחר שהתמודדנו בעצמנו עם כאב הראש של מציאת ספקים לחתונה — החלטנו שמשהו צריך להשתנות.
                </p>
                <p>
                  חיפשנו צלם, מצאנו 300 תוצאות בגוגל. חיפשנו אולם, קיבלנו הצעות לא רלוונטיות. בזבזנו שעות — ויכולנו לבזבז אותן עם משפחה וחברים.
                </p>
                <p>
                  WeddingPro נולדה מתוך הכאב הזה: פלטפורמה שמאגדת ספקים מוסמכים ומאומתים, עם ביקורות אמיתיות, כלים לניהול ותקשורת ישירה — הכל במקום אחד.
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

        {/* Mission + Vision */}
        <section className="bg-white border-y border-champagne/60 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="bg-[#faf9f7] rounded-2xl border border-champagne/60 p-8">
                <Target className="h-8 w-8 text-gold mb-4" />
                <h3 className="font-display text-2xl text-obsidian mb-3">המשימה שלנו</h3>
                <p className="text-stone/65 leading-relaxed">
                  לאפשר לכל זוג למצוא את ספקי החתונה המושלמים — בקלות, בשקיפות, ובביטחון. ולאפשר לספקים לגדול ולמכור טוב יותר עם כלים דיגיטליים מודרניים.
                </p>
              </div>
              <div className="bg-[#faf9f7] rounded-2xl border border-champagne/60 p-8">
                <Eye className="h-8 w-8 text-gold mb-4" />
                <h3 className="font-display text-2xl text-obsidian mb-3">החזון שלנו</h3>
                <p className="text-stone/65 leading-relaxed">
                  להיות הפלטפורמה המובילה לחתונות בישראל — המקום שכל זוג פותח ראשון, וכל ספק רוצה להיות בו.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl text-obsidian">הערכים שלנו</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-champagne/60 p-6 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="font-semibold text-obsidian mb-2">{v.title}</h3>
                <p className="text-stone/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="bg-white border-y border-champagne/60 py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="font-script text-2xl text-gold mb-2">האנשים מאחורינו</p>
              <h2 className="font-display text-4xl text-obsidian">הצוות שלנו</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {TEAM.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-blush/30 flex items-center justify-center mx-auto mb-3 border-2 border-champagne">
                    <span className="font-display text-lg text-obsidian">{member.initials}</span>
                  </div>
                  <p className="font-semibold text-obsidian text-sm">{member.name}</p>
                  <p className="text-xs text-stone/55 mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center max-w-2xl mx-auto px-4">
          <p className="font-script text-3xl text-gold mb-3">בואו לגדול יחד</p>
          <h2 className="font-display text-4xl text-obsidian mb-6">
            חלק מהמשפחה?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/vendors" className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-obsidian text-obsidian font-semibold hover:bg-obsidian/5 transition-all">
              <Users className="h-4 w-4" /> מצאו ספקים
            </Link>
            <Link href="/join" className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-white font-semibold hover:bg-gold/90 transition-all">
              הצטרפו כספק <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
