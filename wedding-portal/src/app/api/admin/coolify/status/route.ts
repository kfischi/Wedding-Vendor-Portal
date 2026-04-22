import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COOLIFY_URL = process.env.COOLIFY_API_URL ?? "";
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN ?? "";

interface CoolifyApp {
  id: string;
  name: string;
  status: string;
  fqdn?: string;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!COOLIFY_URL || !COOLIFY_TOKEN) {
    return NextResponse.json({
      configured: false,
      version: null,
      apps: [],
      error: "COOLIFY_API_URL or COOLIFY_TOKEN not configured",
    });
  }

  try {
    const [versionRes, appsRes] = await Promise.allSettled([
      fetch(`${COOLIFY_URL}/api/v1/version`, {
        headers: { Authorization: `Bearer ${COOLIFY_TOKEN}` },
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`${COOLIFY_URL}/api/v1/applications`, {
        headers: { Authorization: `Bearer ${COOLIFY_TOKEN}` },
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    let version: string | null = null;
    let apps: CoolifyApp[] = [];

    if (versionRes.status === "fulfilled" && versionRes.value.ok) {
      const data = await versionRes.value.json();
      version = data.version ?? null;
    }

    if (appsRes.status === "fulfilled" && appsRes.value.ok) {
      const data = await appsRes.value.json();
      apps = Array.isArray(data) ? data : [];
    }

    return NextResponse.json({
      configured: true,
      version,
      apps: apps.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        url: a.fqdn ?? null,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      version: null,
      apps: [],
      error: err instanceof Error ? err.message : "Connection failed",
    });
  }
}

// POST — restart an app on Coolify
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!COOLIFY_URL || !COOLIFY_TOKEN) {
    return NextResponse.json({ error: "Coolify not configured" }, { status: 400 });
  }

  const { appId } = await req.json() as { appId: string };
  if (!appId) return NextResponse.json({ error: "appId required" }, { status: 400 });

  try {
    const res = await fetch(`${COOLIFY_URL}/api/v1/applications/${appId}/restart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COOLIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Restart failed",
    });
  }
}
