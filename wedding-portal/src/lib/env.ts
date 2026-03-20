/**
 * Centralised environment-variable validation.
 *
 * Import this module (or individual exports) in server-side code.
 * In production it throws immediately if a required variable is absent,
 * so the build/boot fails loudly rather than silently misbehaving at runtime.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `[env] Required environment variable "${key}" is missing. ` +
          `Set it in your deployment environment and restart.`
      );
    }
    // In development / test: warn but continue so the dev server boots
    console.warn(`[env] ⚠  "${key}" is not set (non-production — continuing)`);
    return "";
  }
  return value;
}

// ── Public (safe to expose to the browser) ────────────────────────────────────
export const NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const NEXT_PUBLIC_SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);

// ── Server-only ───────────────────────────────────────────────────────────────
export const DATABASE_URL = process.env.DATABASE_URL ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
// Stripe — optional (migrating to Payme; remove once fully replaced)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_STANDARD_PRICE_ID = process.env.STRIPE_STANDARD_PRICE_ID ?? "";
export const STRIPE_PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID ?? "";
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

// Optional — no throw if missing
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
export const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? "";
export const N8N_API_KEY = process.env.N8N_API_KEY ?? "";
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL ?? "";
export const WHATSAPP_SERVICE_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY ?? "";

// ── Rate-limit constants (single source of truth) ─────────────────────────────
export const RATE_LIMIT = {
  LEADS_PER_IP_PER_DAY: 3,
  LEADS_PER_EMAIL_PER_VENDOR_PER_DAY: 3,
  REVIEWS_PER_EMAIL_PER_VENDOR: 1,
  WINDOW_MS: 24 * 60 * 60 * 1000, // 24 h
} as const;

// ── Plan limits ───────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  MAX_IMAGES_STANDARD: 20,
  MAX_FILE_SIZE_STANDARD_MB: 10,
  MAX_FILE_SIZE_PREMIUM_MB: 100,
} as const;
