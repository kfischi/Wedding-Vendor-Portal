import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "צילום חתונות",
  videography: "צילום וידאו",
  venue: "אולם אירועים",
  catering: "קייטרינג",
  flowers: "עיצוב פרחים",
  music: "מוזיקה חיה",
  dj: "DJ",
  makeup: "איפור כלה",
  dress: "שמלת כלה",
  suit: "חליפות חתן",
  cake: "עוגות חתונה",
  invitation: "הזמנות",
  transport: "הסעות",
  lighting: "תאורה",
  planning: "מתכנן חתונות",
  "wedding-dress-designers": "מעצבי שמלות כלה",
  "bridal-preparation": "התארגנות כלות",
  other: "שירותי חתונה",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 503 });

  let body: {
    category?: string;
    city?: string;
    businessName?: string;
    years?: string;
    uniqueness?: string;
    services?: string;
    achievement?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const categoryLabel = CATEGORY_LABELS[body.category ?? ""] ?? "שירותי חתונה";

  const prompt = `אתה קופירייטר מומחה לכתיבת פרופילים עסקיים לפורטל ספקי אירועים יוקרתי.
המטרה שלך היא לקחת תשובות גולמיות של ספק, ולכתוב מהן תיאור עסק (עד 150 מילים) שייכנס בדיוק לטופס ההרשמה באתר.

הטון והסגנון:
- מקצועי, חם, בגובה העיניים ואותנטי.
- אל תישמע כמו פרסומת זולה. שדר אמינות וביטחון.
- השתמש בפסקאות קצרות (2-3 משפטים לפסקה) כדי שהטקסט יהיה קריא ו"נושם".
- כתוב בגוף ראשון יחיד בלבד — "אני", לא "אנחנו".
- שמור על דקדוק מדויק, משפטים שלמים ולא קטועים.

מילים וביטויים שאסור לך להשתמש בהם:
- "ביומו המאושר בחייכם", "מגשימים לכם חלום", "שירות ללא פשרות"
- "מהפכני", "קסום", "בלתי נשכח", "מצוינות", "מחויבות", "מסע"
- "צרו קשר עכשיו!", "אל תהססו לפנות", "נשמח לעמוד לשירותכם"
במקום הקלישאות האלו, התמקד בערך האמיתי, בניסיון ובסגנון הייחודי של הספק.

מבנה התיאור הנדרש:
1. פתיח קצר: מי הספק ומה ההתמחות המרכזית שלו — לא להתחיל עם "אני עוסק ב-X כבר Y שנים".
2. הגישה / "אני מאמין": מה מיוחד בצורת העבודה שלו מול זוגות.
3. סגיר: משפט מסכם שמזמין את הזוגות ליצור קשר — ישיר ואנושי, לא נוסחתי.

התשובות של הספק:
- תחום: ${categoryLabel}
- עיר: ${body.city || "ישראל"}
- שנות ניסיון: ${body.years || "לא צוין"}
- מה מייחד אותו: ${body.uniqueness || "לא צוין"}
- שירותים / ציוד / סגנון: ${body.services || "לא צוין"}
${body.achievement ? `- עוד משהו: ${body.achievement}` : ""}

כתוב כעת את תיאור העסק. רק את הטקסט עצמו, ללא כותרות או הסברים.`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ description: text });
  } catch (err) {
    console.error("[ai-description]", err);
    return NextResponse.json({ error: "שגיאה ביצירת התיאור" }, { status: 500 });
  }
}
