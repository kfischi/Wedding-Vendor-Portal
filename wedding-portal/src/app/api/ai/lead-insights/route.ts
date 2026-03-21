/**
 * AI Lead Insights — analyzes vendor's leads and returns actionable insights.
 * GET /api/ai/lead-insights
 *
 * Protected: authenticated vendor session.
 * Returns structured insights: trends, conversion tips, best months, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { ANTHROPIC_API_KEY } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  let vendor;
  let vendorLeads;
  try {
    const [v] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = v ?? null;
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    vendorLeads = await db
      .select({
        status: leads.status,
        message: leads.message,
        eventDate: leads.eventDate,
        budget: leads.budget,
        createdAt: leads.createdAt,
        aiScore: leads.aiScore,
        aiScoreLabel: leads.aiScoreLabel,
      })
      .from(leads)
      .where(eq(leads.vendorId, vendor.id))
      .orderBy(desc(leads.createdAt))
      .limit(50);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!vendorLeads.length) {
    return NextResponse.json({
      ok: true,
      insights: {
        summary: "עדיין אין לידים לניתוח. שתף את הפרופיל שלך כדי להתחיל לקבל פניות!",
        tips: ["הוסף תמונות לגלריה", "מלא את כל פרטי הפרופיל", "שתף את הדף ברשתות החברתיות"],
        hotLeads: 0,
        conversionRate: 0,
      },
    });
  }

  // Prepare stats for Claude
  const total = vendorLeads.length;
  const hot = vendorLeads.filter((l) => l.aiScoreLabel === "hot").length;
  const warm = vendorLeads.filter((l) => l.aiScoreLabel === "warm").length;
  const cold = vendorLeads.filter((l) => l.aiScoreLabel === "cold").length;
  const closed = vendorLeads.filter((l) => l.status === "closed").length;
  const contacted = vendorLeads.filter((l) => l.status === "contacted" || l.status === "qualified").length;
  const unhandled = vendorLeads.filter((l) => l.status === "new").length;

  // Month distribution
  const monthDist: Record<string, number> = {};
  for (const l of vendorLeads) {
    const month = new Date(l.createdAt).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
    monthDist[month] = (monthDist[month] ?? 0) + 1;
  }
  const busyMonths = Object.entries(monthDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, c]) => `${m} (${c})`);

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `אתה יועץ עסקי לספקי חתונות. נתח את הנתונים הבאים וספק תובנות פעילות.

**ספק:** ${vendor.businessName} | ${vendor.category} | ${vendor.city}
**תוכנית:** ${vendor.plan}

**סטטיסטיקות לידים (${total} לידים אחרונים):**
- 🔥 חמים (Hot): ${hot}
- ☀️ פושרים (Warm): ${warm}
- ❄️ קרים (Cold): ${cold}
- טרם טופלו: ${unhandled}
- בטיפול: ${contacted}
- סגורים: ${closed}
- שיעור המרה משוער: ${total > 0 ? Math.round((closed / total) * 100) : 0}%
- חודשים עמוסים: ${busyMonths.join(", ") || "לא מספיק נתונים"}

**החזר JSON בלבד:**
{
  "summary": "סיכום קצר של 2-3 משפטים בעברית",
  "conversionRate": <מספר 0-100>,
  "hotLeads": ${hot},
  "tips": ["טיפ 1", "טיפ 2", "טיפ 3"],
  "urgentAction": "פעולה אחת דחופה שצריך לעשות עכשיו",
  "trend": "positive|neutral|negative"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Parse failed");

    const insights = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ok: true, insights, stats: { total, hot, warm, cold, unhandled, closed } });
  } catch (err) {
    console.error("[lead-insights] error:", err);
    return NextResponse.json({ error: "שגיאה בניתוח" }, { status: 500 });
  }
}
