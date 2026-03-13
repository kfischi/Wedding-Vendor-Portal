"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, Check, X, Star } from "lucide-react";
import {
  addPackageAction,
  updatePackageAction,
  deletePackageAction,
  type PricingActionState,
} from "@/app/(dashboard)/dashboard/content/pricing/actions";
import type { VendorPricing } from "@/lib/db/schema";
import { formatPrice } from "@/lib/utils";

const inputCls = `
  w-full px-3 py-2 rounded-lg text-sm
  border border-champagne bg-ivory
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
  transition-colors
`;
const labelCls = "block text-xs font-medium text-stone mb-1";

// ── Add Package Form ──────────────────────────────────────────────────────────

function AddPackageForm({ onAdded }: { onAdded: (pkg: VendorPricing) => void }) {
  const [state, formAction, isPending] = useActionState<PricingActionState, FormData>(
    addPackageAction,
    {}
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success("החבילה נוספה");
      setOpen(false);
      // Page will revalidate; parent gets updated via server rerender
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed border-champagne text-stone hover:border-gold/50 hover:text-obsidian transition-colors"
      >
        <Plus className="h-4 w-4" />
        הוסף חבילה
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-cream-white rounded-2xl border border-gold/20 card-shadow p-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg text-obsidian">חבילה חדשה</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-stone hover:text-obsidian"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>שם החבילה *</label>
          <input name="name" required placeholder="חבילת זהב" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>מחיר (₪) *</label>
          <input name="price" type="number" min="0" required placeholder="7900" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>תיאור קצר</label>
        <input name="description" placeholder="הבחירה הפופולרית ביותר" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>פיצ'רים (מופרדים בפסיק)</label>
        <textarea
          name="features"
          rows={3}
          placeholder="8 שעות צילום, 500+ תמונות, גלריה דיגיטלית"
          className={`${inputCls} resize-none`}
        />
        <p className="text-stone/40 text-xs mt-1">הפרד כל פיצ׳ר בפסיק</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="new-popular"
          name="isPopular"
          type="checkbox"
          value="on"
          className="rounded"
        />
        <label htmlFor="new-popular" className="text-sm text-stone">
          סמן כחבילה פופולרית
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-dusty-rose text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          הוסף חבילה
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-xl text-sm text-stone hover:bg-champagne/50 transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

// ── Edit Package Row ──────────────────────────────────────────────────────────

function PackageRow({
  pkg,
  onDelete,
}: {
  pkg: VendorPricing;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState<PricingActionState, FormData>(
    updatePackageAction,
    {}
  );

  useEffect(() => {
    if (state.success) { toast.success("החבילה עודכנה"); setEditing(false); }
    if (state.error) toast.error(state.error);
  }, [state]);

  if (editing) {
    return (
      <form
        action={formAction}
        className="bg-ivory rounded-xl border border-gold/20 p-5 space-y-3"
      >
        <input type="hidden" name="id" value={pkg.id} />

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>שם החבילה *</label>
            <input name="name" defaultValue={pkg.name} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>מחיר (₪) *</label>
            <input name="price" type="number" min="0" defaultValue={pkg.price} required className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>תיאור קצר</label>
          <input name="description" defaultValue={pkg.description ?? ""} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>פיצ'רים (מופרדים בפסיק)</label>
          <textarea
            name="features"
            defaultValue={pkg.features.join(", ")}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id={`pop-${pkg.id}`}
            name="isPopular"
            type="checkbox"
            value="on"
            defaultChecked={pkg.isPopular}
            className="rounded"
          />
          <label htmlFor={`pop-${pkg.id}`} className="text-sm text-stone">
            חבילה פופולרית
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-dusty-rose text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            שמור
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-1.5 rounded-lg text-sm text-stone hover:bg-champagne/50 transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-cream-white rounded-xl border border-champagne/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-obsidian">{pkg.name}</h3>
            {pkg.isPopular && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                <Star className="h-2.5 w-2.5" />
                פופולרי
              </span>
            )}
          </div>
          <p className="text-2xl font-semibold text-obsidian mb-2">
            {formatPrice(pkg.price)}
          </p>
          {pkg.description && (
            <p className="text-stone text-sm mb-3">{pkg.description}</p>
          )}
          {pkg.features.length > 0 && (
            <ul className="space-y-1">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-stone">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg text-stone hover:bg-champagne/60 hover:text-obsidian transition-colors"
            title="ערוך"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`למחוק את חבילת "${pkg.name}"?`)) onDelete(pkg.id);
            }}
            className="p-2 rounded-lg text-stone hover:bg-red-50 hover:text-red-600 transition-colors"
            title="מחק"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface PricingEditorProps {
  packages: VendorPricing[];
  vendorId: string;
}

export function PricingEditor({ packages: initialPackages }: PricingEditorProps) {
  const [packages, setPackages] = useState(initialPackages);

  async function handleDelete(id: string) {
    try {
      await deletePackageAction(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("החבילה נמחקה");
    } catch {
      toast.error("שגיאה במחיקה");
    }
  }

  return (
    <div className="space-y-4">
      {packages.length === 0 && (
        <div className="text-center py-10 text-stone/50 text-sm">
          עדיין אין חבילות מחירים. הוסף את הראשונה!
        </div>
      )}

      {packages.map((pkg) => (
        <PackageRow key={pkg.id} pkg={pkg} onDelete={handleDelete} />
      ))}

      <AddPackageForm onAdded={(pkg) => setPackages((prev) => [...prev, pkg])} />
    </div>
  );
}
