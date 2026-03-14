import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors, vendorMedia } from "@/lib/db/schema";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary/upload";

export const runtime = "nodejs";

const MAX_STANDARD_IMAGES = 20;
const MAX_FILE_SIZE_STANDARD = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_PREMIUM = 100 * 1024 * 1024; // 100MB

async function getVendor(userId: string) {
  const rows = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

// ── POST: Upload file ──────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let vendor;
  try {
    vendor = await getVendor(user.id);
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
  const maxSize = isPremium ? MAX_FILE_SIZE_PREMIUM : MAX_FILE_SIZE_STANDARD;
  const isVideo = file.type.startsWith("video/");

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `קובץ גדול מדי. מקסימום ${isPremium ? "100" : "10"}MB` },
      { status: 400 }
    );
  }

  if (isVideo && !isPremium) {
    return NextResponse.json(
      { error: "וידאו זמין רק בתוכנית Premium" },
      { status: 403 }
    );
  }

  // בדיקת מגבלת תמונות ל-Standard
  if (!isPremium && !isVideo) {
    const [{ value: imgCount }] = await db
      .select({ value: count() })
      .from(vendorMedia)
      .where(eq(vendorMedia.vendorId, vendor.id));

    if (Number(imgCount) >= MAX_STANDARD_IMAGES) {
      return NextResponse.json(
        { error: `הגעת למגבלה של ${MAX_STANDARD_IMAGES} תמונות` },
        { status: 403 }
      );
    }
  }

  // העלאה ל-Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadResult;
  try {
    uploadResult = await uploadToCloudinary(buffer, {
      folder: `vendors/${vendor.slug}`,
      resourceType: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json({ error: "שגיאה בהעלאה" }, { status: 500 });
  }

  // שמירה ב-DB
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
}

// ── DELETE: Remove file ────────────────────────────────────────────────────

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { mediaId?: string; publicId?: string | null };
  const { mediaId, publicId } = body;

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId required" }, { status: 400 });
  }

  try {
    const vendor = await getVendor(user.id);
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    await db.delete(vendorMedia).where(eq(vendorMedia.id, mediaId));

    if (publicId) {
      await deleteFromCloudinary(publicId).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// ── PATCH: Reorder ─────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    order?: { id: string; sortOrder: number }[];
    setCoverUrl?: string;
  };

  try {
    const vendor = await getVendor(user.id);
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Set cover image
    if (body.setCoverUrl) {
      await db
        .update(vendors)
        .set({ coverImage: body.setCoverUrl, updatedAt: new Date() })
        .where(eq(vendors.id, vendor.id));
      return NextResponse.json({ ok: true, coverImage: body.setCoverUrl });
    }

    // Reorder
    if (!body.order?.length) {
      return NextResponse.json({ error: "order or setCoverUrl required" }, { status: 400 });
    }

    await Promise.all(
      body.order.map(({ id, sortOrder }) =>
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
