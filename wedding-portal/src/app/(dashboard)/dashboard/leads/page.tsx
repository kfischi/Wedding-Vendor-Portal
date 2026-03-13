export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { LeadStatusSelect } from "@/components/dashboard/LeadStatusSelect";
import { MessageSquare } from "lucide-react";
import type { Lead } from "@/lib/db/schema";

export const metadata: Metadata = { title: "לידים | WeddingPro" };

const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  qualified: "מוסמך",
  closed: "סגור",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatEventDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  let vendorLeads: Lead[] = [];

  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;

    if (vendor) {
      vendorLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.vendorId, vendor.id))
        .orderBy(desc(leads.createdAt));
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

  const statusCounts = vendorLeads.reduce(
    (acc, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-script text-xl text-gold">ניהול</p>
          <h1 className="font-display text-4xl text-obsidian">לידים</h1>
        </div>
        <span className="text-sm text-stone bg-cream-white border border-champagne px-3 py-1.5 rounded-full">
          סה&quot;כ {vendorLeads.length} פניות
        </span>
      </div>

      {/* Status summary pills */}
      {vendorLeads.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["new", "contacted", "qualified", "closed"] as Lead["status"][]).map((s) => (
            <span
              key={s}
              className="text-xs px-3 py-1 rounded-full bg-cream-white border border-champagne text-stone"
            >
              {STATUS_LABELS[s]}: <strong className="text-obsidian">{statusCounts[s] ?? 0}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Empty state */}
      {vendorLeads.length === 0 ? (
        <div className="text-center py-20 bg-cream-white rounded-2xl border border-champagne card-shadow">
          <div className="w-16 h-16 rounded-full bg-champagne/40 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-stone/50" />
          </div>
          <p className="font-display text-2xl text-obsidian mb-2">עדיין אין פניות</p>
          <p className="text-stone text-sm">שתפו את הפרופיל שלכם כדי להתחיל לקבל לידים!</p>
        </div>
      ) : (
        <div className="bg-cream-white rounded-2xl border border-champagne card-shadow overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-champagne bg-champagne/20 text-right">
                  <th className="px-4 py-3 font-medium text-stone">תאריך פנייה</th>
                  <th className="px-4 py-3 font-medium text-stone">שם</th>
                  <th className="px-4 py-3 font-medium text-stone">טלפון</th>
                  <th className="px-4 py-3 font-medium text-stone">אימייל</th>
                  <th className="px-4 py-3 font-medium text-stone">תאריך אירוע</th>
                  <th className="px-4 py-3 font-medium text-stone">הודעה</th>
                  <th className="px-4 py-3 font-medium text-stone">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/50">
                {vendorLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-champagne/10 transition-colors">
                    <td className="px-4 py-3 text-stone whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-obsidian whitespace-nowrap">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-stone" dir="ltr">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-dusty-rose transition-colors"
                        >
                          {lead.phone}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone max-w-[180px]" dir="ltr">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:text-dusty-rose transition-colors break-all text-xs"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-stone whitespace-nowrap">
                      {formatEventDate(lead.eventDate)}
                    </td>
                    <td className="px-4 py-3 text-stone max-w-[200px]">
                      <p className="line-clamp-2 text-xs">{lead.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusSelect
                        leadId={lead.id}
                        currentStatus={lead.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-champagne/50">
            {vendorLeads.map((lead) => (
              <div key={lead.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-obsidian">{lead.name}</p>
                    <p className="text-xs text-stone mt-0.5">{formatDate(lead.createdAt)}</p>
                  </div>
                  <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                </div>

                <div className="space-y-1 text-sm text-stone">
                  {lead.phone && (
                    <p dir="ltr">
                      📞{" "}
                      <a href={`tel:${lead.phone}`} className="hover:text-dusty-rose">
                        {lead.phone}
                      </a>
                    </p>
                  )}
                  <p dir="ltr" className="break-all">
                    ✉️{" "}
                    <a href={`mailto:${lead.email}`} className="hover:text-dusty-rose">
                      {lead.email}
                    </a>
                  </p>
                  {lead.eventDate && (
                    <p>📅 {formatEventDate(lead.eventDate)}</p>
                  )}
                </div>

                <p className="text-xs text-stone/70 bg-champagne/20 rounded-lg px-3 py-2 line-clamp-3">
                  {lead.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
