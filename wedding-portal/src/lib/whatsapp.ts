/**
 * WhatsApp integration via WAHA (WhatsApp HTTP API)
 * Self-hosted service — optional, gracefully degraded if not configured.
 */

const WA_URL = process.env.WHATSAPP_SERVICE_URL ?? "";
const WA_KEY = process.env.WHATSAPP_SERVICE_API_KEY ?? "";
const WA_SESSION = process.env.WAHA_SESSION ?? "default";

export async function waIsReady(): Promise<boolean> {
  if (!WA_URL) return false;
  try {
    const res = await fetch(`${WA_URL}/api/sessions/${WA_SESSION}`, {
      headers: { "X-Api-Key": WA_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "WORKING";
  } catch {
    return false;
  }
}

export async function waSend(
  phone: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  if (!WA_URL) return { ok: false, error: "WAHA not configured" };
  try {
    const chatId = phone.replace(/\D/g, "") + "@c.us";
    const res = await fetch(`${WA_URL}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WA_KEY,
      },
      body: JSON.stringify({ chatId, text: message, session: WA_SESSION }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return { ok: false, error: err.slice(0, 200) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}
