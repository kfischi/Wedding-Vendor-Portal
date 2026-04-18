import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  n8nLeadNew,
  n8nVendorRegistered,
  n8nBlogPublished,
  n8nSeoPing,
} from "@/lib/n8n";
import { waIsReady, waSend } from "@/lib/whatsapp";
import { ADMIN_PHONE, NEXT_PUBLIC_APP_URL } from "@/lib/env";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await req.json() as { type: string };
  const now = new Date().toISOString();
  const baseUrl = NEXT_PUBLIC_APP_URL;

  switch (type) {
    case "n8n.lead": {
      const result = await n8nLeadNew({
        lead_id: "test-lead-" + Date.now(),
        vendor_id: "test-vendor",
        vendor_name: "בדיקה — ספק לדוגמה",
        vendor_phone: ADMIN_PHONE || null,
        vendor_email: user.email ?? "test@example.com",
        lead_name: "ישראל ישראלי",
        lead_email: "couple@example.com",
        lead_phone: "0501234567",
        event_date: "15/06/2026",
        message: "זהו הודעת בדיקה מממשק הניהול",
      });
      return NextResponse.json({ ok: result.ok, durationMs: result.durationMs, type });
    }

    case "n8n.vendor": {
      const result = await n8nVendorRegistered({
        vendor_id: "test-vendor-" + Date.now(),
        vendor_name: "ספק בדיקה",
        vendor_email: user.email ?? "test@example.com",
        vendor_phone: ADMIN_PHONE || null,
        category: "photography",
        city: "תל אביב",
        plan: "standard",
        registration_type: "trial",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return NextResponse.json({ ok: result.ok, durationMs: result.durationMs, type });
    }

    case "n8n.blog": {
      const result = await n8nBlogPublished({
        post_id: "test-post-" + Date.now(),
        slug: "test-blog-post",
        title: "מאמר בדיקה — AI Blog Generation",
        url: `${baseUrl}/blog/test-blog-post`,
        is_ai_generated: true,
      });
      return NextResponse.json({ ok: result.ok, durationMs: result.durationMs, type });
    }

    case "n8n.seo": {
      const result = await n8nSeoPing({
        url: baseUrl,
        type: "homepage",
      });
      return NextResponse.json({ ok: result.ok, durationMs: result.durationMs, type });
    }

    case "waha.test": {
      if (!ADMIN_PHONE) {
        return NextResponse.json({ ok: false, error: "ADMIN_PHONE not configured" });
      }
      const ready = await waIsReady();
      if (!ready) {
        return NextResponse.json({ ok: false, error: "WAHA session not connected" });
      }
      const start = Date.now();
      const result = await waSend(
        ADMIN_PHONE,
        `✅ *WeddingPro — בדיקת WAHA*\nהודעת בדיקה מממשק הניהול\n${new Date().toLocaleString("he-IL")}`
      );
      return NextResponse.json({
        ok: result.ok,
        error: result.error,
        durationMs: Date.now() - start,
        type,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown test type" }, { status: 400 });
  }
}
