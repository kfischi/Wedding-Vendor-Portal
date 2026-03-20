import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.suite-hagit.co.il";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/vendors", "/vendors/", "/pricing", "/privacy", "/terms", "/cookies", "/accessibility"],
        disallow: ["/admin", "/admin/", "/dashboard", "/dashboard/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
