import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תנאי שימוש | Wedding Vendor Portal",
  description: "תנאי השימוש של Wedding Vendor Portal — הגדרות, שימוש מותר, אחריות, מנויים והחזרים.",
};

const UPDATED = "1 בינואר 2025";
const CONTACT_EMAIL = "legal@wedding-vendor-portal.co.il";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <p className="font-script text-gold text-xl mb-1">משפטי</p>
          <h1 className="font-display text-4xl text-obsidian">תנאי שימוש</h1>
          <p className="text-stone text-sm mt-3">עודכן לאחרונה: {UPDATED}</p>
        </div>

        <div className="prose-legal">

          <Section title="1. הסכמה לתנאים">
            <p>
              גישה לפלטפורמה ושימוש בה מהווים הסכמה מלאה לתנאים אלה.
              אם אינך מסכים לתנאים, הפסק את השימוש מיידית.
              תנאים אלה נכנסים לתוקף עם ההרשמה לשירות.
            </p>
          </Section>

          <Section title="2. הגדרות">
            <ul>
              <li><strong>&quot;הפלטפורמה&quot;</strong> — אתר האינטרנט ושירותי Wedding Vendor Portal.</li>
              <li><strong>&quot;ספק&quot;</strong> — עסק מורשה הרשום בפלטפורמה לצורך הצגת שירותיו.</li>
              <li><strong>&quot;לקוח&quot;</strong> — כל מבקר באתר המחפש שירותי חתונה.</li>
              <li><strong>&quot;תוכן&quot;</strong> — כל מידע, תמונה, טקסט, וידאו ומחיר שהועלה על-ידי ספק.</li>
              <li><strong>&quot;מנוי&quot;</strong> — הסכם שירות בתשלום בין הספק לפלטפורמה.</li>
            </ul>
          </Section>

          <Section title="3. הרשמה וחשבון">
            <ul>
              <li>הרישום מיועד לעסקים בלבד. הצגת מידע שגוי עלולה לגרום לחסימת החשבון.</li>
              <li>אתה אחראי לשמירה על אבטחת חשבונך ופרטי הגישה.</li>
              <li>עסק אחד רשאי לפתוח חשבון אחד בלבד אלא אם אושר אחרת.</li>
            </ul>
          </Section>

          <Section title="4. שימוש מותר">
            <p>אתה רשאי:</p>
            <ul>
              <li>להציג את שירותי עסקך בצורה נכונה ומדויקת.</li>
              <li>לתקשר עם לקוחות פוטנציאליים דרך הפלטפורמה.</li>
              <li>לנהל את פרופיל העסק, התמונות והמחירים שלך.</li>
            </ul>
          </Section>

          <Section title="5. שימוש אסור">
            <p>חל איסור מוחלט על:</p>
            <ul>
              <li>הצגת מידע שקרי, מטעה או מזיק.</li>
              <li>העלאת תוכן המפר זכויות יוצרים או סימנים מסחריים.</li>
              <li>שימוש בפלטפורמה לצרכי ספאם, הונאה או פגיעה בצדדים שלישיים.</li>
              <li>ניסיון לפרוץ, לשבש או לסרוק את מערכות הפלטפורמה.</li>
              <li>הכנסת קוד זדוני (וירוסים, סוסים טרויאניים, סקריפטים).</li>
              <li>גרידת (scraping) נתונים מהפלטפורמה ללא אישור בכתב.</li>
            </ul>
          </Section>

          <Section title="6. תוכן שהועלה">
            <p>
              בהעלאת תוכן, אתה מצהיר כי הינך הבעלים של הזכויות בו ומעניק לנו
              רישיון לא-בלעדי, חינם ועולמי להציגו, לשכפלו ולקדמו לצורכי הפלטפורמה.
              תוכן שמפר חוק, זכויות יוצרים או מוסר ייחסם ויוסר.
            </p>
          </Section>

          <Section title="7. מנויים ותשלומים">
            <ul>
              <li>מחירי המנויים מפורסמים בדף המחירים ועשויים להשתנות עם הודעה מוקדמת.</li>
              <li>החיוב מתבצע מדי חודש או שנה, בהתאם לסוג המנוי שנבחר.</li>
              <li>כל העסקאות מעובדות בצורה מאובטחת על-ידי Stripe Inc.</li>
              <li>ספקי פלאן חינמי אינם מחויבים, אך כפופים למגבלות פונקציונליות.</li>
            </ul>
          </Section>

          <Section title="8. ביטול והחזרים">
            <ul>
              <li>ביטול מנוי יכנס לתוקף בתום תקופת החיוב הנוכחית.</li>
              <li>לא יינתן החזר כספי עבור חלק מהתקופה שנרכשה.</li>
              <li>
                יוצא מן הכלל: במקרה של תקלה טכנית חמורה מצד הפלטפורמה,
                תבחן כל בקשת החזר לגופה.
              </li>
              <li>לבקשות ביטול: <a href={`mailto:${CONTACT_EMAIL}`} className="text-dusty-rose hover:underline">{CONTACT_EMAIL}</a></li>
            </ul>
          </Section>

          <Section title="9. קניין רוחני">
            <p>
              כל תוכן הפלטפורמה — לוגו, עיצוב, קוד, שמות מוצרים — הוא קניינה הרוחני
              הבלעדי של Wedding Vendor Portal. חל איסור על העתקה, שינוי או הפצה ללא אישור בכתב.
            </p>
          </Section>

          <Section title="10. הגבלת אחריות">
            <p>
              הפלטפורמה מסופקת &quot;כפי שהיא&quot; (AS IS). אנו לא אחראים לנזקים עקיפים,
              אובדן הכנסות או נזק עסקי הנובעים משימוש בפלטפורמה.
              אחריותנו הכוללת לא תעלה על סכום שילמת בשלושת החודשים שקדמו לאירוע.
            </p>
          </Section>

          <Section title="11. שינויים בתנאים">
            <p>
              אנו עשויים לעדכן תנאים אלה. שינויים מהותיים יפורסמו עם הודעה מוקדמת
              של 14 יום. המשך השימוש לאחר הודעה זו מהווה הסכמה לתנאים המעודכנים.
            </p>
          </Section>

          <Section title="12. הפסקת שירות">
            <p>
              אנו רשאים להשעות או לסיים חשבון שמפר את התנאים, לאחר הודעה מוקדמת
              (אלא אם ההפרה חמורה ומיידית).
            </p>
          </Section>

          <Section title="13. דין חל וסמכות שיפוטית">
            <p>
              תנאים אלה כפופים לדיני מדינת ישראל.
              כל מחלוקת תועבר לבורר מוסכם או לבית-משפט המוסמך במחוז תל אביב.
            </p>
          </Section>

          <Section title="14. יצירת קשר">
            <p>לשאלות משפטיות:</p>
            <div className="bg-cream-white rounded-xl p-4 border border-champagne/60 text-sm mt-3">
              <p>
                <span className="text-stone/60">אימייל: </span>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-dusty-rose hover:underline">{CONTACT_EMAIL}</a>
              </p>
              <p className="text-stone/60 text-xs mt-1">Wedding Vendor Portal, ישראל</p>
            </div>
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

function LegalStyles() {
  return (
    <style>{`
      .prose-legal ul { list-style: disc; padding-right: 1.25rem; margin: 0.5rem 0; }
      .prose-legal ul li { margin-bottom: 0.3rem; font-size: 0.875rem; color: rgb(107 95 90); }
      .prose-legal p { font-size: 0.875rem; }
      .prose-legal a { color: rgb(140 95 88); }
    `}</style>
  );
}
