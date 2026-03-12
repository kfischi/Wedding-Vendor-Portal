import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | Wedding Vendor Portal",
  description: "מדיניות הפרטיות של Wedding Vendor Portal — כיצד אנו אוספים, משתמשים ומגנים על המידע האישי שלך.",
};

const UPDATED = "1 בינואר 2025";
const CONTACT_EMAIL = "privacy@wedding-vendor-portal.co.il";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ivory" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <p className="font-script text-gold text-xl mb-1">משפטי</p>
          <h1 className="font-display text-4xl text-obsidian">מדיניות פרטיות</h1>
          <p className="text-stone text-sm mt-3">עודכן לאחרונה: {UPDATED}</p>
        </div>

        <div className="prose-legal">

          <Section title="1. מבוא">
            <p>
              ברוכים הבאים ל-Wedding Vendor Portal (&quot;הפלטפורמה&quot;, &quot;אנחנו&quot;, &quot;שלנו&quot;).
              אנו מכבדים את פרטיותך ומחויבים להגן על המידע האישי שלך.
              מדיניות זו מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם
              ואילו זכויות עומדות לרשותך, בהתאם לחוק הגנת הפרטיות, תשמ&quot;א-1981,
              ולתקנות הגנת המידע האירופאיות (GDPR) ככל שחלות.
            </p>
          </Section>

          <Section title="2. מידע שאנו אוספים">
            <Subsection title="2.1 מידע שאתה מספק לנו">
              <ul>
                <li><strong>ספקי שירותים:</strong> שם מלא, שם עסק, כתובת אימייל, מספר טלפון, עיר ואזור, תמונות, תיאורים, מחירים ומידע על העסק.</li>
                <li><strong>לקוחות (פניות):</strong> שם, אימייל, טלפון, תאריך אירוע מבוקש והודעה חופשית.</li>
                <li><strong>תשלום:</strong> פרטי תשלום מעובדים ישירות על-ידי Stripe ואינם נשמרים בשרתינו.</li>
              </ul>
            </Subsection>
            <Subsection title="2.2 מידע שנאסף אוטומטית">
              <ul>
                <li>כתובת IP ומיקום גיאוגרפי כללי.</li>
                <li>סוג דפדפן, מערכת הפעלה, ורזולוציית מסך.</li>
                <li>עמודים שנצפו, זמן שהייה ומקור הפניה.</li>
                <li>עוגיות וטכנולוגיות מעקב דומות (ראה סעיף 5).</li>
              </ul>
            </Subsection>
          </Section>

          <Section title="3. כיצד אנו משתמשים במידע">
            <ul>
              <li>מתן השירות — הצגת פרופיל הספק ללקוחות פוטנציאליים.</li>
              <li>תקשורת — משלוח אישורי רישום, עדכוני מנוי והודעות מערכת.</li>
              <li>עיבוד תשלומים — באמצעות Stripe.</li>
              <li>שיפור הפלטפורמה — ניתוח תנועה ושימוש.</li>
              <li>ציות לחוק — מענה לבקשות רשויות מוסמכות.</li>
              <li>מניעת הונאה — אבטחת המערכת וגילוי שימוש לרעה.</li>
            </ul>
            <p>
              <strong>שיווק:</strong> לא נשתמש במידע שלך לצרכי פרסום ממוקד מבלי לקבל הסכמתך המפורשת.
            </p>
          </Section>

          <Section title="4. שיתוף מידע עם צדדים שלישיים">
            <p>אנו עשויים לשתף מידע עם ספקי שירות הפועלים מטעמנו בלבד:</p>
            <ul>
              <li><strong>Stripe</strong> — עיבוד תשלומים מאובטח.</li>
              <li><strong>Cloudinary</strong> — אחסון ואופטימיזציית תמונות.</li>
              <li><strong>Resend</strong> — שירות משלוח אימיילים.</li>
              <li><strong>Supabase / PostgreSQL</strong> — אחסון מסד נתונים מוצפן.</li>
            </ul>
            <p>
              כל ספקי הצד השלישי כפופים להסכמי עיבוד נתונים ואינם רשאים לעשות שימוש
              במידע שלא למטרות שנקבעו.
              <br />
              <strong>לא נמכור את המידע שלך לאף צד שלישי.</strong>
            </p>
          </Section>

          <Section title="5. עוגיות">
            <p>
              הפלטפורמה משתמשת בעוגיות חיוניות לתפקוד התקין (אימות, אבטחה, העדפות)
              ועוגיות ניתוח אנונימיות לשיפור השירות. לפרטים נוספים ראה
              {" "}
              <Link href="/cookies" className="text-dusty-rose hover:underline">
                מדיניות העוגיות שלנו
              </Link>.
            </p>
          </Section>

          <Section title="6. אבטחת מידע">
            <ul>
              <li>תקשורת מוצפנת ב-TLS/HTTPS בכל נקודות הקצה.</li>
              <li>סיסמאות לא נשמרות — אנו משתמשים ב-Magic Link בלבד.</li>
              <li>גישה למסד הנתונים מוגבלת לצוות מורשה בלבד.</li>
              <li>גיבויים אוטומטיים יומיים.</li>
            </ul>
          </Section>

          <Section title="7. שמירת מידע">
            <p>
              נשמור את מידעך כל עוד חשבונך פעיל, ועוד 24 חודשים לאחר מכן לצרכי
              ביקורת ציות. לאחר מכן, הנתונים יימחקו לצמיתות.
              נתוני פניות (לידים) יישמרו 36 חודשים לצרכי סטטיסטיקה אנונימית.
            </p>
          </Section>

          <Section title="8. זכויותיך">
            <p>בהתאם לחוק הגנת הפרטיות ול-GDPR (ככל שחל), עומדות לך הזכויות הבאות:</p>
            <ul>
              <li><strong>גישה</strong> — לקבל עותק של המידע שלך.</li>
              <li><strong>תיקון</strong> — לתקן מידע שגוי.</li>
              <li><strong>מחיקה</strong> — לבקש מחיקת מידעך (&quot;הזכות להישכח&quot;).</li>
              <li><strong>הגבלת עיבוד</strong> — להגביל את השימוש במידעך.</li>
              <li><strong>ניידות</strong> — לקבל את מידעך בפורמט מובנה.</li>
              <li><strong>התנגדות</strong> — להתנגד לעיבוד לצרכי שיווק.</li>
            </ul>
            <p>
              לממש זכויות אלה, פנה אלינו ב: <a href={`mailto:${CONTACT_EMAIL}`} className="text-dusty-rose hover:underline">{CONTACT_EMAIL}</a>.
              נטפל בבקשה תוך 30 יום.
            </p>
          </Section>

          <Section title="9. ילדים">
            <p>
              הפלטפורמה אינה מיועדת לבני פחות מ-18. אנו לא אוספים ביודעין מידע ממינורים.
            </p>
          </Section>

          <Section title="10. שינויים במדיניות">
            <p>
              נעדכן מדיניות זו מעת לעת. במקרה של שינויים מהותיים, נשלח הודעה לאימייל
              הרשום שלך ונציג את תאריך העדכון בראש הדף.
            </p>
          </Section>

          <Section title="11. יצירת קשר">
            <p>לשאלות בנושא פרטיות, פנה אל:</p>
            <ContactBox email={CONTACT_EMAIL} />
          </Section>

        </div>
      </div>

      <LegalStyles />
    </div>
  );
}

// ─── Shared legal-page helpers ─────────────────────────────────────────────────

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
      <div className="text-stone leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

function ContactBox({ email, name }: { email: string; name?: string }) {
  return (
    <div className="bg-cream-white rounded-xl p-4 border border-champagne/60 text-sm mt-3 space-y-1">
      {name && <p className="font-medium text-obsidian">{name}</p>}
      <p>
        <span className="text-stone/60">אימייל: </span>
        <a href={`mailto:${email}`} className="text-dusty-rose hover:underline">{email}</a>
      </p>
      <p className="text-stone/60 text-xs">Wedding Vendor Portal, ישראל</p>
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
