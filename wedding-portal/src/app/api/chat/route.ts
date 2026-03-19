import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia, reviews } from "@/lib/db/schema";
import { eq, and, ilike, or, sql, gte, lte } from "drizzle-orm";
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
        budget_min: {
          type: "number",
          description: "תקציב מינימלי בשקלים",
        },
        budget_max: {
          type: "number",
          description: "תקציב מקסימלי בשקלים",
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
    name: "get_vendor_reviews",
    description: "קבל ביקורות של ספק ספציפי. השתמש כאשר המשתמש רוצה לדעת מה אומרים על ספק.",
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
  {
    name: "get_checklist",
    description:
      "קבל רשימת תיוג לתכנון חתונה לפי שלבים. השתמש כאשר זוג מחפש עזרה בתכנון כללי.",
    input_schema: {
      type: "object" as const,
      properties: {
        months_until_wedding: {
          type: "number",
          description: "כמה חודשים עד החתונה",
        },
      },
      required: [],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────

type SearchInput = { category?: string; city?: string; budget_min?: number; budget_max?: number; limit?: number };
type DetailsInput = { slug: string };
type ChecklistInput = { months_until_wedding?: number };

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  if (name === "search_vendors") {
    const { category, city, budget_min, budget_max, limit = 4 } = input as SearchInput;
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
      .orderBy(sql`${vendors.plan} = 'premium' desc, ${vendors.rating} desc nulls last`)
      .limit(limit);

    if (!results.length) {
      return city
        ? `לא נמצאו ספקים ב${city} בקטגוריה זו. אנסה חיפוש רחב יותר?`
        : "לא נמצאו ספקים התואמים את החיפוש.";
    }

    // Add budget context if specified
    const note =
      budget_min || budget_max
        ? `\n\n💡 הערה: המחירים הספציפיים אינם קיימים ב-API — צור קשר עם הספק לקבלת מחיר.`
        : "";

    return (
      JSON.stringify(
        results.map((v) => ({
          ...v,
          url: `${NEXT_PUBLIC_APP_URL}/vendors/${v.slug}`,
        }))
      ) + note
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
      .select({ url: vendorMedia.url, altText: vendorMedia.altText, type: vendorMedia.type })
      .from(vendorMedia)
      .where(eq(vendorMedia.vendorId, vendor.id))
      .limit(8);

    const reviewCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(and(eq(reviews.vendorId, vendor.id), eq(reviews.isPublished, true)));

    return JSON.stringify({
      ...vendor,
      media,
      publishedReviews: Number(reviewCount[0]?.count ?? 0),
      url: `${NEXT_PUBLIC_APP_URL}/vendors/${vendor.slug}`,
    });
  }

  if (name === "get_vendor_reviews") {
    const { slug } = input as DetailsInput;
    const [vendor] = await db
      .select({ id: vendors.id, businessName: vendors.businessName, rating: vendors.rating })
      .from(vendors)
      .where(and(eq(vendors.slug, slug), eq(vendors.status, "active")))
      .limit(1);
    if (!vendor) return "הספק לא נמצא.";

    const vendorReviews = await db
      .select({
        authorName: reviews.authorName,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        isVerified: reviews.isVerified,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.vendorId, vendor.id),
          eq(reviews.isPublished, true)
        )
      )
      .orderBy(sql`${reviews.createdAt} desc`)
      .limit(5);

    if (!vendorReviews.length) return `אין עדיין ביקורות פורסמו עבור ${vendor.businessName}.`;

    return JSON.stringify({
      vendorName: vendor.businessName,
      averageRating: vendor.rating,
      reviews: vendorReviews.map((r) => ({
        author: r.authorName,
        rating: r.rating,
        title: r.title,
        excerpt: r.body?.slice(0, 200),
        verified: r.isVerified,
        date: r.createdAt?.toLocaleDateString("he-IL"),
      })),
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
            "וידאו הירו בדף הספק",
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

  if (name === "get_checklist") {
    const { months_until_wedding } = input as ChecklistInput;
    const months = months_until_wedding ?? 12;

    const allTasks = [
      { milestone: "12+ חודשים לפני", tasks: ["קביעת תאריך", "בחירת אולם / מיקום", "צלם וידאו", "קייטרינג"] },
      { milestone: "9-12 חודשים לפני", tasks: ["בחירת שמלת כלה", "DJ / להקה חיה", "עיצוב פרחים", "הזמנות עיצוב"] },
      { milestone: "6-9 חודשים לפני", tasks: ["איפור ושיער", "עוגת חתונה", "הסעות אורחים", "חלוקת תפקידים"] },
      { milestone: "3-6 חודשים לפני", tasks: ["שליחת הזמנות", "תיאום לו\"ז יום החתונה", "חזרה כללית", "רשימת שירים"] },
      { milestone: "1-3 חודשים לפני", tasks: ["אישורי הגעה", "ארגון מושבים", "ביטוח חתונה", "ניסיון תסרוקת"] },
    ];

    // Filter relevant milestones based on time
    const relevant = allTasks.filter((_, i) => {
      const thresholds = [12, 9, 6, 3, 1];
      return months <= (thresholds[i] ?? 12);
    });

    return JSON.stringify({
      months_until_wedding: months,
      checklist: relevant.length ? relevant : allTasks,
      tip: "מומלץ לפתוח חשבון WeddingPro כדי לחפש ספקים לפי קטגוריה ועיר!",
    });
  }

  return "כלי לא מוכר.";
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `אתה עוזר AI חכם של WeddingPro — הפלטפורמה המובילה לחתונות בישראל.

**תפקידים:**
1. **לזוגות**: עזור לאתר ספקי חתונות מושלמים — צלמים, אולמות, קייטרינג, פרחים, מוסיקה ועוד.
2. **לספקים**: הדרך ספקים חדשים להצטרף לפלטפורמה ובחר להם את התוכנית המתאימה.
3. **תכנון כללי**: ספק רשימות תיוג, עצות, ותזמונים לתכנון חתונה.

**עקרונות:**
- כתוב תמיד בעברית, בסגנון חם וידידותי.
- שאל שאלות ממוקדות לפני המלצה: קטגוריה, עיר, תאריך, תקציב, סגנון מועדף.
- הצג תוצאות ספציפיות וממוקדות (לא יותר מ-4 ספקים בפעם אחת).
- כאשר ספק שואל על הצטרפות: שאל על סוג העסק, גודלו, וצרכיו — ואז המלץ על תוכנית.
- הימנע מתשובות כלליות — תמיד הכוון לפעולה ספציפית.
- לאחר הצגת ספקים, שאל אם רוצים לסנן יותר, לראות ביקורות, או ליצור קשר.
- אם שואלים על מחירים ספציפיים, הסבר שיש לפנות ישירות לספק.
- אם שואלים על תכנון כללי, הציע להשתמש ב-get_checklist.

**כלים זמינים:**
- search_vendors: חפש ספקים לפי קטגוריה/עיר/תקציב
- get_vendor_details: פרטים מלאים על ספק ספציפי
- get_vendor_reviews: קרא ביקורות על ספק
- get_plans_info: מחירי המנויים שלנו
- get_checklist: רשימת תיוג לתכנון חתונה`;

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

        // Agentic loop (multi-turn tool use)
        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: currentMessages,
            stream: false,
          });

          // Stream text content word-by-word for effect
          for (const block of response.content) {
            if (block.type === "text") {
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
              write(JSON.stringify({ type: "tool_start", tool: toolBlock.name }));

              const result = await executeTool(
                toolBlock.name,
                toolBlock.input as Record<string, unknown>
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: result,
              });

              // Send structured data to client
              if (toolBlock.name === "search_vendors") {
                try {
                  const text = result.split("\n\n")[0]; // Strip note if any
                  const parsed = JSON.parse(text);
                  if (Array.isArray(parsed)) {
                    write(JSON.stringify({ type: "vendors", vendors: parsed }));
                  }
                } catch {}
              }
              if (toolBlock.name === "get_plans_info") {
                try {
                  const parsed = JSON.parse(result);
                  write(JSON.stringify({ type: "plans", data: parsed }));
                } catch {}
              }
              if (toolBlock.name === "get_checklist") {
                try {
                  const parsed = JSON.parse(result);
                  write(JSON.stringify({ type: "checklist", data: parsed }));
                } catch {}
              }
              if (toolBlock.name === "get_vendor_reviews") {
                try {
                  const parsed = JSON.parse(result);
                  if (parsed.reviews) {
                    write(JSON.stringify({ type: "reviews", data: parsed }));
                  }
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
