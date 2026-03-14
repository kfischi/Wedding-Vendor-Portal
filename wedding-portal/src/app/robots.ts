import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://wedding-vendor-portal.netlify.app";

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
