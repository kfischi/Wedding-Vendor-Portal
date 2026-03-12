import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות עוגיות | Wedding Vendor Portal",
  description: "מדיניות העוגיות של Wedding Vendor Portal — אילו עוגיות בשימוש, למה הן נחוצות ואיך לבטל אותן.",
};

const UPDATED = "1 בינואר 2025";
const CONTACT_EMAIL = "privacy@wedding-vendor-portal.co.il";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-ivory" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <p className="font-script text-gold text-xl mb-1">משפטי</p>
          <h1 className="font-display text-4xl text-obsidian">מדיניות עוגיות</h1>
          <p className="text-stone text-sm mt-3">עודכן לאחרונה: {UPDATED}</p>
        </div>

        <div className="prose-legal">

          <Section title="1. מה הן עוגיות?">
            <p>
              עוגיות (Cookies) הן קבצי טקסט קטנים שמאוחסנים במחשבך או במכשיר הנייד שלך
              בעת ביקור באתרים. הן מאפשרות לאתר לזכור פעולות והעדפות שלך לאורך זמן,
              כך שאינך צריך להזינן מחדש בכל ביקור.
            </p>
          </Section>

          <Section title="2. אילו עוגיות אנו משתמשים">

            <CookieTable
              title="עוגיות חיוניות (Essential)"
              description="נחוצות לתפקוד הבסיסי של האתר. אינן ניתנות לביטול."
              cookies={[
                {
                  name: "sb-*",
                  provider: "Supabase",
                  purpose: "ניהול סשן אימות — שמירת מצב הכניסה שלך.",
                  duration: "סשן / 7 ימים",
                },
                {
                  name: "cookie-consent",
                  provider: "Wedding Vendor Portal",
                  purpose: "שמירת הסכמתך לשימוש בעוגיות.",
                  duration: "12 חודשים",
                },
                {
                  name: "x-admin-impersonating",
                  provider: "Wedding Vendor Portal",
                  purpose: "מצב ייצוג ספק על-ידי מנהל מערכת.",
                  duration: "8 שעות",
                },
              ]}
            />

            <CookieTable
              title="עוגיות ביצועים (Analytics)"
              description="עוזרות לנו להבין כיצד המשתמשים מנווטים באתר. כל הנתונים אנונימיים."
              cookies={[
                {
                  name: "_ga, _ga_*",
                  provider: "Google Analytics (אם מופעל)",
                  purpose: "מדידת תנועת משתמשים ומדדי ביצועים.",
                  duration: "24 חודשים",
                },
              ]}
            />

            <CookieTable
              title="עוגיות שיווק (Marketing)"
              description="כרגע אינן בשימוש. לא נפעיל עוגיות שיווק ללא הסכמתך."
              cookies={[]}
              empty="לא בשימוש כרגע"
            />
          </Section>

          <Section title="3. אחסון מקומי (localStorage)">
            <p>
              בנוסף לעוגיות, אנו משתמשים ב-localStorage לאחסון הגדרות ממשק משתמש
              מקומיות (כגון הסכמת עוגיות). מידע זה אינו מועבר לשרת ונמחק עם ניקוי
              הדפדפן.
            </p>
          </Section>

          <Section title="4. כיצד לשנות הגדרות עוגיות">
            <p>ניתן לנהל ולמחוק עוגיות בדרכים הבאות:</p>

            <Subsection title="הגדרות דפדפן">
              <ul>
                <li>
                  <strong>Chrome:</strong> הגדרות ← פרטיות ואבטחה ← עוגיות ונתוני אתר
                </li>
                <li>
                  <strong>Firefox:</strong> הגדרות ← פרטיות ואבטחה ← עוגיות ונתוני אתר
                </li>
                <li>
                  <strong>Safari:</strong> העדפות ← פרטיות ← ניהול נתוני אתר
                </li>
                <li>
                  <strong>Edge:</strong> הגדרות ← עוגיות והרשאות אתר
                </li>
              </ul>
            </Subsection>

            <Subsection title="הערה חשובה">
              <p>
                חסימת עוגיות חיוניות עשויה להשפיע על תפקוד האתר ולמנוע כניסה לחשבון.
              </p>
            </Subsection>
          </Section>

          <Section title="5. עדכונים למדיניות">
            <p>
              מדיניות זו עשויה להתעדכן בעקבות שינויים בשירות או בדרישות החוק.
              תאריך העדכון יופיע תמיד בראש הדף.
            </p>
          </Section>

          <Section title="6. יצירת קשר">
            <p>לשאלות בנושא עוגיות ופרטיות:</p>
            <div className="bg-cream-white rounded-xl p-4 border border-champagne/60 text-sm mt-3">
              <p>
                <span className="text-stone/60">אימייל: </span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-dusty-rose hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </Section>

        </div>
      </div>

      <LegalStyles />
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl text-obsidian mb-3">{title}</h2>
      <div className="text-stone leading-relaxed space-y-4">{children}</div>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="font-semibold text-obsidian text-sm mb-2">{title}</h3>
      <div className="text-stone leading-relaxed">{children}</div>
    </div>
  );
}

interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

function CookieTable({
  title,
  description,
  cookies,
  empty,
}: {
  title: string;
  description: string;
  cookies: CookieRow[];
  empty?: string;
}) {
  return (
    <div className="mb-5">
      <h3 className="font-semibold text-obsidian text-sm mb-1">{title}</h3>
      <p className="text-xs text-stone/60 mb-3">{description}</p>
      {cookies.length === 0 ? (
        <p className="text-xs text-stone/50 italic bg-champagne/30 rounded-xl px-4 py-3">
          {empty}
        </p>
      ) : (
        <div className="border border-champagne/60 rounded-xl overflow-hidden text-xs">
          {/* Header */}
          <div className="grid grid-cols-4 bg-ivory/70 px-4 py-2 font-medium text-stone/70 border-b border-champagne/40">
            <span>שם</span>
            <span>ספק</span>
            <span>מטרה</span>
            <span>תוקף</span>
          </div>
          {cookies.map((c) => (
            <div
              key={c.name}
              className="grid grid-cols-4 px-4 py-2.5 border-b border-champagne/30 last:border-0 hover:bg-ivory/50 transition-colors"
            >
              <span className="font-mono text-obsidian">{c.name}</span>
              <span className="text-stone/70">{c.provider}</span>
              <span className="text-stone/70">{c.purpose}</span>
              <span className="text-stone/70">{c.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LegalStyles() {
  return (
    <style>{`
      .prose-legal ul { list-style: disc; padding-right: 1.25rem; margin: 0.5rem 0; }
      .prose-legal ul li { margin-bottom: 0.3rem; font-size: 0.875rem; color: rgb(107 95 90); }
      .prose-legal p { font-size: 0.875rem; }
    `}</style>
  );
}
