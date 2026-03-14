import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";
import { Footer } from "@/components/layout/Footer";
import { Clock, Calendar, ArrowRight, Share2, ChevronLeft } from "lucide-react";
import { ShareButtons } from "@/components/blog/ShareButtons";

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} | WeddingPro`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
  };
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(d));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category
  ).slice(0, 3);

  // Parse content into sections for TOC
  const headings = [...post.content.matchAll(/^## (.+)$/gm)].map((m) => ({
    text: m[1],
    id: m[1].replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
  }));

  // Render markdown-like content as HTML
  const htmlContent = post.content
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) {
        const text = line.slice(3);
        const id = text.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
        return `<h2 id="${id}" class="font-display text-2xl text-obsidian mt-8 mb-3">${text}</h2>`;
      }
      if (line.startsWith("### ")) {
        return `<h3 class="font-semibold text-lg text-obsidian mt-5 mb-2">${line.slice(4)}</h3>`;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return `<p class="font-semibold text-obsidian my-2">${line.slice(2, -2)}</p>`;
      }
      if (line.startsWith("- ")) {
        return `<li class="text-stone/70 leading-relaxed mb-1 mr-4 list-disc">${line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
      }
      if (line.match(/^\d+\. /)) {
        return `<li class="text-stone/70 leading-relaxed mb-1 mr-6 list-decimal">${line.replace(/^\d+\. /, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
      }
      if (line.trim() === "") return "<br />";
      return `<p class="text-stone/70 leading-relaxed mb-3">${line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-obsidian'>$1</strong>")}</p>`;
    })
    .join("\n");

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero */}
        <div className="relative h-72 lg:h-96 bg-obsidian">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/20 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6 lg:p-10 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/blog" className="text-white/60 text-sm hover:text-white flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> בלוג
              </Link>
              <span className="text-white/40 text-sm">/</span>
              <span className="text-white/60 text-sm">{post.category}</span>
            </div>
            <h1 className="font-display text-3xl lg:text-5xl text-white leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="font-medium text-white">{post.author}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {post.readTime} דקות קריאה
              </span>
            </div>
          </div>
        </div>

        {/* Content layout */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 items-start">

            {/* Article */}
            <article className="bg-white rounded-2xl border border-champagne/60 shadow-sm p-6 lg:p-10">
              <div
                className="prose-article"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Share */}
              <div className="mt-10 pt-6 border-t border-champagne/60">
                <div className="flex items-center gap-3">
                  <Share2 className="h-4 w-4 text-stone/50" />
                  <span className="text-sm font-medium text-obsidian">שתפו:</span>
                  <ShareButtons title={post.title} />
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6 mt-6 lg:mt-0">
              {/* TOC */}
              {headings.length > 0 && (
                <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm sticky top-24">
                  <h3 className="font-semibold text-obsidian text-sm mb-3">תוכן עניינים</h3>
                  <nav className="space-y-1.5">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="block text-sm text-stone/60 hover:text-gold transition-colors py-0.5 border-r-2 border-transparent hover:border-gold pr-3"
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-br from-gold/10 to-blush/10 rounded-2xl border border-gold/20 p-5">
                <p className="font-display text-xl text-obsidian mb-2">מצאו ספקים מובחרים</p>
                <p className="text-xs text-stone/60 mb-4 leading-relaxed">
                  מאות ספקים מוסמכים בכל קטגוריה — הכל במקום אחד
                </p>
                <Link
                  href="/vendors"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors"
                >
                  לדירקטורי הספקים <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-obsidian mb-6">מאמרים קשורים</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group bg-white rounded-2xl border border-champagne/60 overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative h-40">
                      <Image src={r.coverImage} alt={r.title} fill className="object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-base text-obsidian group-hover:text-gold transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
