import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Tests for the lead submission schema validation.
 * Tests the Zod schema in isolation — no DB or network calls.
 */

const leadSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(2, "שם נדרש").max(100),
  email: z.string().email("אימייל לא תקין").max(255),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, "הודעה קצרה מדי").max(2000),
  eventDate: z.string().max(20).optional(),
});

describe("lead submission schema", () => {
  const valid = {
    vendorId: "vendor-123",
    name: "ישראל ישראלי",
    email: "test@example.com",
    message: "שלום, אני מעוניין לשמוע פרטים נוספים על השירות שלכם.",
  };

  it("accepts a valid minimal payload", () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts all optional fields", () => {
    expect(
      leadSchema.safeParse({
        ...valid,
        phone: "050-1234567",
        eventDate: "15/06/2026",
      }).success
    ).toBe(true);
  });

  it("rejects missing vendorId", () => {
    const { vendorId: _, ...rest } = valid;
    expect(leadSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(leadSchema.safeParse({ ...valid, name: "א" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(
      leadSchema.safeParse({ ...valid, email: "not-an-email" }).success
    ).toBe(false);
  });

  it("rejects message shorter than 10 chars", () => {
    expect(
      leadSchema.safeParse({ ...valid, message: "קצר" }).success
    ).toBe(false);
  });

  it("rejects message longer than 2000 chars", () => {
    expect(
      leadSchema.safeParse({ ...valid, message: "א".repeat(2001) }).success
    ).toBe(false);
  });

  it("rejects email longer than 255 chars", () => {
    expect(
      leadSchema.safeParse({
        ...valid,
        email: "a".repeat(250) + "@b.com",
      }).success
    ).toBe(false);
  });

  it("returns the correct error message for invalid email", () => {
    const result = leadSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("אימייל לא תקין");
    }
  });
});
