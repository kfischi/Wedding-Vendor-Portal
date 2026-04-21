import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * GET  /api/admin/rescue-vendor?email=foo@bar.com
 *   — Shows current state: is the email in Supabase? in vendors DB?
 *
 * POST /api/admin/rescue-vendor
 *   { email, businessName, category, city, phone? }
 *   — Creates the vendor DB record for an existing Supabase user,
 *     or creates both Supabase user + vendor if email is new.
 *     Uses standard plan, active status, 90-day trial.
 */

// ── GET: diagnose ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "?email= חסר" }, { status: 400 });

  const admin = getAdmin();
  const result: Record<string, unknown> = { email };

  // Check vendors DB
  const [vendorRecord] = await db.select().from(vendors).where(eq(vendors.email, email)).limit(1);
  result.vendor_in_db = vendorRecord
    ? { id: vendorRecord.id, userId: vendorRecord.userId, slug: vendorRecord.slug, status: vendorRecord.status }
    : null;

  // Check Supabase auth — search all pages
  let supabaseUser: { id: string; email?: string; created_at: string } | null = null;
  let page = 1;
  outer: while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email === email) { supabaseUser = { id: u.id, email: u.email, created_at: u.created_at }; break outer; }
    }
    if (data.users.length < 1000) break;
    page++;
  }
  result.supabase_user = supabaseUser;

  result.diagnosis =
    !supabaseUser && !vendorRecord ? "אימייל חדש לחלוטין — רישום רגיל אמור לעבוד" :
    supabaseUser && !vendorRecord  ? "⚠️ יוזר קיים ב-Supabase אך אין רשומת ספק — קרא ל-POST להשלמה" :
    !supabaseUser && vendorRecord  ? "⚠️ רשומת ספק קיימת ב-DB אך אין יוזר ב-Supabase (בעיה)" :
    "✅ יוזר וספק קיימים — כבר רשום";

  return NextResponse.json(result);
}

// ── POST: rescue ───────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { email: string; businessName: string; category: string; city: string; phone?: string; password?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, businessName, category, city, phone, password } = body;
  if (!email || !businessName || !category || !city) {
    return NextResponse.json({ error: "שדות חסרים: email, businessName, category, city" }, { status: 400 });
  }

  const admin = getAdmin();

  // Check if vendor already exists
  const [existingVendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.email, email)).limit(1);
  if (existingVendor) return NextResponse.json({ error: "ספק עם אימייל זה כבר קיים", vendorId: existingVendor.id }, { status: 409 });

  // Find or create Supabase user
  let userId: string | undefined;

  // Search existing users first
  let page = 1;
  outer: while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email === email) { userId = u.id; break outer; }
    }
    if (data.users.length < 1000) break;
    page++;
  }

  // Create Supabase user if not found
  if (!userId) {
    const tempPassword = password ?? `Vendor${Date.now()}!`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: "vendor", plan: "standard" },
    });
    if (error) return NextResponse.json({ error: "שגיאה ביצירת יוזר Supabase: " + error.message }, { status: 500 });
    userId = data.user?.id;
  }

  if (!userId) return NextResponse.json({ error: "לא הצלחנו להשיג userId" }, { status: 500 });

  // Check userId not already in vendors
  const [existingByUserId] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.userId, userId)).limit(1);
  if (existingByUserId) return NextResponse.json({ error: "userId זה כבר משויך לספק אחר", vendorId: existingByUserId.id }, { status: 409 });

  // Create vendor record
  const slug = slugify(businessName) + "-" + userId.slice(0, 6);
  const vendorId = crypto.randomUUID();
  const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  try {
    await db.insert(vendors).values({
      id: vendorId,
      userId,
      slug,
      businessName,
      category: category as typeof vendors.$inferInsert["category"],
      city,
      phone: phone ?? null,
      email,
      plan: "standard",
      status: "active",
      role: "vendor",
      trialEndsAt,
    });
  } catch (err) {
    return NextResponse.json({ error: "שגיאת DB: " + String(err) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vendorId, userId, slug, trialEndsAt });
}
