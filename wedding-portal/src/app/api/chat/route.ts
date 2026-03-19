import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia } from "@/lib/db/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { ANTHROPIC_API_KEY, NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_vendors",
    description:
      "חפש ספקי חתונות לפי קטגוריה, עיר ותקציב. השתמש בכלי זה כאשר המשתמש מבקש המלצות על ספקים.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description:
            "קטגוריית הספק: photography, videography, venue, catering, flowers, music, dj, makeup, dress, suit, cake, invitation, transport, lighting, planning, other",
        },
        city: {
          type: "string",
          description: "שם העיר בעברית (לדוגמה: תל אביב, ירושלים, חיפה)",
        },
        limit: {
          type: "number",
          description: "מספר תוצאות מקסימלי (ברירת מחדל: 4)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_vendor_details",
    description: "קבל פרטים מלאים על ספק ספציפי לפי ה-slug שלו.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "ה-slug הייחודי של הספק" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_plans_info",
    description:
      "קבל מידע על תוכניות המחיר של WeddingPro לספקים. השתמש כאשר ספק שואל על הצטרפות.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────

type SearchInput = { category?: string; city?: string; limit?: number };
type DetailsInput = { slug: string };

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name === "search_vendors") {
    const { category, city, limit = 4 } = input as SearchInput;
    const conditions = [eq(vendors.status, "active")];
    if (category) conditions.push(eq(vendors.category, category as never));
    if (city) {
      conditions.push(
        or(
          ilike(vendors.city, `%${city}%`),
          ilike(vendors.region, `%${city}%`)
        )!
      );
    }
    const results = await db
      .select({
        id: vendors.id,
        slug: vendors.slug,
        businessName: vendors.businessName,
        category: vendors.category,
        city: vendors.city,
        shortDescription: vendors.shortDescription,
        rating: vendors.rating,
        reviewCount: vendors.reviewCount,
        plan: vendors.plan,
        coverImage: vendors.coverImage,
        phone: vendors.phone,
        whatsapp: vendors.whatsapp,
      })
      .from(vendors)
      .where(and(...conditions))
      .orderBy(sql`${vendors.plan} = 'premium' desc, ${vendors.rating} desc`)
      .limit(limit);

    if (!results.length) {
      return city
        ? `לא נמצאו ספקים ב${city} בקטגוריה זו. אנסה חיפוש רחב יותר?`
        : "לא נמצאו ספקים התואמים את החיפוש.";
    }
    return JSON.stringify(
      results.map((v) => ({
        ...v,
        url: `${NEXT_PUBLIC_APP_URL}/vendors/${v.slug}`,
      }))
    );
  }

  if (name === "get_vendor_details") {
    const { slug } = input as DetailsInput;
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.slug, slug), eq(vendors.status, "active")))
      .limit(1);
    if (!vendor) return "הספק לא נמצא.";

    const media = await db
      .select({ url: vendorMedia.url, altText: vendorMedia.altText })
      .from(vendorMedia)
      .where(eq(vendorMedia.vendorId, vendor.id))
      .limit(6);

    return JSON.stringify({
      ...vendor,
      media,
      url: `${NEXT_PUBLIC_APP_URL}/vendors/${vendor.slug}`,
    });
  }

  if (name === "get_plans_info") {
    return JSON.stringify({
      plans: [
        {
          name: "סטנדרט",
          price: "₪149/חודש",
          features: [
            "דף ספק מלא עם גלריה",
            "עד 50 תמונות",
            "קבלת לידים ישירה",
            "כפתור WhatsApp",
            "אנליטיקס בסיסי",
          ],
        },
        {
          name: "פרמיום",
          price: "₪349/חודש",
          features: [
            "כל מה שב-סטנדרט +",
            "תמונות ווידאו ללא הגבלה",
            "מיקום מועדף בחיפוש",
            "סמל 'מומלץ'",
            "אנליטיקס מתקדם",
            "תמיכה עדיפותית",
          ],
        },
        {
          name: "ניסיון חינמי",
          price: "3 חודשים חינם",
          features: [
            "גישה לכל תכונות הפרמיום",
            "ללא כרטיס אשראי",
            "הגדרה בפחות מ-10 דקות",
          ],
        },
      ],
      join_url: `${NEXT_PUBLIC_APP_URL}/join`,
    });
  }

  return "כלי לא מוכר.";
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `אתה עוזר AI חכם של WeddingPro — הפלטפורמה המובילה לחתונות בישראל.

**תפקידים:**
1. **לזוגות**: עזור לאתר ספקי חתונות מושלמים — צלמים, אולמות, קייטרינג, פרחים, מוסיקה ועוד.
2. **לספקים**: הדרך ספקים חדשים להצטרף לפלטפורמה ובחר להם את התוכנית המתאימה.

**עקרונות:**
- כתוב תמיד בעברית, בסגנון חם וידידותי.
- שאל שאלות ממוקדות לפני המלצה: קטגוריה, עיר, תאריך, תקציב, סגנון מועדף.
- הצג תוצאות ספציפיות וממוקדות (לא יותר מ-4 ספקים בפעם אחת).
- כאשר ספק שואל על הצטרפות: שאל על סוג העסק, גודלו, וצרכיו — ואז המלץ על תוכנית.
- הימנע מתשובות כלליות — תמיד הכוון לפעולה ספציפית.
- לאחר הצגת ספקים, שאל אם רוצים לסנן יותר או ליצור קשר עם ספק מסוים.

**שאלות פתיחה טיפוסיות:**
- "מחפשים ספק לחתונה? איזה סוג?"
- "באיזה אזור?"
- "מה התאריך המשוער?"
- "יש תקציב בראש?"`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const write = (data: string) =>
      writer.write(encoder.encode(`data: ${data}\n\n`));

    (async () => {
      try {
        let currentMessages: Anthropic.MessageParam[] = messages;

        // Agentic loop (tool use)
        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: currentMessages,
            stream: false,
          });

          // Stream text content
          for (const block of response.content) {
            if (block.type === "text") {
              // Stream word by word for effect
              const words = block.text.split(" ");
              for (const word of words) {
                write(JSON.stringify({ type: "text", text: word + " " }));
              }
            }
          }

          if (response.stop_reason === "tool_use") {
            const toolUseBlocks = response.content.filter(
              (b) => b.type === "tool_use"
            );
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolBlock of toolUseBlocks) {
              if (toolBlock.type !== "tool_use") continue;
              write(
                JSON.stringify({
                  type: "tool_start",
                  tool: toolBlock.name,
                })
              );
              const result = await executeTool(
                toolBlock.name,
                toolBlock.input as Record<string, unknown>
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: result,
              });
              // Send structured vendor data
              if (toolBlock.name === "search_vendors") {
                try {
                  const parsed = JSON.parse(result);
                  if (Array.isArray(parsed)) {
                    write(
                      JSON.stringify({ type: "vendors", vendors: parsed })
                    );
                  }
                } catch {}
              }
              if (toolBlock.name === "get_plans_info") {
                try {
                  const parsed = JSON.parse(result);
                  write(JSON.stringify({ type: "plans", data: parsed }));
                } catch {}
              }
            }

            currentMessages = [
              ...currentMessages,
              { role: "assistant", content: response.content },
              { role: "user", content: toolResults },
            ];
            continue;
          }

          break;
        }

        write(JSON.stringify({ type: "done" }));
      } catch (err) {
        write(
          JSON.stringify({
            type: "error",
            message: err instanceof Error ? err.message : "שגיאה בשרת",
          })
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json({ error: "שגיאה בעיבוד הבקשה" }, { status: 400 });
  }
}
