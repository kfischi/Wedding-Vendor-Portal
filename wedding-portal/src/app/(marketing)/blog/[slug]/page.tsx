import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllSlugs, getPostBySlug, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/layout/Footer";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { Clock, Calendar, ArrowRight, ChevronLeft } from "lucide-react";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | WeddingPro`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
      type: "article",
      publishedTime: post.date,
    },
  };
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(d));
}

// Custom MDX components — Hebrew/RTL styling
const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-display text-2xl lg:text-3xl text-obsidian mt-10 mb-4 leading-snug" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-semibold text-lg text-obsidian mt-6 mb-3" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-stone/75 leading-[1.85] mb-4 text-[1.05rem]" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-4 space-y-2 pr-5 list-disc marker:text-gold" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="my-4 space-y-2 pr-5 list-decimal marker:text-gold" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="text-stone/75 leading-relaxed" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-obsidian" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-stone/80" {...props} />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-r-4 border-gold/50 pr-5 py-1 my-5 italic text-stone/65 bg-gold/5 rounded-r-lg"
      {...props}
    />
  ),
  hr: () => <hr className="border-champagne/60 my-8" />,
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-champagne/40" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone/70 border border-champagne/60" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2.5 text-stone/70 border border-champagne/40" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="even:bg-champagne/10 hover:bg-champagne/20 transition-colors" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-gold underline underline-offset-2 hover:text-gold/70 transition-colors" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-champagne/40 text-dusty-rose px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero image */}
        <div className="relative h-72 lg:h-[480px] bg-obsidian">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover opacity-55"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/20 to-transparent" />

          {/* Breadcrumb */}
          <div className="absolute top-4 right-0 left-0 max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <Link href="/blog" className="hover:text-white flex items-center gap-1 transition-colors">
                <ArrowRight className="h-3 w-3" /> בלוג
              </Link>
              <span>/</span>
              <span className="text-white/40">{post.category}</span>
            </div>
          </div>

          {/* Title area */}
          <div className="absolute bottom-0 right-0 left-0 max-w-4xl mx-auto px-4 pb-8 lg:pb-12">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gold/30 text-gold border border-gold/30 mb-4 backdrop-blur-sm">
              {post.category}
            </span>
            <h1 className="font-display text-3xl lg:text-5xl text-white leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/65">
              <span className="font-medium text-white/90">{post.author}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {post.readTime} קריאה
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-10 items-start">

            {/* Article */}
            <article className="bg-white rounded-2xl border border-champagne/60 shadow-sm p-6 lg:p-10 min-w-0">
              <MDXRemote source={post.content} components={components} />

              {/* Share */}
              <div className="mt-10 pt-6 border-t border-champagne/60 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-obsidian">שתפו:</span>
                <ShareButtons title={post.title} />
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-5 mt-6 lg:mt-0">
              {/* CTA */}
              <div className="bg-gradient-to-br from-gold/10 to-blush/10 rounded-2xl border border-gold/20 p-5 sticky top-24">
                <p className="font-display text-xl text-obsidian mb-2">מצאו ספקים מובחרים</p>
                <p className="text-xs text-stone/60 mb-4 leading-relaxed">
                  מאות ספקים מאומתים בכל קטגוריה — הכל במקום אחד
                </p>
                <Link
                  href="/vendors"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors"
                >
                  לדירקטורי הספקים <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>

              {/* About author */}
              <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
                <h3 className="font-semibold text-obsidian text-sm mb-3">על הכותב/ת</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-blush/30 flex items-center justify-center shrink-0">
                    <span className="font-display text-sm text-obsidian">
                      {post.author.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-obsidian">{post.author}</p>
                    <p className="text-xs text-stone/50">WeddingPro</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl text-obsidian mb-6">מאמרים נוספים</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="group bg-white rounded-2xl border border-champagne/60 overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="relative h-40">
                      <Image
                        src={r.coverImage}
                        alt={r.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-base text-obsidian group-hover:text-gold transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-xs text-stone/45 mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {r.readTime}
                      </p>
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
