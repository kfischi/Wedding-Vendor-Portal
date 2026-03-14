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
}

export interface BlogPostMeta extends Omit<BlogPost, "content"> {}

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
