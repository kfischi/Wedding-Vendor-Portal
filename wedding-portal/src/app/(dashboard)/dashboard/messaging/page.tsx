export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads, messages } from "@/lib/db/schema";
import { waIsReady } from "@/lib/whatsapp";
import { WHATSAPP_SERVICE_URL } from "@/lib/env";
import { MessagingPanel } from "@/components/dashboard/MessagingPanel";
import { Mail, MessageCircle, Send, Wifi, WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "הודעות | WeddingPro" };

export default async function MessagingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let vendorLeads: { id: string; name: string; email: string; phone: string | null; status: string }[] = [];
  let msgHistory: {
    id: string; channel: string; recipient: string; subject: string | null;
    body: string; status: string; createdAt: string; leadName: string | null;
  }[] = [];
  let waReady = false;
  const waConfigured = !!WHATSAPP_SERVICE_URL;

  try {
    const rows = await db.select().from(vendors).where(eq(vendors.userId, user.id)).limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      [vendorLeads, msgHistory, waReady] = await Promise.all([
        db
          .select({ id: leads.id, name: leads.name, email: leads.email, phone: leads.phone, status: leads.status })
          .from(leads)
          .where(eq(leads.vendorId, vendor.id))
          .orderBy(desc(leads.createdAt))
          .limit(100),
        db
          .select({
            id: messages.id, channel: messages.channel, recipient: messages.recipient,
            subject: messages.subject, body: messages.body, status: messages.status,
            createdAt: messages.createdAt, leadName: leads.name,
          })
          .from(messages)
          .leftJoin(leads, eq(messages.leadId, leads.id))
          .where(eq(messages.vendorId, vendor.id))
          .orderBy(desc(messages.createdAt))
          .limit(50)
          .then((rows) => rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))),
        waConfigured ? waIsReady() : Promise.resolve(false),
      ]);
    }
  } catch {
    // DB not connected
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא.</p>
      </div>
    );
  }

  const emailCount = msgHistory.filter((m) => m.channel === "email").length;
  const waCount = msgHistory.filter((m) => m.channel === "whatsapp").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-script text-xl text-gold">ניהול</p>
          <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">מרכז הודעות</h1>
        </div>

        {/* Channel stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-champagne/60 rounded-full">
            <Mail className="h-3.5 w-3.5 text-stone/40" />
            <span>{emailCount} אימיילים</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-champagne/60 rounded-full">
            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
            <span>{waCount} WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border"
            style={{
              background: waReady ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.08)",
              borderColor: waReady ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)",
              color: waReady ? "#16a34a" : "#d97706",
            }}
          >
            {waReady
              ? <><Wifi className="h-3.5 w-3.5" /> WA מחובר</>
              : <><WifiOff className="h-3.5 w-3.5" /> WA לא מחובר</>
            }
          </div>
        </div>
      </div>

      {/* Empty leads state */}
      {vendorLeads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-champagne/60 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-champagne/40 flex items-center justify-center mx-auto mb-4">
            <Send className="h-7 w-7 text-stone/40" />
          </div>
          <p className="font-display text-2xl text-obsidian mb-2">עדיין אין לידים</p>
          <p className="text-stone/60 text-sm">כשיתקבלו פניות, תוכל לשלוח להם הודעות מכאן.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-champagne/60 shadow-sm p-6">
          <MessagingPanel
            leads={vendorLeads}
            history={msgHistory}
            waReady={waReady}
            waConfigured={waConfigured}
          />
        </div>
      )}
    </div>
  );
}
