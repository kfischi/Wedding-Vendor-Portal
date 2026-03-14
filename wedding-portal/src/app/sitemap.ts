import type { MetadataRoute } from "next";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://wedding-vendor-portal.netlify.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${appUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${appUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${appUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${appUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${appUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${appUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${appUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${appUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${appUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  let vendorPages: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: vendors.slug, updatedAt: vendors.updatedAt })
      .from(vendors)
      .where(eq(vendors.status, "active"));

    vendorPages = rows.map((v) => ({
      url: `${appUrl}/vendors/${v.slug}`,
      lastModified: new Date(v.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // DB unavailable — return static pages only
  }

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${appUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...vendorPages, ...blogPages];
}
