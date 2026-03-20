/**
 * WhatsApp sender — calls the local whatsapp-web.js microservice.
 *
 * Set in env:
 *   WHATSAPP_SERVICE_URL=http://localhost:3001   (or your hosted URL)
 *   WHATSAPP_SERVICE_API_KEY=your-secret-key
 */

const WA_URL = process.env.WHATSAPP_SERVICE_URL ?? "";
const WA_KEY = process.env.WHATSAPP_SERVICE_API_KEY ?? "";

export interface WaSendResult {
  ok: boolean;
  to?: string;
  error?: string;
}

/** Check if the WhatsApp service is reachable and ready. */
export async function waIsReady(): Promise<boolean> {
  if (!WA_URL) return false;
  try {
    const res = await fetch(`${WA_URL}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json()) as { status: string };
    return data.status === "ready";
  } catch {
    return false;
  }
}

/** Send a single WhatsApp message. */
export async function waSend(phone: string, message: string): Promise<WaSendResult> {
  if (!WA_URL || !WA_KEY) {
    return { ok: false, error: "WhatsApp service not configured" };
  }

  try {
    const res = await fetch(`${WA_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WA_KEY,
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(15000),
    });

    const data = (await res.json()) as { success?: boolean; to?: string; error?: string };

    if (!res.ok || !data.success) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, to: data.to };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Connection error",
    };
  }
}

/** Send multiple WhatsApp messages. */
export async function waSendBatch(
  items: { phone: string; message: string }[]
): Promise<{ phone: string; ok: boolean; error?: string }[]> {
  if (!WA_URL || !WA_KEY) {
    return items.map((i) => ({ phone: i.phone, ok: false, error: "not configured" }));
  }

  try {
    const res = await fetch(`${WA_URL}/send-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WA_KEY,
      },
      body: JSON.stringify({ messages: items }),
      signal: AbortSignal.timeout(60000),
    });

    const data = (await res.json()) as {
      results: { phone: string; success: boolean; error?: string }[];
    };
    return (data.results ?? []).map((r) => ({
      phone: r.phone,
      ok: r.success,
      error: r.error,
    }));
  } catch (err) {
    return items.map((i) => ({
      phone: i.phone,
      ok: false,
      error: err instanceof Error ? err.message : "Connection error",
    }));
  }
}
