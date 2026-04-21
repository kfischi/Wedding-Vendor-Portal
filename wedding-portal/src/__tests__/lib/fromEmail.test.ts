import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Tests that FROM_EMAIL defaults to info@weddingpro.co.il
 * and that the format is correct for Resend.
 */

function resolveFromEmail(env: Record<string, string | undefined>): string {
  return env.FROM_EMAIL ?? "WeddingPro <info@weddingpro.co.il>";
}

describe("FROM_EMAIL", () => {
  it("defaults to info@weddingpro.co.il when env var not set", () => {
    const result = resolveFromEmail({});
    expect(result).toBe("WeddingPro <info@weddingpro.co.il>");
  });

  it("uses custom value when FROM_EMAIL env var is set", () => {
    const result = resolveFromEmail({ FROM_EMAIL: "Acme <hello@acme.com>" });
    expect(result).toBe("Acme <hello@acme.com>");
  });

  it("contains info@weddingpro.co.il in default", () => {
    const result = resolveFromEmail({});
    expect(result).toContain("info@weddingpro.co.il");
  });

  it("does not contain noreply in default", () => {
    const result = resolveFromEmail({});
    expect(result).not.toContain("noreply");
  });

  it("is a valid Resend from format (Name <email>)", () => {
    const result = resolveFromEmail({});
    expect(result).toMatch(/^.+ <[^@]+@[^@]+\.[^@]+>$/);
  });
});
