import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog";
import { Footer } from "@/components/layout/Footer";
import { Clock, Search, ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "בלוג | WeddingPro",
  description: "טיפים, מדריכים ורעיונות לחתונה המושלמת — מאת מומחי WeddingPro",
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(d));
}

const CATEGORY_COLORS: Record<BlogCategory, string> = {
  "כללי":         "bg-stone/10 text-stone",
  "טיפים לזוגות": "bg-blush/20 text-dusty-rose",
  "מדריכים":      "bg-gold/10 text-gold",
  "ספקים":        "bg-blue-50 text-blue-600",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: catParam, q } = await searchParams;
  const activeCategory = BLOG_CATEGORIES.find((c) => c === catParam) ?? null;

  let posts = BLOG_POSTS;
  if (activeCategory) posts = posts.filter((p) => p.category === activeCategory);
  if (q) {
    const lower = q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.excerpt.toLowerCase().includes(lower)
    );
  }

  const featured = !activeCategory && !q ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero */}
        <section className="bg-white border-b border-champagne/60 py-14 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <p className="font-script text-2xl text-gold mb-2">הבלוג שלנו</p>
            <h1 className="font-display text-4xl lg:text-5xl text-obsidian leading-tight mb-4">
              טיפים לחתונה המושלמת
            </h1>
            <p className="text-stone/60 text-lg max-w-xl mx-auto">
              מדריכים מעשיים, השראה, ורעיונות מהמומחים
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Search + Category filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <form method="get" className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone/40" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="חיפוש מאמרים..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-champagne bg-white text-sm text-obsidian placeholder:text-stone/40 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
              {catParam && <input type="hidden" name="category" value={catParam} />}
            </form>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !activeCategory
                    ? "bg-obsidian text-white border-obsidian"
                    : "bg-white text-stone border-champagne hover:border-obsidian/40"
                }`}
              >
                הכל
              </Link>
              {BLOG_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === cat
                      ? "bg-obsidian text-white border-obsidian"
                      : "bg-white text-stone border-champagne hover:border-obsidian/40"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured post */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block bg-white rounded-3xl border border-champagne/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[featured.category]}`}>
                      {featured.category}
                    </span>
                    <span className="text-xs text-stone/50 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featured.readTime} דקות קריאה
                    </span>
                  </div>
                  <h2 className="font-display text-2xl lg:text-3xl text-obsidian leading-tight mb-3 group-hover:text-gold transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-stone/60 text-sm leading-relaxed mb-6 line-clamp-3">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-obsidian">{featured.author}</p>
                      <p className="text-xs text-stone/50">{formatDate(featured.date)}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-gold group-hover:gap-2 transition-all">
                      קראו עוד <ChevronLeft className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-champagne/60 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative h-48">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/30 to-transparent" />
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[post.category]}`}>
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg text-obsidian leading-snug mb-2 group-hover:text-gold transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-stone/55 leading-relaxed line-clamp-2 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-stone/45">
                      <span>{formatDate(post.date)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime} דק׳
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-champagne/60">
              <p className="font-display text-2xl text-obsidian mb-2">לא נמצאו מאמרים</p>
              <p className="text-stone/50 text-sm">נסו חיפוש אחר</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
