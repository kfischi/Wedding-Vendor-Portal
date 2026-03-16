"use client";

import { useEffect } from "react";

export function ViewCountTracker({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    // Fire-and-forget — don't block rendering
    fetch(`/api/vendors/${vendorId}/view`, { method: "POST" }).catch(() => {});
  }, [vendorId]);

  return null;
}
