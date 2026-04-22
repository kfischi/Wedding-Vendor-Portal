import { randomBytes } from "node:crypto";

/**
 * Generate a URL-safe random token for one-shot review requests.
 * 24 bytes → 32-char base64url string → ~192 bits of entropy (unguessable).
 */
export function generateReviewToken(): string {
  return randomBytes(24).toString("base64url");
}

/** 30-day expiry from now. */
export function reviewTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}
