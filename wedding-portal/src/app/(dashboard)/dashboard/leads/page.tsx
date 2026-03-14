export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";
import { LeadStatusSelect } from "@/components/dashboard/LeadStatusSelect";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import { MessageSquare } from "lucide-react";
import type { Lead } from "@/lib/db/schema";

export const metadata: Metadata = { title: "לידים | WeddingPro" };

const STATUS_LABELS: Record<Lead["status"], string> = {
  new:       "חדש",
  contacted: "יצרנו קשר",
  qualified: "מוסמך",
  closed:    "סגור",
};

const STATUS_COLORS: Record<Lead["status"], string> = {
  new:       "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  qualified: "bg-green-50 text-green-700 border-green-200",
  closed:    "bg-stone/10 text-stone border-stone/20",
};

const STATUS_DOT: Record<Lead["status"], string> = {
  new:       "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-green-500",
  closed:    "bg-stone/40",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(date));
}

function formatEventDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
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

  // Serialize for client component
  const serializedLeads = vendorLeads.map((l) => ({
    name:      l.name,
    email:     l.email,
    phone:     l.phone,
    message:   l.message,
    createdAt: l.createdAt.toISOString(),
    eventDate: l.eventDate?.toISOString() ?? null,
    status:    l.status,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-script text-xl text-gold">ניהול</p>
          <h1 className="font-display text-3xl lg:text-4xl text-obsidian leading-tight">לידים</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {vendorLeads.length > 0 && <ExportCsvButton leads={serializedLeads} />}
          <span className="text-xs text-stone/60 bg-white border border-champagne/60 px-3 py-1.5 rounded-full">
            סה״כ {vendorLeads.length}
          </span>
        </div>
      </div>

      {/* Status summary pills */}
      {vendorLeads.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["new", "contacted", "qualified", "closed"] as Lead["status"][]).map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_COLORS[s]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
              {STATUS_LABELS[s]}
              <span className="font-bold">{statusCounts[s] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {vendorLeads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-champagne/60 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-champagne/40 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-7 w-7 text-stone/40" />
          </div>
          <p className="font-display text-2xl text-obsidian mb-2">עדיין אין פניות</p>
          <p className="text-stone/60 text-sm">שתפו את הפרופיל שלכם כדי להתחיל לקבל לידים!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-champagne/60 shadow-sm overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-champagne/50 bg-champagne/20 text-right">
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">פונה</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">טלפון</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">תאריך פנייה</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">תאריך אירוע</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">הודעה</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-stone/60 tracking-wide">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne/30">
                {vendorLeads.map((lead) => {
                  const initials = lead.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <tr key={lead.id} className="hover:bg-champagne/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush/50 to-dusty-rose/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-obsidian whitespace-nowrap">{lead.name}</p>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-xs text-stone/50 whitespace-nowrap hover:text-dusty-rose transition-colors"
                              dir="ltr"
                            >
                              {lead.email}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone whitespace-nowrap" dir="ltr">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="hover:text-dusty-rose transition-colors text-sm">
                            {lead.phone}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 text-stone/60 whitespace-nowrap text-xs">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-stone/60 whitespace-nowrap text-xs">
                        {formatEventDate(lead.eventDate)}
                      </td>
                      <td className="px-5 py-4 text-stone/60 max-w-[200px]">
                        <p className="line-clamp-2 text-xs">{lead.message}</p>
                      </td>
                      <td className="px-5 py-4">
                        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-champagne/30">
            {vendorLeads.map((lead) => {
              const initials = lead.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              return (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blush/50 to-dusty-rose/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-obsidian text-sm">{lead.name}</p>
                        <p className="text-xs text-stone/50">{formatDate(lead.createdAt)}</p>
                      </div>
                    </div>
                    <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                  </div>

                  <div className="space-y-1.5 text-xs text-stone/60 pr-12">
                    {lead.phone && (
                      <p dir="ltr">
                        📞{" "}
                        <a href={`tel:${lead.phone}`} className="hover:text-dusty-rose">{lead.phone}</a>
                      </p>
                    )}
                    <p dir="ltr" className="break-all">
                      ✉️{" "}
                      <a href={`mailto:${lead.email}`} className="hover:text-dusty-rose">{lead.email}</a>
                    </p>
                    {lead.eventDate && <p>📅 {formatEventDate(lead.eventDate)}</p>}
                  </div>

                  <div className="mr-12">
                    <p className="text-xs text-stone/50 bg-champagne/20 rounded-xl px-3 py-2 line-clamp-3">
                      {lead.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
