import { db } from "@/lib/db/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { createCoupon, toggleCoupon, deleteCoupon } from "../actions";
import { cn } from "@/lib/utils";
import { Tag, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "אחוז הנחה",
  fixed: "סכום קבוע",
};

export default async function AdminCouponsPage() {
  let couponList: (typeof coupons.$inferSelect)[] = [];

  try {
    couponList = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));
  } catch {}

  const now = new Date();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-obsidian">ניהול קופונים</h1>
        <p className="text-stone mt-1 text-sm">
          {couponList.length} קופונים במערכת
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Coupons list */}
        <div className="lg:col-span-3 bg-cream-white rounded-2xl card-shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-champagne">
            <h2 className="font-display text-xl text-obsidian">
              קופונים קיימים
            </h2>
          </div>

          {couponList.length === 0 ? (
            <div className="p-16 text-center text-stone text-sm">
              אין קופונים עדיין — צור קופון חדש בצד ימין
            </div>
          ) : (
            <div className="divide-y divide-champagne/50">
              {couponList.map((c) => {
                const isExpired = c.validUntil && new Date(c.validUntil) < now;
                const isExhausted =
                  c.maxUses !== null && c.usedCount >= (c.maxUses ?? 0);
                const isEffective = c.isActive && !isExpired && !isExhausted;

                return (
                  <div key={c.id} className="px-6 py-4 flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                        isEffective ? "bg-amber-50" : "bg-champagne/40"
                      )}
                    >
                      <Tag
                        className={cn(
                          "w-4 h-4",
                          isEffective ? "text-gold" : "text-stone/40"
                        )}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-obsidian text-sm tracking-wider">
                          {c.code}
                        </span>
                        {!c.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone/10 text-stone">
                            מושבת
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                            פג תוקף
                          </span>
                        )}
                        {isExhausted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone/10 text-stone">
                            נוצל
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone mt-0.5 flex flex-wrap gap-x-1.5">
                        <span>
                          {DISCOUNT_TYPE_LABELS[c.discountType]}:{" "}
                          <strong className="text-obsidian">
                            {c.discountType === "percentage"
                              ? `${c.discountValue}%`
                              : `₪${c.discountValue.toLocaleString()}`}
                          </strong>
                        </span>
                        {c.maxUses !== null && (
                          <>
                            <span className="text-champagne">·</span>
                            <span>
                              {c.usedCount}/{c.maxUses} שימושים
                            </span>
                          </>
                        )}
                        {c.validUntil && (
                          <>
                            <span className="text-champagne">·</span>
                            <span>
                              עד{" "}
                              {new Date(c.validUntil).toLocaleDateString(
                                "he-IL"
                              )}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <form action={toggleCoupon.bind(null, c.id, c.isActive)}>
                        <button
                          type="submit"
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                            c.isActive
                              ? "border-stone/30 text-stone hover:bg-champagne/50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          )}
                        >
                          {c.isActive ? "השבת" : "הפעל"}
                        </button>
                      </form>
                      <form action={deleteCoupon.bind(null, c.id)}>
                        <button
                          type="submit"
                          title="מחק קופון"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-stone/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create coupon form */}
        <div className="lg:col-span-2">
          <div className="bg-cream-white rounded-2xl card-shadow p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Plus className="w-4 h-4 text-gold" />
              </div>
              <h2 className="font-display text-xl text-obsidian">קופון חדש</h2>
            </div>

            <form action={createCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-stone mb-1.5">
                  קוד קופון *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="SUMMER25"
                  maxLength={20}
                  className="w-full px-3 py-2.5 text-sm font-mono uppercase bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors placeholder:normal-case"
                  style={{ direction: "ltr" }}
                />
                <p className="text-[10px] text-stone/60 mt-1">
                  3–20 תווים, ייהפך לאותיות גדולות אוטומטית
                </p>
              </div>

              {/* Discount type */}
              <div>
                <label className="block text-xs font-medium text-stone mb-1.5">
                  סוג הנחה *
                </label>
                <select
                  name="discountType"
                  required
                  defaultValue="percentage"
                  className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors"
                >
                  <option value="percentage">אחוז הנחה (%)</option>
                  <option value="fixed">סכום קבוע (₪)</option>
                </select>
              </div>

              {/* Discount value */}
              <div>
                <label className="block text-xs font-medium text-stone mb-1.5">
                  ערך ההנחה *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  required
                  min={1}
                  placeholder="20"
                  className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors"
                  style={{ direction: "ltr" }}
                />
                <p className="text-[10px] text-stone/60 mt-1">
                  אחוז: 1–100 · סכום קבוע: בשקלים
                </p>
              </div>

              {/* Max uses */}
              <div>
                <label className="block text-xs font-medium text-stone mb-1.5">
                  מקסימום שימושים
                </label>
                <input
                  type="number"
                  name="maxUses"
                  min={1}
                  placeholder="ללא הגבלה"
                  className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors"
                  style={{ direction: "ltr" }}
                />
              </div>

              {/* Valid until */}
              <div>
                <label className="block text-xs font-medium text-stone mb-1.5">
                  תוקף עד
                </label>
                <input
                  type="date"
                  name="validUntil"
                  min={now.toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 text-sm bg-ivory border border-champagne rounded-xl focus:outline-none focus:border-gold transition-colors"
                  style={{ direction: "ltr" }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-medium bg-obsidian text-white rounded-xl hover:bg-obsidian/80 transition-colors"
              >
                צור קופון
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
