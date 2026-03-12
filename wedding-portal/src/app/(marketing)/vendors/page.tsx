import { Suspense } from "react";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import type { Vendor } from "@/lib/db/schema";
import { VendorCard } from "@/components/vendor/VendorCard";
import { VendorDirectoryFilters } from "@/components/marketing/VendorDirectoryFilters";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "דירקטורי ספקי חתונות",
  description: "חפשו בין מאות ספקי חתונות מובחרים בישראל — צלמים, אולמות, קייטרינג ועוד.",
};

interface SearchParams {
  q?: string;
  category?: string;
  city?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 12;

async function getVendors(sp: SearchParams): Promise<{ vendors: Vendor[]; total: number }> {
  try {
    const page = Math.max(1, parseInt(sp.page ?? "1"));
    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [eq(vendors.status, "active")];

    if (sp.q) {
      conditions.push(
        ilike(vendors.businessName, `%${sp.q}%`)
      );
    }
    if (sp.category) {
      conditions.push(eq(vendors.category, sp.category as Vendor["category"]));
    }
    if (sp.city) {
      conditions.push(ilike(vendors.city, `%${sp.city}%`));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const sortCol =
      sp.sort === "views"
        ? desc(vendors.viewCount)
        : sp.sort === "createdAt"
        ? desc(vendors.createdAt)
        : desc(vendors.rating);

    const [rows, [countRow]] = await Promise.all([
      db.select().from(vendors).where(where).orderBy(sortCol).limit(PAGE_SIZE).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(vendors).where(where),
    ]);

    return { vendors: rows, total: Number(countRow?.count ?? 0) };
  } catch {
    return { vendors: [], total: 0 };
  }
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function VendorDirectoryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const { vendors: results, total } = await getVendors(sp);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.category) params.set("category", sp.category);
    if (sp.city) params.set("city", sp.city);
    if (sp.sort) params.set("sort", sp.sort);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-ivory" dir="rtl">
      {/* Header */}
      <div className="bg-cream-white border-b border-champagne/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="font-script text-gold text-xl mb-1">מצאו את הספק המושלם</p>
          <h1 className="font-display text-4xl sm:text-5xl text-obsidian mb-2">
            דירקטורי ספקי חתונות
          </h1>
          <p className="text-stone text-sm sm:text-base">
            {total > 0 ? `${total} ספקים מובחרים בישראל` : "ספקי חתונות מובחרים בישראל"}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filters */}
        <Suspense>
          <VendorDirectoryFilters />
        </Suspense>

        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-obsidian mb-2">לא נמצאו ספקים</p>
            <p className="text-stone text-sm">נסו לשנות את הפילטרים או לחפש מחדש</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  slug={vendor.slug}
                  businessName={vendor.businessName}
                  shortDescription={vendor.shortDescription}
                  city={vendor.city}
                  category={vendor.category}
                  coverImage={vendor.coverImage}
                  plan={vendor.plan}
                  rating={vendor.rating}
                  reviewCount={vendor.reviewCount}
                  featured={vendor.featuredUntil ? vendor.featuredUntil > new Date() : false}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {page > 1 && (
                  <a
                    href={buildPageUrl(page - 1)}
                    className="px-4 py-2 rounded-xl border border-champagne text-sm text-stone hover:bg-champagne/40 transition-colors"
                  >
                    ← הקודם
                  </a>
                )}
                <span className="px-4 py-2 text-sm text-stone">
                  עמוד {page} מתוך {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={buildPageUrl(page + 1)}
                    className="px-4 py-2 rounded-xl border border-champagne text-sm text-stone hover:bg-champagne/40 transition-colors"
                  >
                    הבא →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
