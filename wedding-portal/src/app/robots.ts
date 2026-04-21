import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://weddingpro.co.il";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vendors", "/vendors/", "/pricing", "/blog", "/blog/", "/join", "/join/", "/about", "/contact", "/privacy", "/terms", "/cookies", "/accessibility"],
        disallow: ["/admin", "/admin/", "/dashboard", "/dashboard/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
