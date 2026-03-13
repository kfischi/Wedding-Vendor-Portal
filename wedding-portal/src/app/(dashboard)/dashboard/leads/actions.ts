"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, leads } from "@/lib/db/schema";

const statusSchema = z.enum(["new", "contacted", "qualified", "closed"]);

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) throw new Error("סטטוס לא תקין");

  // Verify ownership
  const vendorRows = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.userId, user.id))
    .limit(1);

  const vendor = vendorRows[0];
  if (!vendor) throw new Error("ספק לא נמצא");

  await db
    .update(leads)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.vendorId, vendor.id)));

  revalidatePath("/dashboard/leads");
}
