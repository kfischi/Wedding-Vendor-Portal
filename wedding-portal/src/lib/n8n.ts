/**
 * N8N Integration — centralized webhook service with DB logging
 *
 * All events sent to N8N go through this module.
 * Every call is non-blocking (fire-and-forget) and never throws.
 * All events are logged to automation_logs table.
 *
 * Environment variables:
 *   N8N_WEBHOOK_URL  — base webhook URL (required to activate)
 *   N8N_API_KEY      — optional Bearer token for webhook auth
 */

import { N8N_WEBHOOK_URL, N8N_API_KEY } from "@/lib/env";

// ── Event type definitions ────────────────────────────────────────────────────

export type N8nEventType =
  | "lead.new"
  | "lead.scored"
  | "vendor.registered"
  | "vendor.payment_completed"
  | "vendor.subscription_cancelled"
  | "vendor.subscription_updated"
  | "review.submitted"
  | "review.approved"
  | "blog.published"
  | "seo.ping"
  | "system.health_check";

export interface N8nLeadNew {
  event: "lead.new";
  lead_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_phone: string | null;
  vendor_email: string;
  lead_name: string;
  lead_email: string;
  lead_phone: string | null;
  event_date: string | null;
  message: string;
  timestamp: string;
}

export interface N8nLeadScored {
  event: "lead.scored";
  lead_id: string;
  vendor_id: string;
  score: number;
  label: "hot" | "warm" | "cold";
  reason: string;
  timestamp: string;
}

export interface N8nVendorRegistered {
  event: "vendor.registered";
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string | null;
  category: string;
  city: string;
  plan: string;
  registration_type: "trial" | "paid";
  trial_ends_at: string | null;
  timestamp: string;
}

export interface N8nVendorPaymentCompleted {
  event: "vendor.payment_completed";
  vendor_email: string;
  plan: string;
  payment_provider: "payme" | "stripe";
  transaction_id: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface N8nVendorSubscriptionCancelled {
  event: "vendor.subscription_cancelled";
  vendor_id: string;
  vendor_email: string;
  plan: string;
  reason: string | null;
  timestamp: string;
}

export interface N8nReviewSubmitted {
  event: "review.submitted";
  vendor_id: string;
  vendor_name: string;
  author_name: string;
  rating: number;
  timestamp: string;
}

export interface N8nBlogPublished {
  event: "blog.published";
  post_id: string;
  slug: string;
  title: string;
  url: string;
  is_ai_generated: boolean;
  timestamp: string;
}

export interface N8nSeoPing {
  event: "seo.ping";
  url: string;
  type: "vendor" | "blog" | "category" | "homepage";
  timestamp: string;
}

export type N8nEvent =
  | N8nLeadNew
  | N8nLeadScored
  | N8nVendorRegistered
  | N8nVendorPaymentCompleted
  | N8nVendorSubscriptionCancelled
  | N8nReviewSubmitted
  | N8nBlogPublished
  | N8nSeoPing;

// ── DB logging helper ─────────────────────────────────────────────────────────

async function logToDb(
  event: string,
  status: "sent" | "failed" | "skipped",
  payload: Record<string, unknown>,
  opts?: {
    durationMs?: number;
    responseCode?: number;
    error?: string;
    vendorId?: string;
    leadId?: string;
  }
): Promise<void> {
  // Lazy import to avoid circular deps in tests
  try {
    const { db } = await import("@/lib/db/db");
    const { automationLogs } = await import("@/lib/db/schema");
    await db.insert(automationLogs).values({
      id: crypto.randomUUID(),
      event,
      channel: "n8n",
      status,
      payload,
      durationMs: opts?.durationMs,
      responseCode: opts?.responseCode,
      error: opts?.error,
      vendorId: opts?.vendorId ?? null,
      leadId: opts?.leadId ?? null,
    });
  } catch {
    // Never let logging crash the main flow
  }
}

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send an event to N8N webhook with DB logging. Never throws.
 */
export async function sendN8nEvent(
  payload: N8nEvent,
  opts?: { vendorId?: string; leadId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  if (!N8N_WEBHOOK_URL) {
    void logToDb(payload.event, "skipped", payload as unknown as Record<string, unknown>, {
      error: "N8N_WEBHOOK_URL not configured",
      vendorId: opts?.vendorId,
      leadId: opts?.leadId,
    });
    return { ok: false, durationMs: 0 };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (N8N_API_KEY) {
    headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
  }

  const start = Date.now();

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const durationMs = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        `[n8n] Webhook responded with ${res.status} for event "${payload.event}"`
      );
      void logToDb(payload.event, "failed", payload as unknown as Record<string, unknown>, {
        durationMs,
        responseCode: res.status,
        error: errText.slice(0, 500),
        vendorId: opts?.vendorId,
        leadId: opts?.leadId,
      });
      return { ok: false, durationMs };
    }

    void logToDb(payload.event, "sent", payload as unknown as Record<string, unknown>, {
      durationMs,
      responseCode: res.status,
      vendorId: opts?.vendorId,
      leadId: opts?.leadId,
    });

    return { ok: true, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Connection error";
    console.error(`[n8n] Failed to send event "${payload.event}":`, err);
    void logToDb(payload.event, "failed", payload as unknown as Record<string, unknown>, {
      durationMs,
      error,
      vendorId: opts?.vendorId,
      leadId: opts?.leadId,
    });
    return { ok: false, durationMs };
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export function n8nLeadNew(
  data: Omit<N8nLeadNew, "event" | "timestamp">,
  opts?: { vendorId?: string; leadId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    { event: "lead.new", timestamp: new Date().toISOString(), ...data },
    opts
  );
}

export function n8nLeadScored(
  data: Omit<N8nLeadScored, "event" | "timestamp">,
  opts?: { vendorId?: string; leadId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    { event: "lead.scored", timestamp: new Date().toISOString(), ...data },
    opts
  );
}

export function n8nVendorRegistered(
  data: Omit<N8nVendorRegistered, "event" | "timestamp">,
  opts?: { vendorId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    { event: "vendor.registered", timestamp: new Date().toISOString(), ...data },
    opts
  );
}

export function n8nVendorPaymentCompleted(
  data: Omit<N8nVendorPaymentCompleted, "event" | "timestamp">,
  opts?: { vendorId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    {
      event: "vendor.payment_completed",
      timestamp: new Date().toISOString(),
      ...data,
    },
    opts
  );
}

export function n8nVendorSubscriptionCancelled(
  data: Omit<N8nVendorSubscriptionCancelled, "event" | "timestamp">,
  opts?: { vendorId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    {
      event: "vendor.subscription_cancelled",
      timestamp: new Date().toISOString(),
      ...data,
    },
    opts
  );
}

export function n8nReviewSubmitted(
  data: Omit<N8nReviewSubmitted, "event" | "timestamp">,
  opts?: { vendorId?: string }
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent(
    {
      event: "review.submitted",
      timestamp: new Date().toISOString(),
      ...data,
    },
    opts
  );
}

export function n8nBlogPublished(
  data: Omit<N8nBlogPublished, "event" | "timestamp">
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent({
    event: "blog.published",
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function n8nSeoPing(
  data: Omit<N8nSeoPing, "event" | "timestamp">
): Promise<{ ok: boolean; durationMs: number }> {
  return sendN8nEvent({
    event: "seo.ping",
    timestamp: new Date().toISOString(),
    ...data,
  });
}
