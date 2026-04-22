/**
 * AI Content Generator — creates vendor description & tagline using Claude.
 * POST /api/ai/generate-description
 *
 * Protected: requires authenticated vendor session.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  businessName: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  city: z.string().min(1).max(50),
  years: z.number().min(0).max(50).optional(),
  style: z.string().max(200).optional(),
  specialties: z.string().max(500).optional(),
  type: z.enum(["description", "tagline", "both"]).default("both"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify vendor belongs to user
  try {
    const [vendor] = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { businessName, category, city, years, style, specialties, type } = parsed.data;

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `אתה כותב תוכן שיווקי לספקי חתונות בישראל. כתוב בעברית, בסגנון חמים, מקצועי ואנושי.

**פרטי הספק:**
- שם עסק: ${businessName}
- קטגוריה: ${category}
- עיר: ${city}
${years != null ? `- שנות ניסיון: ${years}` : ""}
${style ? `- סגנון / גישה: ${style}` : ""}
${specialties ? `- התמחויות: ${specialties}` : ""}

${type === "description" || type === "both" ? `**תיאור עסק (150-200 מילים):**
כתוב תיאור מרגש שמדבר ישירות לזוגות. פתח עם משפט שמושך תשומת לב. כלול:
- מה הופך את הספק לייחודי
- הגישה/פילוסופיה שלהם
- מה הלקוחות יקבלו
- סיום עם call-to-action עדין
` : ""}

${type === "tagline" || type === "both" ? `**סלוגן קצר (עד 10 מילים):**
משפט קצר, מרגש, שמשקף את זהות הספק.
` : ""}

**החזר JSON בלבד:**
{
  ${type === "description" || type === "both" ? `"description": "...",` : ""}
  ${type === "tagline" || type === "both" ? `"tagline": "..."` : ""}
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Parse error" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[generate-description] error:", err);
    return NextResponse.json({ error: "שגיאה ביצירת התוכן" }, { status: 500 });
  }
}
