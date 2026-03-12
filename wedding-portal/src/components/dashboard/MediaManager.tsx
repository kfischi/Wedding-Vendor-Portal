"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import { Trash2, Upload, GripVertical, Loader2, Video } from "lucide-react";
import type { VendorMedia } from "@/lib/db/schema";

interface MediaManagerProps {
  initialMedia: VendorMedia[];
  plan: "free" | "standard" | "premium";
  vendorId: string;
}

const MAX_STANDARD = 20;

export function MediaManager({ initialMedia, plan, vendorId }: MediaManagerProps) {
  const [media, setMedia] = useState<VendorMedia[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const isPremium = plan === "premium";
  const imageCount = media.filter((m) => m.type === "image").length;
  const atLimit = !isPremium && imageCount >= MAX_STANDARD;

  // ── Upload ─────────────────────────────────────────────────────────────────
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
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = (await res.json()) as { error?: string };
            throw new Error(body.error ?? "Upload failed");
          }

          const newMedia = (await res.json()) as VendorMedia;
          setMedia((prev) => [...prev, newMedia]);
          successCount++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "שגיאה בהעלאה";
          toast.error(`שגיאה: ${msg}`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} קבצים הועלו בהצלחה`);
      }
      setUploading(false);
    },
    [atLimit, imageCount, isPremium, vendorId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: isPremium
      ? { "image/*": [], "video/*": [] }
      : { "image/*": [] },
    disabled: uploading || atLimit,
    maxSize: isPremium ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
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

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  function handleDragStart(id: string) {
    setDraggedId(id);
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === overId) return;

    setMedia((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((m) => m.id === draggedId);
      const toIdx = arr.findIndex((m) => m.id === overId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }

  async function handleDragEnd() {
    setDraggedId(null);
    // שמירת הסדר ב-DB
    try {
      await fetch("/api/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: media.map((m, i) => ({ id: m.id, sortOrder: i })),
        }),
      });
    } catch {
      // Silent fail — reorder is cosmetic in this context
    }
  }

  return (
    <div className="space-y-6">
      {/* Counter */}
      {!isPremium && (
        <div className="flex items-center justify-between px-4 py-3 bg-cream-white rounded-xl border border-champagne card-shadow">
          <span className="text-sm text-stone">תמונות שהועלו</span>
          <span className={`text-sm font-medium ${atLimit ? "text-red-500" : "text-obsidian"}`}>
            {imageCount} / {MAX_STANDARD}
          </span>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${isDragActive ? "border-gold bg-gold/5" : "border-champagne hover:border-dusty-rose/40"}
          ${atLimit || uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-dusty-rose animate-spin" />
            <p className="text-stone text-sm">מעלה קבצים...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-8 w-8 text-stone/40" />
            <div>
              <p className="font-medium text-obsidian text-sm">
                {isDragActive ? "שחרר כאן" : "גרור תמונות לכאן"}
              </p>
              <p className="text-stone/60 text-xs mt-1">
                {isPremium
                  ? "תמונות וסרטוני וידאו · עד 100MB לקובץ"
                  : `תמונות בלבד · עד 10MB לקובץ · ${MAX_STANDARD - imageCount} נותרו`}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-dusty-rose border border-dusty-rose/40 px-3 py-1.5 rounded-lg hover:bg-dusty-rose/5 transition-colors"
            >
              או בחר קבצים
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {media.length > 0 && (
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
                ${draggedId === item.id ? "border-gold opacity-50" : "border-transparent"}
              `}
            >
              {item.type === "video" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-obsidian/80">
                  <Video className="h-8 w-8 text-cream-white" />
                  <p className="text-cream-white text-xs mt-1 absolute bottom-2">וידאו</p>
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

              {/* Overlay */}
              <div className="absolute inset-0 bg-obsidian/0 group-hover:bg-obsidian/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <GripVertical className="h-5 w-5 text-cream-white" />
                <button
                  onClick={() => handleDelete(item.id, item.publicId)}
                  className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  aria-label="מחק"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && !uploading && (
        <p className="text-center text-stone/50 text-sm py-8">
          עדיין אין תמונות. העלה את הראשונה!
        </p>
      )}
    </div>
  );
}
