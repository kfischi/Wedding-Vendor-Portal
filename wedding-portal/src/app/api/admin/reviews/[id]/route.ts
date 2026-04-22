/**
 * Admin review moderation.
 *
 * PATCH  /api/admin/reviews/[id]  — body: { isPublished: boolean }
 * DELETE /api/admin/reviews/[id]  — soft delete (body = '[removed]')
 *
 * Auth: admin only (email match or vendors.role='admin').
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";
import { reviews, vendors } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/env";

export const runtime = "nodejs";

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) {
    return { ok: true, userId: user.id };
  }

  const [row] = await db
    .select({ role: vendors.role })
    .from(vendors)
    .where(eq(vendors.userId, user.id))
    .limit(1);

  if (row?.role === "admin") return { ok: true, userId: user.id };
  return { ok: false, status: 403, error: "Admin access required" };
}

const patchSchema = z.object({
  isPublished: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(reviews)
    .set({ isPublished: parsed.data.isPublished })
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id, isPublished: reviews.isPublished });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, review: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  // Soft delete — keep the row for audit/rate-limit purposes, but scrub content.
  const [updated] = await db
    .update(reviews)
    .set({ body: "[removed]", title: null, isPublished: false })
    .where(eq(reviews.id, id))
    .returning({ id: reviews.id });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
