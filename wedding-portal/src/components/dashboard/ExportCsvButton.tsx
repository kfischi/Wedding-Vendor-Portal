"use client";

import { Download } from "lucide-react";

interface LeadExport {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  eventDate: string | null;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  qualified: "מוסמך",
  closed: "סגור",
};

export function ExportCsvButton({ leads }: { leads: LeadExport[] }) {
  function handleExport() {
    const headers = ["שם", "אימייל", "טלפון", "הודעה", "תאריך פנייה", "תאריך אירוע", "סטטוס"];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone ?? "",
      l.message,
      new Date(l.createdAt).toLocaleDateString("he-IL"),
      l.eventDate ? new Date(l.eventDate).toLocaleDateString("he-IL") : "",
      STATUS_LABELS[l.status] ?? l.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 text-xs font-medium text-stone/70 bg-white border border-champagne/60 px-3 py-1.5 rounded-lg hover:bg-champagne/20 hover:text-obsidian transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      ייצוא CSV
    </button>
  );
}
