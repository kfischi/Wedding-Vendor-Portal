/**
 * AI Blog Post Generator — SEO-optimized Hebrew content for wedding industry
 * Uses Claude to create high-quality, original blog posts that rank on Google.
 */

import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY } from "@/lib/env";

const WEDDING_TOPICS = [
  { category: "photography", topic: "צילום חתונה" },
  { category: "venue", topic: "אולמות אירועים" },
  { category: "makeup", topic: "איפור כלה" },
  { category: "flowers", topic: "פרחים וקישוטים" },
  { category: "music", topic: "מוזיקה לחתונה" },
  { category: "cake", topic: "עוגות חתונה" },
  { category: "planning", topic: "תכנון חתונה" },
  { category: "dress", topic: "שמלת כלה" },
  { category: "catering", topic: "קייטרינג" },
  { category: "budget", topic: "חתונה בתקציב" },
  { category: "trends", topic: "טרנדים בחתונות" },
  { category: "checklist", topic: "רשימות תיוג" },
  { category: "tips", topic: "טיפים לחתן וכלה" },
  { category: "venues_by_city", topic: "אולמות לפי עיר" },
  { category: "timeline", topic: "לוח זמנים לחתונה" },
];

export interface BlogPostIdea {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  targetKeyword: string;
}

export interface GeneratedBlogPost {
  idea: BlogPostIdea;
  content: string;
  readingTimeMinutes: number;
}

// Generate 5 blog post ideas based on current trends and gaps
export async function generateBlogIdeas(
  existingTitles: string[] = [],
  count = 5
): Promise<BlogPostIdea[]> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const avoidList =
    existingTitles.length > 0
      ? `\nאל תיצור מאמרים על נושאים שכבר קיימים:\n${existingTitles.slice(0, 20).join("\n")}`
      : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `אתה מומחה SEO ותוכן לתחום חתונות בישראל.

צור ${count} רעיונות למאמרי בלוג שיושבים בגוגל ישראל.

דרישות:
- כתיבה בעברית מושלמת
- מכוונים לאנשים שמחפשים מידע על חתונות בישראל
- keyword intent ברור (informational, commercial, או local)
- כותרות שמושכות קליקים
- נושאים: צילום, וידאו, קייטרינג, אולמות, איפור, פרחים, מוסיקה, עוגות, שמלות, תכנון, תקציב${avoidList}

החזר JSON בלבד (מערך):
[
  {
    "title": "כותרת המאמר בעברית",
    "slug": "slug-in-english-kebab-case",
    "excerpt": "תקציר 1-2 משפטים",
    "category": "photography|venue|makeup|flowers|music|cake|planning|dress|catering|budget|trends|tips",
    "tags": ["תג1", "תג2", "תג3"],
    "seoTitle": "כותרת SEO (עד 60 תווים)",
    "seoDescription": "תיאור meta (עד 155 תווים)",
    "targetKeyword": "מילת מפתח ראשית"
  }
]`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned) as BlogPostIdea[];
}

// Generate full blog post content (1500-2500 words, Hebrew, SEO-optimized)
export async function generateBlogContent(
  idea: BlogPostIdea
): Promise<GeneratedBlogPost> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `כתוב מאמר בלוג מקיף בעברית על הנושא הבא לפורטל חתונות ישראלי.

כותרת: ${idea.title}
מילת מפתח: ${idea.targetKeyword}
קטגוריה: ${idea.category}
תגיות: ${idea.tags.join(", ")}

דרישות:
- 1500-2500 מילים
- פורמט Markdown עם כותרות H2 ו-H3
- כלול את מילת המפתח הראשית בפסקה הראשונה ובכותרת H2 אחת
- הוסף טיפים מעשיים ורשימות
- כתוב בגוף שני (אתה/את)
- הוסף קריאה לפעולה בסוף (לחיפוש ספקים בפורטל)
- כתיבה טבעית, לא שיווקית מדי
- כלול שאלות נפוצות (FAQ) בסוף
- אל תכלול תמונות (זה טקסט בלבד)

פתח ישירות עם תוכן המאמר (ללא כותרת — הכותרת תתווסף בנפרד).`,
      },
    ],
  });

  const content =
    response.content[0].type === "text" ? response.content[0].text : "";
  const wordCount = content.split(/\s+/).length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  return { idea, content, readingTimeMinutes };
}

// Pick a random topic for auto-generation
export function pickRandomTopic(): string {
  const topic = WEDDING_TOPICS[Math.floor(Math.random() * WEDDING_TOPICS.length)];
  return topic.topic;
}
