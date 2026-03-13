"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateLeadStatusAction } from "@/app/(dashboard)/dashboard/leads/actions";
import { cn } from "@/lib/utils";

type LeadStatus = "new" | "contacted" | "qualified" | "closed";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "חדש" },
  { value: "contacted", label: "יצרנו קשר" },
  { value: "qualified", label: "מוסמך" },
  { value: "closed", label: "סגור" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  qualified: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-stone/10 text-stone border-stone/20",
};

interface LeadStatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LeadStatus;
    const prev = status;
    setStatus(next);

    startTransition(async () => {
      try {
        await updateLeadStatusAction(leadId, next);
      } catch {
        setStatus(prev);
        toast.error("שגיאה בעדכון סטטוס");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className={cn(
        "text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-gold/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        STATUS_COLORS[status]
      )}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
