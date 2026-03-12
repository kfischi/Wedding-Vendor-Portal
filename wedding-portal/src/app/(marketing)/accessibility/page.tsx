import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הצהרת נגישות | Wedding Vendor Portal",
  description: "הצהרת הנגישות של Wedding Vendor Portal — עמידה בתקן WCAG 2.1 AA ותקנות שוויון זכויות לאנשים עם מוגבלות.",
};

const UPDATED = "1 בינואר 2025";
const COORDINATOR_NAME = "צוות הנגישות";
const COORDINATOR_EMAIL = "accessibility@wedding-vendor-portal.co.il";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-ivory" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <p className="font-script text-gold text-xl mb-1">נגישות</p>
          <h1 className="font-display text-4xl text-obsidian">הצהרת נגישות</h1>
          <p className="text-stone text-sm mt-3">עודכן לאחרונה: {UPDATED}</p>
        </div>

        <div className="prose-legal">

          <Section title="1. מחויבות לנגישות">
            <p>
              Wedding Vendor Portal מחויבת להנגיש את שירותיה לכלל הציבור, לרבות
              אנשים עם מוגבלות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ&quot;ח-1998,
              לתקנות הנגישות לשירות (תקנות 2013) ולהנחיות הנגישות לתכנים באינטרנט
              WCAG 2.1 ברמה AA.
            </p>
          </Section>

          <Section title="2. רמת עמידה">
            <p>
              האתר עומד ברמה <strong>AA</strong> של תקן{" "}
              <abbr title="Web Content Accessibility Guidelines">WCAG</abbr> 2.1.
              הנגשת האתר בוצעה על בסיס הנחיות IS 5568 (התקן הישראלי לנגישות אתרים).
            </p>
          </Section>

          <Section title="3. תכונות נגישות קיימות">
            <Subsection title="ניווט ומבנה">
              <ul>
                <li>ניווט מלא באמצעות מקלדת בלבד (Tab, Enter, Escape, חצים).</li>
                <li>סדר פוקוס לוגי וקוהרנטי בכל הדפים.</li>
                <li>עוגנים לדילוג על תפריטים (&quot;דלג לתוכן&quot; — Skip to content).</li>
                <li>כותרות מדורגות (H1–H6) ומבנה סמנטי תקני.</li>
              </ul>
            </Subsection>
            <Subsection title="טקסט וקריאות">
              <ul>
                <li>יחס ניגודיות צבע עומד בדרישות AA (לפחות 4.5:1 לטקסט רגיל).</li>
                <li>גודל גופן בסיסי 16px, נתמך בהגדלה עד 200% ללא אובדן תוכן.</li>
                <li>שפת הדף מוגדרת בתג lang=&quot;he&quot;.</li>
              </ul>
            </Subsection>
            <Subsection title="תמונות ומדיה">
              <ul>
                <li>כל התמונות מכילות תיאור alt מתאים.</li>
                <li>תמונות דקורטיביות מסומנות alt=&quot;&quot; להסתרה מקוראי מסך.</li>
                <li>קבצי וידאו מוצגים עם אפשרות כיבוי אוטומטי.</li>
              </ul>
            </Subsection>
            <Subsection title="טפסים">
              <ul>
                <li>כל שדה טופס מוגדר עם label נגיש או aria-label.</li>
                <li>הודעות שגיאה מפורטות וקשורות לשדה המתאים.</li>
                <li>אין הגבלת זמן לרביית טפסים.</li>
              </ul>
            </Subsection>
            <Subsection title="תמיכה בטכנולוגיות מסייעות">
              <ul>
                <li>NVDA (Windows), VoiceOver (macOS / iOS), TalkBack (Android).</li>
                <li>שימוש מתאים ב-ARIA roles, landmarks ו-live regions.</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="4. מגבלות ידועות">
            <p>
              למרות מאמצינו, ייתכן כי חלק מהתכנים שהועלו על-ידי ספקים (תמונות,
              מסמכי PDF) אינם עומדים בכל דרישות הנגישות. אנו עובדים באופן מתמיד
              לשיפור הנגישות.
            </p>
          </Section>

          <Section title="5. דפדפנים ומכשירים נתמכים">
            <ul>
              <li>Chrome 120+, Firefox 120+, Safari 17+, Edge 120+.</li>
              <li>iOS Safari, Android Chrome.</li>
              <li>רזולוציה מינימלית: 320px רוחב.</li>
            </ul>
          </Section>

          <Section title="6. דיווח על בעיות נגישות">
            <p>
              נתקלת בבעיית נגישות? נשמח לשמוע ממך כדי לטפל בה בהקדם.
              ניתן לפנות אלינו בדרכים הבאות:
            </p>
            <div className="bg-cream-white rounded-xl p-5 border border-champagne/60 mt-3 space-y-2">
              <p className="font-semibold text-obsidian text-sm">רכז נגישות: {COORDINATOR_NAME}</p>
              <p className="text-sm">
                <span className="text-stone/60">אימייל: </span>
                <a href={`mailto:${COORDINATOR_EMAIL}`} className="text-dusty-rose hover:underline">
                  {COORDINATOR_EMAIL}
                </a>
              </p>
              <p className="text-stone text-sm">
                נחזור אליך תוך 5 ימי עבודה עם עדכון על הטיפול בפנייה.
              </p>
            </div>
          </Section>

          <Section title="7. עדכון ההצהרה">
            <p>
              הצהרה זו מתעדכנת בהתאם לשינויים באתר ולדרישות החוק.
              בדיקת נגישות מקיפה מתבצעת אחת לשנה.
            </p>
          </Section>

        </div>
      </div>

      <LegalStyles />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl text-obsidian mb-3">{title}</h2>
      <div className="text-stone leading-relaxed space-y-3">{children}</div>
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

function LegalStyles() {
  return (
    <style>{`
      .prose-legal ul { list-style: disc; padding-right: 1.25rem; margin: 0.5rem 0; }
      .prose-legal ul li { margin-bottom: 0.3rem; font-size: 0.875rem; color: rgb(107 95 90); }
      .prose-legal p { font-size: 0.875rem; }
    `}</style>
  );
}
