"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

interface Props {
  leadId: string;
}

export function ReviewRequestButton({ leadId }: Props) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setSent(true);
      toast.success("בקשת ביקורת נשלחה בהצלחה ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
        <Star className="h-3 w-3 fill-current" /> נשלח
      </span>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      title="שלח בקשת ביקורת ללקוח"
      className="p-1.5 rounded-lg transition-colors hover:bg-gold/10 text-stone/40 hover:text-gold disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Star className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
