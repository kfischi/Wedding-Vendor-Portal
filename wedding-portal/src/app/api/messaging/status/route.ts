/**
 * GET /api/messaging/status
 * Returns WhatsApp service status + message history for authenticated vendor.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { vendors, leads, messages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { waIsReady } from "@/lib/whatsapp";
import { WHATSAPP_SERVICE_URL } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check WA service status (non-blocking)
  const waReady = WHATSAPP_SERVICE_URL ? await waIsReady() : false;

  let vendorMessages: {
    id: string;
    channel: string;
    recipient: string;
    subject: string | null;
    body: string;
    status: string;
    createdAt: string;
    leadName: string | null;
  }[] = [];

  try {
    const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, user.id)).limit(1);
    if (vendor) {
      const rows = await db
        .select({
          id: messages.id,
          channel: messages.channel,
          recipient: messages.recipient,
          subject: messages.subject,
          body: messages.body,
          status: messages.status,
          createdAt: messages.createdAt,
          leadName: leads.name,
        })
        .from(messages)
        .leftJoin(leads, eq(messages.leadId, leads.id))
        .where(eq(messages.vendorId, vendor.id))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      vendorMessages = rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch {
    // DB not ready
  }

  return NextResponse.json({
    whatsapp: {
      configured: !!WHATSAPP_SERVICE_URL,
      ready: waReady,
    },
    messages: vendorMessages,
  });
}
