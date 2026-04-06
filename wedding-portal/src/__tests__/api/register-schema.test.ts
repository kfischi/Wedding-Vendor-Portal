import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for the registration schema used in /api/register-free.
 * Mirrors the exact schema from the route to ensure validation logic is correct.
 */

const VALID_CATEGORIES = [
  "photography", "videography", "venue", "catering", "flowers",
  "music", "dj", "makeup", "dress", "suit", "cake", "invitation",
  "transport", "lighting", "planning", "wedding-dress-designers",
  "bridal-preparation", "other",
] as const;

const schema = z.object({
  email: z.string().email("אימייל לא תקין").max(255),
  businessName: z.string().min(2, "שם עסק נדרש").max(100),
  category: z.enum(VALID_CATEGORIES),
  city: z.string().min(1, "עיר נדרשת").max(100),
  phone: z.string().max(20).optional(),
  couponCode: z.string().min(1, "קוד קופון נדרש").max(50),
});

const validPayload = {
  email: "vendor@example.com",
  businessName: "סטודיו כהן",
  category: "photography" as const,
  city: "תל אביב",
  phone: "050-1234567",
  couponCode: "WEDDINGPRO",
};

describe("register-free schema", () => {
  it("accepts a valid payload", () => {
    expect(schema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = schema.safeParse({ ...validPayload, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects business name shorter than 2 chars", () => {
    const result = schema.safeParse({ ...validPayload, businessName: "א" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = schema.safeParse({ ...validPayload, category: "florist" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    VALID_CATEGORIES.forEach((cat) => {
      const result = schema.safeParse({ ...validPayload, category: cat });
      expect(result.success, `category "${cat}" should be valid`).toBe(true);
    });
  });

  it("rejects empty city", () => {
    const result = schema.safeParse({ ...validPayload, city: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty coupon code", () => {
    const result = schema.safeParse({ ...validPayload, couponCode: "" });
    expect(result.success).toBe(false);
  });

  it("allows phone to be omitted", () => {
    const { phone, ...withoutPhone } = validPayload;
    expect(schema.safeParse(withoutPhone).success).toBe(true);
  });

  it("rejects coupon code longer than 50 chars", () => {
    const result = schema.safeParse({
      ...validPayload,
      couponCode: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts Hebrew business names", () => {
    const result = schema.safeParse({ ...validPayload, businessName: "פרחי חתונה בע״מ" });
    expect(result.success).toBe(true);
  });
});
