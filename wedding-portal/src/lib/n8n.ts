/**
 * N8N Integration — centralized webhook service
 *
 * All events sent to N8N go through this module.
 * Every call is non-blocking (fire-and-forget) and never throws.
 *
 * Environment variables:
 *   N8N_WEBHOOK_URL  — base webhook URL (required to activate)
 *   N8N_API_KEY      — optional Bearer token for webhook auth
 */

import { N8N_WEBHOOK_URL, N8N_API_KEY } from "@/lib/env";

// ── Event type definitions ────────────────────────────────────────────────────

export type N8nEventType =
  | "lead.new"
  | "vendor.registered"
  | "vendor.payment_completed";

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
  stripe_session_id: string;
  stripe_customer_id: string | null;
  timestamp: string;
}

export type N8nEvent =
  | N8nLeadNew
  | N8nVendorRegistered
  | N8nVendorPaymentCompleted;

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send an event to N8N webhook. Never throws — errors are logged only.
 */
export async function sendN8nEvent(payload: N8nEvent): Promise<void> {
  if (!N8N_WEBHOOK_URL) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (N8N_API_KEY) {
    headers["Authorization"] = `Bearer ${N8N_API_KEY}`;
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        `[n8n] Webhook responded with ${res.status} for event "${payload.event}"`
      );
    }
  } catch (err) {
    console.error(`[n8n] Failed to send event "${payload.event}":`, err);
  }
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export function n8nLeadNew(data: Omit<N8nLeadNew, "event" | "timestamp">): Promise<void> {
  return sendN8nEvent({
    event: "lead.new",
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function n8nVendorRegistered(
  data: Omit<N8nVendorRegistered, "event" | "timestamp">
): Promise<void> {
  return sendN8nEvent({
    event: "vendor.registered",
    timestamp: new Date().toISOString(),
    ...data,
  });
}

export function n8nVendorPaymentCompleted(
  data: Omit<N8nVendorPaymentCompleted, "event" | "timestamp">
): Promise<void> {
  return sendN8nEvent({
    event: "vendor.payment_completed",
    timestamp: new Date().toISOString(),
    ...data,
  });
}
