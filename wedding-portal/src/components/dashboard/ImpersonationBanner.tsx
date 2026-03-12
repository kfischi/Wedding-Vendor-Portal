"use client";

import { stopImpersonation } from "@/app/(admin)/admin/actions";
import { ShieldAlert, ArrowRight } from "lucide-react";

export function ImpersonationBanner() {
  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">מצב ייצוג ספק (Impersonation) פעיל</span>
      </div>
      <form action={stopImpersonation}>
        <button
          type="submit"
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          חזור לאדמין
        </button>
      </form>
    </div>
  );
}
