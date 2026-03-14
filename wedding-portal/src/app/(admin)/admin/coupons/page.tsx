import { db } from "@/lib/db/db";
import { coupons } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { createCoupon, toggleCoupon, deleteCoupon } from "../actions";
import { Tag, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: "אחוז הנחה",
  fixed: "סכום קבוע",
};

export default async function AdminCouponsPage() {
  let couponList: (typeof coupons.$inferSelect)[] = [];

  try {
    couponList = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  } catch {}

  const now = new Date();

  const card = { background: "#1a1a1a", border: "1px solid rgba(184,147,90,0.15)", borderRadius: "1rem", overflow: "hidden" };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    background: "#111111",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    color: "rgba(255,255,255,0.85)",
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 500,
    color: "rgba(255,255,255,0.4)",
    marginBottom: "0.375rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white">ניהול קופונים</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {couponList.length} קופונים במערכת
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Coupon list */}
        <div className="lg:col-span-3" style={card}>
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid rgba(184,147,90,0.15)" }}
          >
            <h2 className="font-display text-xl text-white">קופונים קיימים</h2>
          </div>

          {couponList.length === 0 ? (
            <div className="p-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              אין קופונים עדיין — צור קופון חדש בצד ימין
            </div>
          ) : (
            <div>
              {couponList.map((c, i) => {
                const isExpired = c.validUntil && new Date(c.validUntil) < now;
                const isExhausted = c.maxUses !== null && c.usedCount >= (c.maxUses ?? 0);
                const isEffective = c.isActive && !isExpired && !isExhausted;

                return (
                  <div
                    key={c.id}
                    className="px-6 py-4 flex items-center gap-4"
                    style={i < couponList.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isEffective ? "rgba(184,147,90,0.15)" : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Tag
                        className="w-4 h-4"
                        style={{ color: isEffective ? "#b8935a" : "rgba(255,255,255,0.25)" }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono font-semibold text-sm tracking-wider"
                          style={{ color: "rgba(255,255,255,0.9)" }}
                        >
                          {c.code}
                        </span>
                        {!c.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                            מושבת
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                            פג תוקף
                          </span>
                        )}
                        {isExhausted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                            נוצל
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 flex flex-wrap gap-x-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>
                          {DISCOUNT_TYPE_LABELS[c.discountType]}:{" "}
                          <strong style={{ color: "rgba(255,255,255,0.75)" }}>
                            {c.discountType === "percentage"
                              ? `${c.discountValue}%`
                              : `₪${c.discountValue.toLocaleString()}`}
                          </strong>
                        </span>
                        {c.maxUses !== null && (
                          <>
                            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                            <span>{c.usedCount}/{c.maxUses} שימושים</span>
                          </>
                        )}
                        {c.validUntil && (
                          <>
                            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                            <span>עד {new Date(c.validUntil).toLocaleDateString("he-IL")}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <form action={toggleCoupon.bind(null, c.id, c.isActive)}>
                        <button
                          type="submit"
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={
                            c.isActive
                              ? { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                              : { border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }
                          }
                        >
                          {c.isActive ? "השבת" : "הפעל"}
                        </button>
                      </form>
                      <form action={deleteCoupon.bind(null, c.id)}>
                        <button
                          type="submit"
                          title="מחק קופון"
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "rgba(255,255,255,0.25)" }}
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
          <div className="sticky top-24 p-6" style={{ ...card, borderRadius: "1rem" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,147,90,0.15)" }}>
                <Plus className="w-4 h-4" style={{ color: "#b8935a" }} />
              </div>
              <h2 className="font-display text-xl text-white">קופון חדש</h2>
            </div>

            <form action={createCoupon} className="space-y-4">
              <div>
                <label style={labelStyle}>קוד קופון *</label>
                <input
                  type="text"
                  name="code"
                  required
                  placeholder="SUMMER25"
                  maxLength={20}
                  style={{ ...inputStyle, fontFamily: "monospace", textTransform: "uppercase", direction: "ltr" }}
                />
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                  3–20 תווים, ייהפך לאותיות גדולות
                </p>
              </div>

              <div>
                <label style={labelStyle}>סוג הנחה *</label>
                <select
                  name="discountType"
                  required
                  defaultValue="percentage"
                  style={inputStyle}
                >
                  <option value="percentage" style={{ background: "#1a1a1a" }}>אחוז הנחה (%)</option>
                  <option value="fixed" style={{ background: "#1a1a1a" }}>סכום קבוע (₪)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>ערך ההנחה *</label>
                <input
                  type="number"
                  name="discountValue"
                  required
                  min={1}
                  placeholder="20"
                  style={{ ...inputStyle, direction: "ltr" }}
                />
              </div>

              <div>
                <label style={labelStyle}>מקסימום שימושים</label>
                <input
                  type="number"
                  name="maxUses"
                  min={1}
                  placeholder="ללא הגבלה"
                  style={{ ...inputStyle, direction: "ltr" }}
                />
              </div>

              <div>
                <label style={labelStyle}>תוקף עד</label>
                <input
                  type="date"
                  name="validUntil"
                  min={now.toISOString().split("T")[0]}
                  style={{ ...inputStyle, direction: "ltr" }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all"
                style={{ background: "#b8935a", color: "#0a0a0a" }}
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
