import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";

const schema = z.object({
  businessName:     z.string().min(2).max(100),
  category:         z.string().min(1),
  city:             z.string().min(1).max(50),
  region:           z.string().optional(),
  shortDescription: z.string().max(160).optional(),
  description:      z.string().max(1000).optional(),
  phone:            z.string().max(20).optional(),
  email:            z.string().email().max(255),
  website:          z.string().url().optional().or(z.literal("")),
  instagram:        z.string().max(50).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: Record<string, string>;
  try {
    const fd = await request.formData();
    raw = Object.fromEntries(
      [...fd.entries()].map(([k, v]) => [k, String(v)])
    );
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "שגיאה בנתונים" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  try {
    await db
      .update(vendors)
      .set({
        businessName:     d.businessName,
        category:         d.category as typeof vendors.$inferSelect["category"],
        city:             d.city,
        region:           d.region ?? null,
        shortDescription: d.shortDescription ?? null,
        description:      d.description ?? null,
        phone:            d.phone ?? null,
        email:            d.email,
        website:          d.website || null,
        instagram:        d.instagram ?? null,
        updatedAt:        new Date(),
      })
      .where(eq(vendors.userId, user.id));
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
