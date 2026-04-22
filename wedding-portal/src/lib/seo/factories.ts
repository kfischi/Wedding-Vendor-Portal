/**
 * JSON-LD factory functions — produce strictly-typed schema.org payloads
 * for injection via <JsonLd data={...}/> component.
 *
 * All factories are pure: no DB access, no side effects. Caller fetches
 * data, passes it in, factory returns a typed object.
 */

import type {
  OrganizationSchema,
  WebSiteSchema,
  LocalBusinessSchema,
  ItemListSchema,
  BreadcrumbListSchema,
  ArticleSchema,
} from "./types";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.weddingpro.co.il";

// ─── Organization ────────────────────────────────────────────────────────────

export function organizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "WeddingPro",
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    description: "פלטפורמת ספקי חתונות יוקרה בישראל",
    areaServed: { "@type": "Country", name: "Israel" },
    sameAs: [
      "https://www.instagram.com/weddingpro.il",
      "https://www.facebook.com/weddingpro.il",
      "https://tiktok.com/@weddingpro.il",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "info@weddingpro.co.il",
      availableLanguage: ["Hebrew", "English"],
    },
  };
}

// ─── WebSite ─────────────────────────────────────────────────────────────────

export function websiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "WeddingPro",
    url: APP_URL,
    description:
      "הפלטפורמה המובילה לספקי חתונות בישראל — מצאו צלמים, אולמות, קייטרינג ועוד",
    inLanguage: "he-IL",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/vendors?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── LocalBusiness (vendor) ──────────────────────────────────────────────────

export interface VendorSchemaInput {
  slug: string;
  businessName: string;
  category: string;
  description?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  coverImage?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
}

export function vendorSchema(vendor: VendorSchemaInput): LocalBusinessSchema {
  const url = `${APP_URL}/vendors/${vendor.slug}`;

  const schema: LocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name: vendor.businessName,
    url,
  };

  if (vendor.description) schema.description = vendor.description;
  if (vendor.coverImage) schema.image = vendor.coverImage;
  if (vendor.phone) schema.telephone = vendor.phone;
  if (vendor.email) schema.email = vendor.email;
  if (vendor.priceRange) schema.priceRange = vendor.priceRange;

  if (vendor.city) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: vendor.city,
      addressCountry: "IL",
    };
    schema.areaServed = { "@type": "City", name: vendor.city };
  }

  if (vendor.rating && vendor.reviewCount && vendor.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// ─── ItemList ────────────────────────────────────────────────────────────────

export interface ItemListVendorInput {
  slug: string;
  businessName: string;
  coverImage?: string | null;
}

export function itemListSchema(
  vendors: ItemListVendorInput[]
): ItemListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: vendors.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${APP_URL}/vendors/${v.slug}`,
      name: v.businessName,
      ...(v.coverImage ? { image: v.coverImage } : {}),
    })),
  };
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(
  items: BreadcrumbItem[]
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${APP_URL}${item.url}`,
    })),
  };
}

// ─── Article (blog post) ─────────────────────────────────────────────────────

export interface ArticleSchemaInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  publishedAt: Date | string;
  updatedAt?: Date | string | null;
  authorName?: string | null;
  category?: string | null;
  tags?: string[] | null;
}

export function articleSchema(post: ArticleSchemaInput): ArticleSchema {
  const url = `${APP_URL}/blog/${post.slug}`;
  const toIso = (d: Date | string): string =>
    d instanceof Date ? d.toISOString() : new Date(d).toISOString();

  const schema: ArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: toIso(post.publishedAt),
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: "WeddingPro", url: APP_URL },
    publisher: {
      "@type": "Organization",
      name: "WeddingPro",
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  if (post.excerpt) schema.description = post.excerpt;
  if (post.coverImage) schema.image = post.coverImage;
  if (post.updatedAt) schema.dateModified = toIso(post.updatedAt);
  if (post.category) schema.articleSection = post.category;
  if (post.tags && post.tags.length > 0) schema.keywords = post.tags;

  return schema;
}
