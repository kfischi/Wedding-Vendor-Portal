/**
 * Schema.org JSON-LD types — strict TypeScript definitions for the types we emit.
 * Reference: https://schema.org/docs/schemas.html
 *
 * Every top-level schema includes a `@context`. Nested objects use `@type` only.
 */

interface SchemaBase {
  "@context": "https://schema.org";
}

// ─── Shared building blocks ──────────────────────────────────────────────────

export interface PostalAddressSchema {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface ContactPointSchema {
  "@type": "ContactPoint";
  contactType: string;
  telephone?: string;
  email?: string;
  availableLanguage?: string | string[];
}

export interface ImageObjectSchema {
  "@type": "ImageObject";
  url: string;
  width?: number;
  height?: number;
}

export interface PersonSchema {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
}

export interface AggregateRatingSchema {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface ReviewSchema {
  "@type": "Review";
  author: PersonSchema | string;
  datePublished?: string;
  reviewBody?: string;
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
}

// ─── Top-level schemas ───────────────────────────────────────────────────────

export interface OrganizationSchema extends SchemaBase {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: ContactPointSchema;
  address?: PostalAddressSchema;
  areaServed?: { "@type": "Country"; name: string };
}

export interface WebSiteSchema extends SchemaBase {
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  inLanguage?: string;
  publisher?: Pick<OrganizationSchema, "@type" | "name" | "url">;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
}

export interface LocalBusinessSchema extends SchemaBase {
  "@type": "LocalBusiness";
  "@id": string;
  name: string;
  url: string;
  description?: string;
  image?: string;
  telephone?: string;
  email?: string;
  priceRange?: string;
  address?: PostalAddressSchema;
  areaServed?: string | { "@type": "City"; name: string };
  sameAs?: string[];
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
}

export interface ItemListSchema extends SchemaBase {
  "@type": "ItemList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    url: string;
    name: string;
    image?: string;
  }>;
}

export interface BreadcrumbListSchema extends SchemaBase {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ArticleSchema extends SchemaBase {
  "@type": "Article";
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished: string;
  dateModified?: string;
  author: PersonSchema | { "@type": "Organization"; name: string; url?: string };
  publisher: { "@type": "Organization"; name: string; logo?: ImageObjectSchema };
  mainEntityOfPage: { "@type": "WebPage"; "@id": string };
  articleSection?: string;
  keywords?: string[];
}

export type AnySchema =
  | OrganizationSchema
  | WebSiteSchema
  | LocalBusinessSchema
  | ItemListSchema
  | BreadcrumbListSchema
  | ArticleSchema;
