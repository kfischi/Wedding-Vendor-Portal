import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await db
      .update(vendors)
      .set({ viewCount: sql`${vendors.viewCount} + 1` })
      .where(eq(vendors.id, id));
  } catch {
    // Non-critical — silently fail
  }

  return NextResponse.json({ ok: true });
}
