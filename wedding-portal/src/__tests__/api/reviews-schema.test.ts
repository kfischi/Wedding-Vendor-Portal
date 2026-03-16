import { describe, it, expect } from "vitest";
import { z } from "zod";

const reviewSchema = z.object({
  vendorId: z.string().min(1),
  authorName: z.string().min(2, "שם נדרש").max(100),
  authorEmail: z.string().email("אימייל לא תקין").max(255),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(20, "ביקורת קצרה מדי — לפחות 20 תווים").max(2000),
});

describe("review submission schema", () => {
  const valid = {
    vendorId: "vendor-123",
    authorName: "נועה כהן",
    authorEmail: "noa@example.com",
    rating: 5,
    body: "ספק מקצועי ואמין מאוד, ממליצה בחום לכולם!",
  };

  it("accepts a valid minimal review", () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a review with optional title", () => {
    expect(
      reviewSchema.safeParse({ ...valid, title: "ממליצה בחום" }).success
    ).toBe(true);
  });

  it("rejects rating below 1", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it("rejects rating above 5", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 4.5 }).success).toBe(
      false
    );
  });

  it("rejects body shorter than 20 chars", () => {
    expect(
      reviewSchema.safeParse({ ...valid, body: "קצר מדי" }).success
    ).toBe(false);
  });

  it("rejects body longer than 2000 chars", () => {
    expect(
      reviewSchema.safeParse({ ...valid, body: "א".repeat(2001) }).success
    ).toBe(false);
  });

  it("rejects title longer than 100 chars", () => {
    expect(
      reviewSchema.safeParse({ ...valid, title: "א".repeat(101) }).success
    ).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      reviewSchema.safeParse({ ...valid, authorEmail: "not-email" }).success
    ).toBe(false);
  });
});
