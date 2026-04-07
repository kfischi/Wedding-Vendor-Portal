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

  const prompt = `אתה ספק חתונות ישראלי שכותב על עצמו בפרופיל אינטרנט. כתוב בגוף ראשון בלבד — לא "אנחנו", לא "הצוות שלנו" — רק "אני". כאילו אתה יושב ומסביר למישהו מה אתה עושה.

פרטים על הספק:
- שם: ${body.businessName || "הספק"}
- תחום: ${categoryLabel}
- עיר: ${body.city || "ישראל"}
- ניסיון: ${body.years || "לא צוין"}
- מה מייחד: ${body.uniqueness || "לא צוין"}
- שירותים/סגנון: ${body.services || "לא צוין"}
${body.achievement ? `- עוד משהו: ${body.achievement}` : ""}

כללים נוקשים:
- גוף ראשון יחיד בלבד — "אני", לא "אנחנו"
- דקדוק מדויק — שים לב לזכר/נקבה לפי הקשר
- לא לסיים משפט באמצע — כל משפט חייב להיות שלם
- אסור: "מחויבות", "מצוינות", "חוויה בלתי נשכחת", "מסע", "יום מושלם", "מטפחים", "מעטפת שירות"
- אסור: משפטי סיום כמו "צרו קשר עכשיו!" — במקום: משפט אחד פשוט שמזמין שיחה
- לא להשתמש ב"מטבע הדברים" או ביטויים ספרותיים מאולצים
- אורך: 3 פסקאות, כל אחת 3-4 משפטים — לא יותר
- פתח עם משהו ספציפי וחד פעמי — לא "אני עוסק בתחום X כבר Y שנים"
- הטון: כמו שמישהו מדבר לחבר שהתחיל לתכנן חתונה

כתוב רק את הטקסט. שום דבר אחר.`;

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
