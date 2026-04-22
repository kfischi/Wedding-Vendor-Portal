/**
 * Cover-story vendor for the homepage Featured section.
 *
 * Selection strategy:
 *   1. Active + premium + currently featured (featuredUntil > now) — the
 *      monthly "cover story" slot the vendor paid for.
 *   2. Fallback: newest active premium vendor — ensures the section keeps
 *      filling even outside a featured window.
 *   3. If neither exists, return null and the homepage section renders nothing.
 */

import { unstable_cache } from "next/cache";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { vendors, type Vendor } from "@/lib/db/schema";

async function fetchCoverStoryVendor(): Promise<Vendor | null> {
  const now = new Date();

  const [currentlyFeatured] = await db
    .select()
    .from(vendors)
    .where(
      and(
        eq(vendors.status, "active"),
        eq(vendors.plan, "premium"),
        gt(vendors.featuredUntil, now)
      )
    )
    .orderBy(desc(vendors.featuredUntil))
    .limit(1);

  if (currentlyFeatured) return currentlyFeatured;

  const [latestPremium] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.status, "active"), eq(vendors.plan, "premium")))
    .orderBy(desc(vendors.createdAt))
    .limit(1);

  return latestPremium ?? null;
}

export const getCoverStoryVendor = unstable_cache(
  fetchCoverStoryVendor,
  ["cover-story-vendor"],
  { revalidate: 3600, tags: ["vendors", "featured"] }
);
