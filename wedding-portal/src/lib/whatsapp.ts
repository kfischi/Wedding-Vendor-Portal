/**
 * WhatsApp sender — calls WAHA (WhatsApp HTTP API) self-hosted on Coolify.
 * https://waha.devlike.pro
 *
 * Set in env:
 *   WHATSAPP_SERVICE_URL=https://waha.your-coolify-domain.com
 *   WHATSAPP_SERVICE_API_KEY=your-secret-key
 *   WAHA_SESSION=default   (optional, defaults to "default")
 */

const WA_URL = process.env.WHATSAPP_SERVICE_URL ?? "";
const WA_KEY = process.env.WHATSAPP_SERVICE_API_KEY ?? "";
const WA_SESSION = process.env.WAHA_SESSION ?? "default";

export interface WaSendResult {
  ok: boolean;
  to?: string;
  error?: string;
}

/** Normalize Israeli phone → E.164 chatId format (972XXXXXXXXX@c.us) */
function normalizePhone(phone: string): string | null {
  const digits = String(phone).replace(/\D/g, "");
  let normalized: string | null = null;

  if (digits.startsWith("972") && digits.length >= 12) normalized = digits;
  else if (digits.startsWith("0") && digits.length === 10) normalized = "972" + digits.slice(1);
  else if (digits.length === 9 && digits.startsWith("5")) normalized = "972" + digits;

  return normalized ? `${normalized}@c.us` : null;
}

/** Check if the WAHA session is connected and ready. */
export async function waIsReady(): Promise<boolean> {
  if (!WA_URL) return false;
  try {
    const res = await fetch(`${WA_URL}/api/sessions/${WA_SESSION}`, {
      headers: { "X-Api-Key": WA_KEY },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "WORKING";
  } catch {
    return false;
  }
}

/** Send a single WhatsApp message via WAHA. */
export async function waSend(phone: string, message: string): Promise<WaSendResult> {
  if (!WA_URL || !WA_KEY) {
    return { ok: false, error: "WhatsApp service not configured" };
  }

  const chatId = normalizePhone(phone);
  if (!chatId) {
    return { ok: false, error: "Invalid phone number format" };
  }

  try {
    const res = await fetch(`${WA_URL}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WA_KEY,
      },
      body: JSON.stringify({ chatId, text: message, session: WA_SESSION }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      return { ok: false, error: err.message ?? err.error ?? `HTTP ${res.status}` };
    }

    return { ok: true, to: chatId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Connection error",
    };
  }
}

/** Send multiple WhatsApp messages via WAHA. */
export async function waSendBatch(
  items: { phone: string; message: string }[]
): Promise<{ phone: string; ok: boolean; error?: string }[]> {
  if (!WA_URL || !WA_KEY) {
    return items.map((i) => ({ phone: i.phone, ok: false, error: "not configured" }));
  }

  const results: { phone: string; ok: boolean; error?: string }[] = [];

  for (const { phone, message } of items) {
    const result = await waSend(phone, message);
    results.push({ phone, ok: result.ok, error: result.error });
    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 800));
  }

  return results;
}
