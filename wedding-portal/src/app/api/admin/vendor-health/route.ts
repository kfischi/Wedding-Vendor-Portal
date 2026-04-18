import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, lt, and, isNull, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) return null;
  return user;
}

// ── Slug utils ────────────────────────────────────────────────────────────────
function isAsciiSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function makeAsciiSlug(businessName: string, userId: string): string {
  const ascii = businessName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = ascii.length >= 2 ? ascii : "vendor";
  return `${base}-${userId.slice(0, 8)}`;
}

// ── Issue types ───────────────────────────────────────────────────────────────
export interface VendorIssue {
  vendorId: string;
  businessName: string;
  currentSlug: string;
  issueType:
    | "hebrew-slug"
    | "expired-trial"
    | "long-pending"
    | "missing-cover"
    | "missing-phone"
    | "missing-description";
  severity: "error" | "warn";
  detail: string;
  fixable: boolean;
  suggestedSlug?: string;
}

// ── GET — scan all vendors for issues ────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let allVendors: (typeof vendors.$inferSelect)[] = [];
  try {
    allVendors = await db.select().from(vendors).orderBy(vendors.createdAt);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const issues: VendorIssue[] = [];

  for (const v of allVendors) {
    // 1. Hebrew / non-ASCII slug
    if (!isAsciiSlug(v.slug)) {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "hebrew-slug",
        severity: "error",
        detail: `Slug מכיל תווים לא-ASCII: "${v.slug}"`,
        fixable: true,
        suggestedSlug: makeAsciiSlug(v.businessName, v.userId),
      });
    }

    // 2. Expired trial still active
    if (v.trialEndsAt && v.trialEndsAt < now && v.status === "active") {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "expired-trial",
        severity: "warn",
        detail: `ניסיון פג ב-${v.trialEndsAt.toLocaleDateString("he-IL")} אך הספק עדיין פעיל`,
        fixable: true,
      });
    }

    // 3. Pending > 7 days
    if (v.status === "pending" && v.createdAt < sevenDaysAgo) {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "long-pending",
        severity: "warn",
        detail: `ממתין לאישור מעל 7 ימים`,
        fixable: false,
      });
    }

    // 4. Missing cover image (active vendors only)
    if (v.status === "active" && !v.coverImage) {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "missing-cover",
        severity: "warn",
        detail: `חסרה תמונת כריכה`,
        fixable: false,
      });
    }

    // 5. Missing phone (active vendors only)
    if (v.status === "active" && !v.phone) {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "missing-phone",
        severity: "warn",
        detail: `חסר מספר טלפון`,
        fixable: false,
      });
    }

    // 6. Missing description (active vendors only)
    if (v.status === "active" && (!v.description || v.description.length < 20)) {
      issues.push({
        vendorId: v.id,
        businessName: v.businessName,
        currentSlug: v.slug,
        issueType: "missing-description",
        severity: "warn",
        detail: `תיאור עסק חסר או קצר מדי`,
        fixable: false,
      });
    }
  }

  const fixableCount = issues.filter((i) => i.fixable).length;
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warn").length;

  return NextResponse.json({
    total: allVendors.length,
    issueCount: issues.length,
    fixableCount,
    errorCount,
    warnCount,
    issues,
    timestamp: new Date().toISOString(),
  });
}

// ── POST — auto-fix one or all fixable issues ─────────────────────────────────
export async function POST(req: Request): Promise<NextResponse> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, vendorId } = body as { action?: string; vendorId?: string };

  const results: { vendorId: string; action: string; status: "ok" | "error"; detail: string }[] = [];

  if (action === "fix-all-slugs" || action === "fix-slug") {
    // Fetch vendors with non-ASCII slugs
    let targets: (typeof vendors.$inferSelect)[] = [];
    try {
      const all = await db.select().from(vendors);
      targets = all.filter((v) => {
        const matchesFilter = !vendorId || v.id === vendorId;
        return matchesFilter && !isAsciiSlug(v.slug);
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }

    // Get existing slugs to avoid collision
    const existingSlugs = new Set(
      (await db.select({ slug: vendors.slug }).from(vendors)).map((v) => v.slug)
    );

    for (const v of targets) {
      try {
        let newSlug = makeAsciiSlug(v.businessName, v.userId);
        // Ensure uniqueness
        let attempt = newSlug;
        let suffix = 2;
        while (existingSlugs.has(attempt) && attempt !== v.slug) {
          attempt = `${newSlug}-${suffix++}`;
        }
        newSlug = attempt;
        existingSlugs.add(newSlug);

        await db.update(vendors).set({ slug: newSlug, updatedAt: new Date() }).where(eq(vendors.id, v.id));
        results.push({ vendorId: v.id, action: "fix-slug", status: "ok", detail: `${v.slug} → ${newSlug}` });
      } catch (err) {
        results.push({ vendorId: v.id, action: "fix-slug", status: "error", detail: String(err) });
      }
    }
  }

  if (action === "fix-all-trials" || action === "fix-trial") {
    const now = new Date();
    try {
      const all = await db.select().from(vendors);
      const expired = all.filter((v) => {
        const matchesFilter = !vendorId || v.id === vendorId;
        return matchesFilter && v.trialEndsAt && v.trialEndsAt < now && v.status === "active";
      });

      for (const v of expired) {
        try {
          await db
            .update(vendors)
            .set({ status: "suspended", updatedAt: new Date() })
            .where(eq(vendors.id, v.id));
          results.push({ vendorId: v.id, action: "fix-trial", status: "ok", detail: `${v.businessName} — הושהה` });
        } catch (err) {
          results.push({ vendorId: v.id, action: "fix-trial", status: "error", detail: String(err) });
        }
      }
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "fix-all") {
    // Fix slugs + expired trials together
    const slugRes = await POST(new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "fix-all-slugs" }),
    }));
    const trialRes = await POST(new Request(req.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "fix-all-trials" }),
    }));
    const slugData = await slugRes.json().catch(() => ({ results: [] }));
    const trialData = await trialRes.json().catch(() => ({ results: [] }));
    return NextResponse.json({
      ok: true,
      results: [...(slugData.results ?? []), ...(trialData.results ?? [])],
    });
  }

  return NextResponse.json({ ok: results.every((r) => r.status === "ok"), results });
}
