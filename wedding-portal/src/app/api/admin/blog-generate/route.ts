import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/db";
import { blogPosts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllPosts } from "@/lib/blog";
import { ANTHROPIC_API_KEY, N8N_API_KEY } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 120;

const BLOG_TOPICS = [
  { topic: "10 דברים שצריך לדעת לפני שבוחרים רב לחתונה", category: "תכנון" },
  { topic: "איך לבחור נעליים לחתונה שלא יכאבו", category: "אופנה" },
  { topic: "מדריך להזמנות חתונה דיגיטליות vs מודפסות", category: "עיצוב" },
  { topic: "חתונה קטנה ואינטימית — יתרונות וחסרונות", category: "תכנון" },
  { topic: "ירח דבש בישראל — המדריך המלא", category: "טיולים" },
  { topic: "כיצד לנהל קשרי משפחה קשים בתכנון החתונה", category: "טיפים" },
  { topic: "עוגת חתונה — טרנדים, טעמים ואיך בוחרים נכון", category: "אוכל" },
  { topic: "מה כוללת חבילת צלם חתונות — ומה לא", category: "צילום" },
  { topic: "תאורה בחתונה — למה זה הדבר שכולם מזלזלים בו", category: "עיצוב" },
  { topic: "איך כותבים נאום מושלם לחתונה", category: "טיפים" },
  { topic: "כיצד לחסוך בתקציב החתונה מבלי שיורגש", category: "תקציב" },
  { topic: "הסעות לחתונה — מה צריך לדעת", category: "לוגיסטיקה" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 60);
}

function isAuthorized(request: NextRequest): boolean {
  // Accept N8N API key in Authorization header
  const auth = request.headers.get("authorization");
  if (auth && N8N_API_KEY && auth === `Bearer ${N8N_API_KEY}`) return true;

  // Accept ADMIN_SECRET in header for manual triggers
  const secret = request.headers.get("x-admin-secret");
  if (secret && secret === process.env.PING_SECRET) return true;

  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  // Get existing titles to avoid duplicates
  const mdxTitles = getAllPosts().map((p) => p.title);
  let dbTitles: string[] = [];
  try {
    const rows = await db.select({ title: blogPosts.title }).from(blogPosts);
    dbTitles = rows.map((r) => r.title);
  } catch {}

  const existingTitles = new Set([...mdxTitles, ...dbTitles]);

  // Pick a topic not already covered
  const availableTopics = BLOG_TOPICS.filter((t) => !existingTitles.has(t.topic));
  if (availableTopics.length === 0) {
    return NextResponse.json({ message: "All topics already covered" }, { status: 200 });
  }

  // Allow explicit topic override from request body
  let chosenTopic: { topic: string; category: string };
  try {
    const body = await request.json() as { topic?: string; category?: string };
    if (body.topic) {
      chosenTopic = { topic: body.topic, category: body.category ?? "כללי" };
    } else {
      chosenTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)]!;
    }
  } catch {
    chosenTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)]!;
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const systemPrompt = `אתה כותב תוכן מקצועי לבלוג חתונות ישראלי בשם WeddingPro.
אתה כותב בעברית שוטפת, ידידותית ומקצועית.
הכתיבה שלך ספציפית לשוק הישראלי — מחירים בשקלים, מנהגים ישראליים, ספקים ישראליים.
התוכן מועיל, אמיתי, ומבוסס על ניסיון אמיתי.`;

  const userPrompt = `כתוב פוסט בלוג מלא בעברית בנושא: "${chosenTopic.topic}"

הפוסט צריך לכלול:
- כותרת ראשית (H1) מושכת
- הקדמה מעניינת (פסקה אחת)
- לפחות 4–6 כותרות משנה (H2) עם תוכן מפורט
- טיפים פרקטיים ספציפיים לישראל
- מחירים ממוצעים בשקלים (כשרלוונטי)
- סיכום ממליץ
- סגנון: ידידותי, מקצועי, 800–1200 מילים

החזר ONLY את תוכן ה-Markdown, ללא הסברים נוספים.`;

  let content: string;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const block = message.content[0];
    if (!block || block.type !== "text") {
      return NextResponse.json({ error: "No content generated" }, { status: 500 });
    }
    content = block.text;
  } catch (err) {
    console.error("[blog-generate] Claude error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }

  // Extract excerpt from first paragraph
  const firstParagraph = content
    .split("\n")
    .find((line) => line.trim() && !line.startsWith("#")) ?? "";
  const excerpt = firstParagraph.slice(0, 160);

  const slug = slugify(chosenTopic.topic) + "-" + Date.now().toString(36);
  const wordCount = content.split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Cover images by category
  const COVER_IMAGES: Record<string, string> = {
    "תכנון": "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80&fit=crop",
    "צילום": "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80&fit=crop",
    "עיצוב": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80&fit=crop",
    "אוכל": "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80&fit=crop",
    "אופנה": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&fit=crop",
    "תקציב": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&fit=crop",
    "טיפים": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80&fit=crop",
    "default": "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&q=80&fit=crop",
  };

  const coverImage = COVER_IMAGES[chosenTopic.category] ?? COVER_IMAGES.default;

  try {
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        id: crypto.randomUUID(),
        slug,
        title: chosenTopic.topic,
        excerpt: excerpt || chosenTopic.topic,
        content,
        coverImage,
        author: "צוות WeddingPro",
        category: chosenTopic.category,
        tags: [],
        status: "published",
        isAiGenerated: true,
        publishedAt: new Date(),
        readingTimeMinutes: readingMinutes,
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug });

    return NextResponse.json({
      ok: true,
      slug,
      title: chosenTopic.topic,
      url: `/blog/${slug}`,
      postId: newPost?.id,
    });
  } catch (err) {
    console.error("[blog-generate] DB error:", err);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}

// GET — returns list of existing blog topics (for N8N to check before generating)
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mdxTitles = getAllPosts().map((p) => ({ title: p.title, source: "mdx" }));
  let dbTitles: { title: string; source: string }[] = [];
  try {
    const rows = await db.select({ title: blogPosts.title, slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.status, "published"));
    dbTitles = rows.map((r) => ({ title: r.title, source: "db" }));
  } catch {}

  return NextResponse.json({
    total: mdxTitles.length + dbTitles.length,
    posts: [...mdxTitles, ...dbTitles],
    availableTopics: BLOG_TOPICS.filter(
      (t) => ![...mdxTitles, ...dbTitles].some((p) => p.title === t.topic)
    ).length,
  });
}
