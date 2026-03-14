"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import {
  Trash2, Upload, GripVertical, Loader2, Video, Star, ImageIcon,
} from "lucide-react";
import type { VendorMedia } from "@/lib/db/schema";

interface MediaManagerProps {
  initialMedia: VendorMedia[];
  plan: "free" | "standard" | "premium";
  vendorId: string;
  currentCoverImage?: string | null;
}

const MAX_STANDARD = 20;

export function MediaManager({ initialMedia, plan, vendorId, currentCoverImage }: MediaManagerProps) {
  const [media, setMedia] = useState<VendorMedia[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(currentCoverImage ?? null);

  const isPremium = plan === "premium";
  const imageCount = media.filter((m) => m.type === "image").length;
  const atLimit = !isPremium && imageCount >= MAX_STANDARD;
  const usagePercent = isPremium ? null : Math.round((imageCount / MAX_STANDARD) * 100);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (atLimit) {
        toast.error(`הגעת למגבלה של ${MAX_STANDARD} תמונות (Standard)`);
        return;
      }
      setUploading(true);
      let successCount = 0;

      for (const file of acceptedFiles) {
        if (!isPremium && imageCount + successCount >= MAX_STANDARD) break;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("vendorId", vendorId);

        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) {
            const body = (await res.json()) as { error?: string };
            throw new Error(body.error ?? "Upload failed");
          }
          const newMedia = (await res.json()) as VendorMedia;
          setMedia((prev) => [...prev, newMedia]);
          successCount++;
        } catch (err) {
          toast.error(`שגיאה: ${err instanceof Error ? err.message : "שגיאה בהעלאה"}`);
        }
      }

      if (successCount > 0) toast.success(`${successCount} קבצים הועלו בהצלחה`);
      setUploading(false);
    },
    [atLimit, imageCount, isPremium, vendorId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: isPremium ? { "image/*": [], "video/*": [] } : { "image/*": [] },
    disabled: uploading || atLimit,
    maxSize: isPremium ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(mediaId: string, publicId: string | null) {
    if (!confirm("האם למחוק קובץ זה?")) return;
    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, publicId }),
      });
      if (!res.ok) throw new Error("מחיקה נכשלה");
      setMedia((prev) => prev.filter((m) => m.id !== mediaId));
      toast.success("הקובץ נמחק");
    } catch {
      toast.error("שגיאה במחיקה");
    }
  }

  // ── Set cover ───────────────────────────────────────────────────────────────
  async function handleSetCover(url: string) {
    try {
      const res = await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCoverUrl: url }),
      });
      if (!res.ok) throw new Error("Failed");
      setCoverUrl(url);
      toast.success("תמונת כריכה עודכנה");
    } catch {
      toast.error("שגיאה בעדכון תמונת כריכה");
    }
  }

  // ── Drag reorder ────────────────────────────────────────────────────────────
  function handleDragStart(id: string) { setDraggedId(id); }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === overId) return;
    setMedia((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((m) => m.id === draggedId);
      const toIdx   = arr.findIndex((m) => m.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }

  async function handleDragEnd() {
    setDraggedId(null);
    try {
      await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: media.map((m, i) => ({ id: m.id, sortOrder: i })) }),
      });
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Hero / Cover image ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
        <h2 className="font-display text-xl text-obsidian mb-4">תמונת כריכה</h2>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-32 h-20 rounded-xl overflow-hidden bg-champagne/30 border border-champagne/60 shrink-0 relative">
            {coverUrl ? (
              <Image src={coverUrl} alt="תמונת כריכה" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <ImageIcon className="h-6 w-6 text-stone/30" />
                <span className="text-[10px] text-stone/40">אין תמונה</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div>
            <p className="text-sm text-obsidian font-medium mb-1">
              {coverUrl ? "תמונת הכריכה מוגדרת" : "טרם הוגדרה תמונת כריכה"}
            </p>
            <p className="text-xs text-stone/60 mb-3">
              תמונה זו מופיעה בראש דף הפרופיל שלך ובתוצאות החיפוש
            </p>
            <p className="text-xs text-stone/40">
              לשינוי — העלה תמונה חדשה לגלריה ולחץ על אייקון ⭐
            </p>
          </div>
        </div>
      </div>

      {/* ── Gallery ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-obsidian">גלריה</h2>
          {/* Usage bar */}
          {!isPremium && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block w-28 h-1.5 bg-champagne/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (usagePercent ?? 0) >= 90 ? "bg-red-400" : "bg-gold/70"
                  }`}
                  style={{ width: `${usagePercent ?? 0}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${atLimit ? "text-red-500" : "text-stone/60"}`}>
                {imageCount}/{MAX_STANDARD} תמונות
              </span>
            </div>
          )}
          {isPremium && (
            <span className="text-xs text-gold font-medium bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
              Premium — ללא הגבלה
            </span>
          )}
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? "border-gold bg-gold/5 scale-[1.01]" : "border-champagne hover:border-gold/40 hover:bg-champagne/10"}
            ${atLimit || uploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
              <p className="text-stone text-sm font-medium">מעלה קבצים...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-champagne/40 flex items-center justify-center">
                <Upload className="h-5 w-5 text-stone/50" />
              </div>
              <div>
                <p className="font-semibold text-obsidian text-sm">
                  {isDragActive ? "שחרר כאן" : "גרור תמונות לכאן"}
                </p>
                <p className="text-stone/50 text-xs mt-1">
                  {isPremium
                    ? "תמונות וסרטוני וידאו · עד 100MB לקובץ"
                    : `תמונות בלבד · עד 10MB · ${MAX_STANDARD - imageCount} נותרו`}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-dusty-rose border border-dusty-rose/30 px-4 py-1.5 rounded-lg hover:bg-dusty-rose/5 transition-colors"
              >
                או בחר קבצים
              </button>
            </div>
          )}
        </div>

        {/* Image grid */}
        {media.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {media.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                className={`
                  relative group aspect-square rounded-xl overflow-hidden bg-champagne/30
                  border-2 transition-all cursor-grab active:cursor-grabbing
                  ${draggedId === item.id ? "border-gold opacity-50 scale-95" : "border-transparent hover:border-champagne"}
                `}
              >
                {item.type === "video" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-obsidian/80">
                    <Video className="h-8 w-8 text-cream-white" />
                    <p className="text-cream-white text-xs">וידאו</p>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.altText ?? "תמונה"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}

                {/* Cover badge */}
                {item.type === "image" && item.url === coverUrl && (
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 bg-gold text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-white" />
                    כריכה
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <GripVertical className="h-5 w-5 text-white/80" />
                  {item.type === "image" && item.url !== coverUrl && (
                    <button
                      onClick={() => handleSetCover(item.url)}
                      className="p-1.5 rounded-lg bg-gold/90 hover:bg-gold text-white transition-colors shadow-sm"
                      aria-label="הגדר כתמונת כריכה"
                      title="הגדר כתמונת כריכה"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id, item.publicId)}
                    className="p-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white transition-colors shadow-sm"
                    aria-label="מחק"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !uploading ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-champagne/40 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="h-6 w-6 text-stone/30" />
            </div>
            <p className="text-stone/50 text-sm">עדיין אין תמונות. העלה את הראשונה!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
