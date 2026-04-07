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

  const prompt = `אתה כותב תוכן שיווקי מקצועי בעברית לספקי חתונות בישראל.

כתוב תיאור עסקי מקצועי ושיווקי עבור ספק הבא:
- שם העסק: ${body.businessName || "הספק"}
- תחום: ${categoryLabel}
- עיר: ${body.city || "ישראל"}
- שנות ניסיון: ${body.years || "לא צוין"}
- מה מייחד אותם: ${body.uniqueness || "לא צוין"}
- שירותים/ציוד/סגנון: ${body.services || "לא צוין"}
${body.achievement ? `- הישג/סיפור מיוחד: ${body.achievement}` : ""}

הנחיות לכתיבה:
- כתוב בעברית תקינה ושיווקית, בגוף ראשון (אני/אנחנו)
- אורך: 150–220 מילה
- פתיחה חזקה שמושכת תשומת לב
- ציין את הניסיון, הסגנון הייחודי, והערך ללקוח
- סיים עם משפט שמזמין פנייה
- אל תשתמש בכותרות או bullet points — טקסט רץ בלבד
- אל תכתוב שם העסק בתחילת הפסקה
- הטון: חם, מקצועי, אמין

כתוב רק את הטקסט עצמו, ללא הסברים נוספים.`;

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
