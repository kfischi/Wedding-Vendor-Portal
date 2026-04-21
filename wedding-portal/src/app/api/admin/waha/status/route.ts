import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { waIsReady } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const WA_URL = process.env.WHATSAPP_SERVICE_URL ?? "";
const WA_KEY = process.env.WHATSAPP_SERVICE_API_KEY ?? "";
const WA_SESSION = process.env.WAHA_SESSION ?? "default";

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WA_URL) {
    return NextResponse.json({
      configured: false,
      connected: false,
      status: "not_configured",
      session: null,
      qr: null,
    });
  }

  // Get full session info from WAHA
  try {
    const [sessionRes, screenshotRes] = await Promise.allSettled([
      fetch(`${WA_URL}/api/sessions/${WA_SESSION}`, {
        headers: { "X-Api-Key": WA_KEY },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${WA_URL}/api/${WA_SESSION}/auth/qr?format=image`, {
        headers: { "X-Api-Key": WA_KEY },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    let sessionData: { status?: string; me?: { pushname?: string; id?: string } } = {};
    let qrDataUrl: string | null = null;

    if (sessionRes.status === "fulfilled" && sessionRes.value.ok) {
      sessionData = await sessionRes.value.json();
    }

    // QR is only available when not connected (SCAN_QR_CODE state)
    if (
      screenshotRes.status === "fulfilled" &&
      screenshotRes.value.ok &&
      sessionData.status !== "WORKING"
    ) {
      const buffer = await screenshotRes.value.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      qrDataUrl = `data:image/png;base64,${base64}`;
    }

    const connected = sessionData.status === "WORKING";

    return NextResponse.json({
      configured: true,
      connected,
      status: sessionData.status ?? "UNKNOWN",
      session: WA_SESSION,
      phone: sessionData.me?.id?.replace("@c.us", "") ?? null,
      name: sessionData.me?.pushname ?? null,
      qr: qrDataUrl,
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      connected: false,
      status: "ERROR",
      error: err instanceof Error ? err.message : "Connection failed",
      session: WA_SESSION,
      qr: null,
    });
  }
}

// POST — start or restart WAHA session
export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!WA_URL) {
    return NextResponse.json({ error: "WAHA not configured" }, { status: 400 });
  }

  try {
    const res = await fetch(`${WA_URL}/api/sessions/${WA_SESSION}/start`, {
      method: "POST",
      headers: { "X-Api-Key": WA_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ name: WA_SESSION }),
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to start session",
    });
  }
}
