import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

export type BlogCategory = string;

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: BlogCategory;
  author: string;
  date: string;
  readTime: string;
  content: string;
  isAiGenerated?: boolean;
}

export type BlogPostMeta = Omit<BlogPost, "content">;

function parseFrontmatter(slug: string): { meta: BlogPostMeta; content: string } | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const stats = readingTime(content);
  const readTime = (data.readTime as string | undefined) ?? `${Math.ceil(stats.minutes)} דקות`;

  const meta: BlogPostMeta = {
    slug,
    title:       data.title       as string,
    excerpt:     data.excerpt     as string,
    coverImage:  data.coverImage  as string,
    category:    data.category    as string,
    author:      data.author      as string,
    date:        data.date        as string,
    readTime,
  };

  return { meta, content };
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const result = parseFrontmatter(slug);
      return result?.meta ?? null;
    })
    .filter((p): p is BlogPostMeta => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  const result = parseFrontmatter(slug);
  if (!result) return null;
  return { ...result.meta, content: result.content };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  const cats = new Set(getAllPosts().map((p) => p.category));
  return Array.from(cats);
}

// ─── DB blog posts (AI-generated) ─────────────────────────────────────────────
// Lazy import to avoid edge runtime issues — only called from Node.js contexts

export async function getDbPosts(): Promise<BlogPostMeta[]> {
  try {
    const { db } = await import("@/lib/db/db");
    const { blogPosts } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));

    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      coverImage: r.coverImage ?? "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&q=80",
      category: r.category,
      author: r.author,
      date: (r.publishedAt ?? r.createdAt).toISOString().slice(0, 10),
      readTime: r.readingTimeMinutes ? `${r.readingTimeMinutes} דקות` : "5 דקות",
      isAiGenerated: r.isAiGenerated,
    }));
  } catch {
    return [];
  }
}

export async function getAllPostsMerged(): Promise<BlogPostMeta[]> {
  const [mdx, db] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getDbPosts(),
  ]);

  const mdxSlugs = new Set(mdx.map((p) => p.slug));
  const uniqueDb = db.filter((p) => !mdxSlugs.has(p.slug));

  return [...mdx, ...uniqueDb].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlugMerged(slug: string): Promise<BlogPost | null> {
  // Try MDX first
  const mdx = getPostBySlug(slug);
  if (mdx) return mdx;

  // Try DB
  try {
    const { db: dbClient } = await import("@/lib/db/db");
    const { blogPosts } = await import("@/lib/db/schema");
    const { eq, and } = await import("drizzle-orm");

    const [row] = await dbClient
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
      .limit(1);

    if (!row) return null;

    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.coverImage ?? "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&q=80",
      category: row.category,
      author: row.author,
      date: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
      readTime: row.readingTimeMinutes ? `${row.readingTimeMinutes} דקות` : "5 דקות",
      content: row.content,
      isAiGenerated: row.isAiGenerated,
    };
  } catch {
    return null;
  }
}
