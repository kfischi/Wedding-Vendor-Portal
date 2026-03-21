/**
 * AI Lead Scoring — evaluates lead quality using Claude.
 *
 * Runs asynchronously (fire-and-forget) after a lead is saved.
 * Updates the lead row with ai_score (0-100), ai_score_label, ai_score_reason.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export type ScoreLabel = "hot" | "warm" | "cold";

interface LeadData {
  id: string;
  name: string;
  message: string;
  phone?: string | null;
  eventDate?: Date | null;
  budget?: number | null;
  vendorCategory: string;
}

interface ScoreResult {
  score: number;          // 0–100
  label: ScoreLabel;
  reason: string;
}

export async function scoreLead(lead: LeadData): Promise<ScoreResult | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const daysUntilEvent = lead.eventDate
    ? Math.ceil((lead.eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const prompt = `אתה מומחה מכירות לפלטפורמת ספקי חתונות. דרג ליד זה.

**פרטי הליד:**
- שם: ${lead.name}
- טלפון: ${lead.phone ? "סופק" : "לא סופק"}
- תאריך אירוע: ${daysUntilEvent != null ? `${daysUntilEvent} ימים מהיום` : "לא צוין"}
- תקציב: ${lead.budget ? `₪${lead.budget.toLocaleString()}` : "לא צוין"}
- קטגוריה: ${lead.vendorCategory}
- הודעה: "${lead.message}"

**החזר JSON בלבד (ללא טקסט נוסף):**
{
  "score": <מספר 0-100>,
  "label": "<hot|warm|cold>",
  "reason": "<משפט קצר בעברית מדוע>"
}

**כללי ניקוד:**
- hot (75-100): תאריך קרוב + פרטים ספציפיים + טלפון
- warm (40-74): יש כוונה ברורה אך חסרים פרטים
- cold (0-39): הודעה כללית / ללא מועד / ללא פרטי קשר`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]) as ScoreResult;
    if (typeof result.score !== "number") return null;

    return {
      score: Math.max(0, Math.min(100, result.score)),
      label: (["hot", "warm", "cold"].includes(result.label) ? result.label : "cold") as ScoreLabel,
      reason: result.reason ?? "",
    };
  } catch (err) {
    console.error("[score-lead] Claude error:", err);
    return null;
  }
}

/**
 * Score a lead and persist the result to DB.
 * Designed to be called with void (fire-and-forget).
 */
export async function scoreAndSaveLead(lead: LeadData): Promise<void> {
  const result = await scoreLead(lead);
  if (!result) return;

  try {
    await db
      .update(leads)
      .set({
        aiScore: result.score,
        aiScoreLabel: result.label,
        aiScoreReason: result.reason,
      })
      .where(eq(leads.id, lead.id));
  } catch (err) {
    console.error("[score-lead] DB update error:", err);
  }
}
