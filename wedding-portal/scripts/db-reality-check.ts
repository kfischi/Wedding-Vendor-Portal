import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌  Missing DATABASE_URL");
    process.exit(1);
  }

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log("\n=== WEDDINGPRO DATABASE REALITY CHECK ===\n");

  const vendorsByStatus = await db.execute(sql`
    SELECT status, COUNT(*)::int as count
    FROM vendors GROUP BY status ORDER BY count DESC
  `);
  console.log("VENDORS BY STATUS:");
  console.table(vendorsByStatus);

  const vendorsByPlan = await db.execute(sql`
    SELECT plan, COUNT(*)::int as count
    FROM vendors GROUP BY plan
  `);
  console.log("\nVENDORS BY PLAN:");
  console.table(vendorsByPlan);

  const activeByCategory = await db.execute(sql`
    SELECT category, COUNT(*)::int as count
    FROM vendors WHERE status = 'active'
    GROUP BY category ORDER BY count DESC
  `);
  console.log("\nACTIVE VENDORS BY CATEGORY:");
  console.table(activeByCategory);

  const totalActive = await db.execute(sql`
    SELECT COUNT(*)::int as total_active
    FROM vendors WHERE status = 'active'
  `);
  console.log("\nTOTAL ACTIVE VENDORS:", totalActive[0]);

  const featured = await db.execute(sql`
    SELECT id, business_name, category, status, plan, featured_until
    FROM vendors WHERE status = 'active'
    ORDER BY
      CASE WHEN featured_until > NOW() THEN 0 ELSE 1 END,
      created_at DESC
    LIMIT 10
  `);
  console.log("\nFEATURED VENDORS (top 10 active):");
  console.table(featured);

  const recent = await db.execute(sql`
    SELECT id, business_name, category, status, created_at
    FROM vendors ORDER BY created_at DESC LIMIT 5
  `);
  console.log("\n5 MOST RECENT VENDORS (any status):");
  console.table(recent);

  const leadStats = await db.execute(sql`
    SELECT status, COUNT(*)::int as count
    FROM leads GROUP BY status
  `);
  console.log("\nLEADS BY STATUS:");
  console.table(leadStats);

  const reviewStats = await db.execute(sql`
    SELECT is_published, COUNT(*)::int as count,
           ROUND(AVG(rating)::numeric, 2) as avg_rating
    FROM reviews GROUP BY is_published
  `);
  console.log("\nREVIEWS:");
  console.table(reviewStats);

  const mediaCount = await db.execute(sql`
    SELECT COUNT(*)::int as total_media,
           COUNT(DISTINCT vendor_id)::int as vendors_with_media
    FROM vendor_media
  `);
  console.log("\nMEDIA:");
  console.table(mediaCount);

  const statusEnum = await db.execute(sql`
    SELECT enumlabel FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status')
    ORDER BY enumsortorder
  `);
  console.log("\nSTATUS ENUM VALUES:");
  console.table(statusEnum);

  console.log("\n=== CHECK COMPLETE ===\n");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Reality check failed:", err);
  process.exit(1);
});
