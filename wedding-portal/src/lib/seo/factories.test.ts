import { describe, it, expect } from "vitest";
import {
  organizationSchema,
  websiteSchema,
  vendorSchema,
  itemListSchema,
  breadcrumbSchema,
  articleSchema,
} from "./factories";

describe("organizationSchema", () => {
  it("returns a valid Organization payload", () => {
    const s = organizationSchema();
    expect(s["@context"]).toBe("https://schema.org");
    expect(s["@type"]).toBe("Organization");
    expect(s.name).toBe("WeddingPro");
    expect(s.url).toMatch(/^https?:\/\//);
  });

  it("includes contactPoint with language", () => {
    const s = organizationSchema();
    expect(s.contactPoint?.contactType).toBe("customer support");
    expect(s.contactPoint?.availableLanguage).toContain("Hebrew");
  });
});

describe("websiteSchema", () => {
  it("includes a SearchAction potentialAction", () => {
    const s = websiteSchema();
    expect(s.potentialAction?.["@type"]).toBe("SearchAction");
    expect(s.potentialAction?.target.urlTemplate).toContain(
      "{search_term_string}"
    );
    expect(s.potentialAction?.["query-input"]).toBe(
      "required name=search_term_string"
    );
  });

  it("declares Hebrew as inLanguage", () => {
    expect(websiteSchema().inLanguage).toBe("he-IL");
  });
});

describe("vendorSchema", () => {
  const base = {
    slug: "test-vendor",
    businessName: "סטודיו בדיקה",
    category: "photography",
  };

  it("returns LocalBusiness with @id matching url", () => {
    const s = vendorSchema(base);
    expect(s["@type"]).toBe("LocalBusiness");
    expect(s["@id"]).toBe(s.url);
    expect(s.url).toContain("/vendors/test-vendor");
  });

  it("omits aggregateRating when reviewCount is 0", () => {
    const s = vendorSchema({ ...base, rating: 4.5, reviewCount: 0 });
    expect(s.aggregateRating).toBeUndefined();
  });

  it("omits aggregateRating when rating is null", () => {
    const s = vendorSchema({ ...base, rating: null, reviewCount: 10 });
    expect(s.aggregateRating).toBeUndefined();
  });

  it("includes aggregateRating when both rating and reviewCount are set", () => {
    const s = vendorSchema({ ...base, rating: 4.8, reviewCount: 23 });
    expect(s.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.8,
      reviewCount: 23,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("omits address when city is not provided", () => {
    const s = vendorSchema(base);
    expect(s.address).toBeUndefined();
    expect(s.areaServed).toBeUndefined();
  });

  it("sets address and areaServed when city is provided", () => {
    const s = vendorSchema({ ...base, city: "תל אביב" });
    expect(s.address?.addressLocality).toBe("תל אביב");
    expect(s.address?.addressCountry).toBe("IL");
    expect(s.areaServed).toEqual({ "@type": "City", name: "תל אביב" });
  });

  it("omits description/image/phone/email when null", () => {
    const s = vendorSchema({
      ...base,
      description: null,
      coverImage: null,
      phone: null,
      email: null,
    });
    expect(s.description).toBeUndefined();
    expect(s.image).toBeUndefined();
    expect(s.telephone).toBeUndefined();
    expect(s.email).toBeUndefined();
  });
});

describe("itemListSchema", () => {
  it("produces 1-indexed positions", () => {
    const s = itemListSchema([
      { slug: "a", businessName: "A" },
      { slug: "b", businessName: "B" },
      { slug: "c", businessName: "C" },
    ]);
    expect(s.itemListElement.map((e) => e.position)).toEqual([1, 2, 3]);
  });

  it("includes image when provided", () => {
    const s = itemListSchema([
      { slug: "a", businessName: "A", coverImage: "https://x/y.jpg" },
    ]);
    expect(s.itemListElement[0].image).toBe("https://x/y.jpg");
  });

  it("omits image key entirely when not provided", () => {
    const s = itemListSchema([{ slug: "a", businessName: "A" }]);
    expect("image" in s.itemListElement[0]).toBe(false);
  });

  it("returns empty itemListElement for empty input", () => {
    expect(itemListSchema([]).itemListElement).toEqual([]);
  });
});

describe("breadcrumbSchema", () => {
  it("prefixes relative urls with APP_URL", () => {
    const s = breadcrumbSchema([{ name: "ראשי", url: "/" }]);
    expect(s.itemListElement[0].item).toMatch(/^https?:\/\/.+\/$/);
  });

  it("leaves absolute urls unchanged", () => {
    const s = breadcrumbSchema([
      { name: "External", url: "https://other.example/path" },
    ]);
    expect(s.itemListElement[0].item).toBe("https://other.example/path");
  });

  it("produces 1-indexed positions", () => {
    const s = breadcrumbSchema([
      { name: "ראשי", url: "/" },
      { name: "ספקים", url: "/vendors" },
    ]);
    expect(s.itemListElement.map((e) => e.position)).toEqual([1, 2]);
  });
});

describe("articleSchema", () => {
  const base = {
    slug: "test-post",
    title: "כותרת מאמר",
    publishedAt: new Date("2026-04-01T10:00:00Z"),
  };

  it("emits ISO dates", () => {
    const s = articleSchema(base);
    expect(s.datePublished).toBe("2026-04-01T10:00:00.000Z");
  });

  it("accepts string publishedAt", () => {
    const s = articleSchema({ ...base, publishedAt: "2026-04-01" });
    expect(s.datePublished).toMatch(/^2026-04-01T/);
  });

  it("falls back to Organization author when authorName is null", () => {
    const s = articleSchema({ ...base, authorName: null });
    expect(s.author).toEqual(
      expect.objectContaining({ "@type": "Organization", name: "WeddingPro" })
    );
  });

  it("uses Person author when authorName is provided", () => {
    const s = articleSchema({ ...base, authorName: "דנה כהן" });
    expect(s.author).toEqual({ "@type": "Person", name: "דנה כהן" });
  });

  it("omits keywords when tags array is empty", () => {
    const s = articleSchema({ ...base, tags: [] });
    expect(s.keywords).toBeUndefined();
  });

  it("mainEntityOfPage.@id matches the slug url", () => {
    const s = articleSchema(base);
    expect(s.mainEntityOfPage["@id"]).toContain("/blog/test-post");
  });
});
