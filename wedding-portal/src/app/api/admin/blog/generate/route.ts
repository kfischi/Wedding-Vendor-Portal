import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { blogPosts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import {
  generateBlogIdeas,
  generateBlogContent,
  type BlogPostIdea,
} from "@/lib/ai/generate-blog-post";
import { n8nBlogPublished } from "@/lib/n8n";
import { NEXT_PUBLIC_APP_URL } from "@/lib/env";

export const maxDuration = 120; // 2 min for AI generation

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { action: "ideas" | "generate"; idea?: BlogPostIdea; publish?: boolean };

  if (body.action === "ideas") {
    // Get existing titles to avoid duplicates
    const existing = await db
      .select({ title: blogPosts.title })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(50);

    const ideas = await generateBlogIdeas(
      existing.map((p) => p.title),
      5
    );
    return NextResponse.json({ ideas });
  }

  if (body.action === "generate") {
    if (!body.idea) {
      return NextResponse.json({ error: "idea required" }, { status: 400 });
    }

    const generated = await generateBlogContent(body.idea);
    const now = new Date();

    const post = {
      id: crypto.randomUUID(),
      slug: generated.idea.slug,
      title: generated.idea.title,
      excerpt: generated.idea.excerpt,
      content: generated.content,
      category: generated.idea.category,
      tags: generated.idea.tags,
      seoTitle: generated.idea.seoTitle,
      seoDescription: generated.idea.seoDescription,
      isAiGenerated: true,
      readingTimeMinutes: generated.readingTimeMinutes,
      status: body.publish ? ("published" as const) : ("draft" as const),
      publishedAt: body.publish ? now : null,
      author: "צוות WeddingPro",
    };

    try {
      await db.insert(blogPosts).values(post);
    } catch {
      // Slug conflict — append timestamp
      post.slug = `${post.slug}-${Date.now()}`;
      post.id = crypto.randomUUID();
      await db.insert(blogPosts).values(post);
    }

    // Notify N8N if published
    if (body.publish) {
      void n8nBlogPublished({
        post_id: post.id,
        slug: post.slug,
        title: post.title,
        url: `${NEXT_PUBLIC_APP_URL}/blog/${post.slug}`,
        is_ai_generated: true,
      });
    }

    return NextResponse.json({ post });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
