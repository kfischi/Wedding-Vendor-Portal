import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPostsMerged, getAllCategories } from "@/lib/blog";
import { Footer } from "@/components/layout/Footer";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "בלוג | WeddingPro",
  description: "טיפים, מדריכים ורעיונות לחתונה המושלמת — מאת מומחי WeddingPro",
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: catParam } = await searchParams;
  const allPosts = await getAllPostsMerged();
  const categories = getAllCategories();

  const posts = catParam
    ? allPosts.filter((p) => p.category === catParam)
    : allPosts;

  const featured = !catParam && posts.length > 0 ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-ivory">
        {/* Editorial header */}
        <section className="bg-cream-white border-b border-champagne/60 py-20 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-script-accent text-2xl text-gold mb-3">היומן שלנו</p>
            <h1 className="text-editorial text-5xl md:text-6xl text-obsidian mb-5">
              טיפים לחתונה המושלמת
            </h1>
            <p className="text-body-lux text-obsidian/60 text-lg">
              מדריכים מעשיים, השראה ורעיונות מהמומחים
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 space-y-12">
          {/* Category filter tabs */}
          {categories.length > 0 && (
            <nav aria-label="סינון לפי קטגוריה" className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`px-5 py-2 text-micro-label transition-all border-b-2 ${
                  !catParam
                    ? "border-obsidian text-obsidian"
                    : "border-transparent text-obsidian/40 hover:text-obsidian/70 hover:border-obsidian/30"
                }`}
              >
                הכל
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`}
                  className={`px-5 py-2 text-micro-label transition-all border-b-2 ${
                    catParam === cat
                      ? "border-gold text-gold"
                      : "border-transparent text-obsidian/40 hover:text-obsidian/70 hover:border-obsidian/30"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          )}

          {/* Featured hero post */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block overflow-hidden"
            >
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[460px] overflow-hidden bg-champagne/30">
                  <Image
                    src={featured.coverImage}
                    alt={featured.title}
                    fill
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-obsidian/30 to-transparent"
                  />
                </div>
                <div className="bg-cream-white px-8 py-10 lg:px-12 lg:py-14 flex flex-col justify-center">
                  <p className="text-micro-label text-gold mb-4">כתבה ראשית</p>
                  <span className="inline-block text-micro-label text-obsidian/50 border border-obsidian/20 px-3 py-1 mb-5 w-fit">
                    {featured.category}
                  </span>
                  <h2 className="text-editorial text-3xl lg:text-4xl text-obsidian leading-tight mb-5 group-hover:text-gold transition-colors duration-300">
                    {featured.title}
                  </h2>
                  <p className="text-body-lux text-obsidian/60 leading-relaxed mb-8 line-clamp-3">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-micro-label text-obsidian">{featured.author}</p>
                      <p className="text-micro-label text-obsidian/40 mt-1">
                        {formatDate(featured.date)}
                      </p>
                    </div>
                    <span className="text-micro-label text-obsidian flex items-center gap-2 border-b border-obsidian pb-0.5 group-hover:gap-3 transition-all">
                      קראו עוד
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Masonry grid */}
          {rest.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
              {rest.map((post) => (
                <article
                  key={post.slug}
                  className="break-inside-avoid mb-6 block"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block bg-cream-white overflow-hidden hover:shadow-[0_8px_40px_rgba(26,22,20,0.08)] transition-shadow duration-500"
                  >
                    <div className="relative overflow-hidden bg-champagne/30 aspect-[4/3]">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-obsidian/30 to-transparent"
                      />
                      <span className="absolute top-4 right-4 text-micro-label bg-ivory/90 text-obsidian px-3 py-1">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-editorial text-xl md:text-2xl text-obsidian leading-snug mb-3 group-hover:text-gold transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-body-lux text-sm text-obsidian/55 leading-relaxed mb-5 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-micro-label text-obsidian/40">
                        <span>{formatDate(post.date)}</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-cream-white">
              <p className="text-editorial text-2xl text-obsidian mb-4">
                אין מאמרים בקטגוריה זו
              </p>
              <Link
                href="/blog"
                className="text-micro-label text-gold hover:text-obsidian transition-colors"
              >
                חזרה לכל המאמרים
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
