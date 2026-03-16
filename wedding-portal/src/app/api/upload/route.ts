import { NextRequest, NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia } from "@/lib/db/schema";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary/upload";
import { PLAN_LIMITS } from "@/lib/env";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

async function getAuthenticatedVendor(userId: string) {
  const rows = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

// ── POST: Upload file ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let vendor;
  try {
    vendor = await getAuthenticatedVendor(user.id);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isPremium = vendor.plan === "premium";
  const isVideo = file.type.startsWith("video/");
  const maxSizeBytes = isPremium
    ? PLAN_LIMITS.MAX_FILE_SIZE_PREMIUM_MB * 1024 * 1024
    : PLAN_LIMITS.MAX_FILE_SIZE_STANDARD_MB * 1024 * 1024;

  if (!isVideo && !ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return NextResponse.json(
      { error: "פורמט לא נתמך. השתמש ב-JPG, PNG, או WebP" },
      { status: 400 }
    );
  }

  if (file.size > maxSizeBytes) {
    return NextResponse.json(
      {
        error: `קובץ גדול מדי. מקסימום ${
          isPremium
            ? PLAN_LIMITS.MAX_FILE_SIZE_PREMIUM_MB
            : PLAN_LIMITS.MAX_FILE_SIZE_STANDARD_MB
        }MB`,
      },
      { status: 400 }
    );
  }

  if (isVideo && !isPremium) {
    return NextResponse.json(
      { error: "וידאו זמין רק בתוכנית Premium" },
      { status: 403 }
    );
  }

  // Enforce image count limit for Standard plan
  if (!isPremium && !isVideo) {
    try {
      const [{ value: imgCount }] = await db
        .select({ value: count() })
        .from(vendorMedia)
        .where(eq(vendorMedia.vendorId, vendor.id));

      if (Number(imgCount) >= PLAN_LIMITS.MAX_IMAGES_STANDARD) {
        return NextResponse.json(
          { error: `הגעת למגבלה של ${PLAN_LIMITS.MAX_IMAGES_STANDARD} תמונות` },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  // Upload to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(buffer, {
      folder: `wedding-portal/vendors/${vendor.slug}`,
      resourceType: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 });
  }

  // Persist to DB
  try {
    const [newMedia] = await db
      .insert(vendorMedia)
      .values({
        id: crypto.randomUUID(),
        vendorId: vendor.id,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: isVideo ? "video" : "image",
        sortOrder: 999,
      })
      .returning();

    return NextResponse.json(newMedia, { status: 201 });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// ── DELETE: Remove file ────────────────────────────────────────────────────────

const deleteSchema = z.object({
  mediaId: z.string().min(1),
  publicId: z.string().nullable().optional(),
});

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  const { mediaId, publicId } = parsed.data;

  try {
    const vendor = await getAuthenticatedVendor(user.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // ── Authorization: verify the media item belongs to THIS vendor ───────────
    const [mediaItem] = await db
      .select()
      .from(vendorMedia)
      .where(and(eq(vendorMedia.id, mediaId), eq(vendorMedia.vendorId, vendor.id)))
      .limit(1);

    if (!mediaItem) {
      return NextResponse.json(
        { error: "Media not found or access denied" },
        { status: 404 }
      );
    }

    // Delete from DB first
    await db.delete(vendorMedia).where(eq(vendorMedia.id, mediaId));

    // Then remove from Cloudinary (best-effort)
    const pid = publicId ?? mediaItem.publicId;
    if (pid) {
      await deleteFromCloudinary(pid).catch((err) =>
        console.error("[upload] Cloudinary delete error:", err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// ── PATCH: Reorder / set cover ─────────────────────────────────────────────────

const patchSchema = z.union([
  z.object({
    setCoverUrl: z.string().url(),
    order: z.undefined().optional(),
  }),
  z.object({
    setCoverUrl: z.undefined().optional(),
    order: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).min(1),
  }),
]);

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "order or setCoverUrl required" },
      { status: 400 }
    );
  }

  try {
    const vendor = await getAuthenticatedVendor(user.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (parsed.data.setCoverUrl) {
      await db
        .update(vendors)
        .set({ coverImage: parsed.data.setCoverUrl, updatedAt: new Date() })
        .where(eq(vendors.id, vendor.id));

      return NextResponse.json({ ok: true, coverImage: parsed.data.setCoverUrl });
    }

    // Reorder — verify every ID belongs to this vendor before updating
    const order = parsed.data.order!;
    const ids = order.map((o) => o.id);

    const owned = await db
      .select({ id: vendorMedia.id })
      .from(vendorMedia)
      .where(eq(vendorMedia.vendorId, vendor.id));

    const ownedSet = new Set(owned.map((m) => m.id));
    const unauthorized = ids.filter((id) => !ownedSet.has(id));
    if (unauthorized.length > 0) {
      return NextResponse.json(
        { error: "Access denied for one or more media items" },
        { status: 403 }
      );
    }

    await Promise.all(
      order.map(({ id, sortOrder }) =>
        db
          .update(vendorMedia)
          .set({ sortOrder })
          .where(eq(vendorMedia.id, id))
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
