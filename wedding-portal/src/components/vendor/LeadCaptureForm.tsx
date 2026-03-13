"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Heart, Calendar, User, Mail, Phone, MessageSquare } from "lucide-react";

const datePattern = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: z.string().optional(),
  eventDate: z
    .string()
    .optional()
    .refine((v) => !v || datePattern.test(v), "פורמט תאריך לא תקין — DD/MM/YYYY"),
  message: z.string().min(10, "הודעה חייבת להכיל לפחות 10 תווים"),
});

type FormData = z.infer<typeof schema>;

interface LeadCaptureFormProps {
  vendorId: string;
  vendorName: string;
}

/* ── Floating-label input field ── */
function InputField({
  icon: Icon,
  id,
  label,
  error,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40 pointer-events-none z-10" />
        {children}
        <label
          htmlFor={id}
          className="
            absolute right-9 pointer-events-none select-none
            top-1.5 text-[10px] font-medium tracking-wide
            text-gold/75
            transition-all duration-200
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
            peer-placeholder-shown:text-sm peer-placeholder-shown:text-stone/45
            peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal
            peer-focus:top-1.5 peer-focus:translate-y-0
            peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-gold/75 peer-focus:tracking-wide
          "
        >
          {label}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 text-xs mt-1 pr-1 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Textarea field (plain placeholder, no floating label) ── */
function TextareaField({
  icon: Icon,
  error,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="relative">
        <Icon className="absolute right-3 top-3.5 w-4 h-4 text-stone/40 pointer-events-none" />
        {children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 text-xs mt-1 pr-1 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Shared input class — peer is required for floating label to work */
const inputCls = `
  peer w-full pr-9 pl-3 pt-5 pb-1.5 rounded-xl text-sm
  border border-champagne/80 bg-white
  text-obsidian placeholder-transparent
  focus:outline-none focus:ring-1 focus:ring-gold/25 focus:border-gold
  transition-all duration-200
  shadow-sm
`;

const textareaCls = `
  w-full pr-9 pl-3 py-3 rounded-xl text-sm
  border border-champagne/80 bg-white
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-1 focus:ring-gold/25 focus:border-gold
  transition-all duration-200
  shadow-sm resize-none leading-relaxed
`;

export function LeadCaptureForm({ vendorId, vendorName }: LeadCaptureFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, vendorId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "שגיאה");
      }
      setSubmitted(true);
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה בשליחה";
      if (msg.includes("rate limit") || msg.includes("יותר מדי")) {
        toast.error("שלחת יותר מדי פניות. נסה שוב מחר.");
      } else {
        toast.error("שגיאה בשליחת הפנייה. נסה שוב.");
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        /* ── Success state ── */
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center py-10 px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-full bg-dusty-rose/10 border-2 border-dusty-rose/20 flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-7 h-7 text-dusty-rose fill-dusty-rose/40" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="font-display text-2xl text-obsidian mb-2">הפנייה נשלחה!</h3>
            <p className="text-stone text-sm leading-relaxed mb-5">
              {vendorName} יחזרו אליך בהקדם האפשרי.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-gold hover:text-gold/70 transition-colors underline underline-offset-2"
            >
              שלח פנייה נוספת
            </button>
          </motion.div>
        </motion.div>
      ) : (
        /* ── Form ── */
        <motion.div
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="mb-5">
            <p className="font-script text-xl text-gold leading-none mb-1">בואו נדבר</p>
            <h3 className="font-display text-2xl text-obsidian">צרו קשר</h3>
            <p className="text-stone/60 text-xs mt-1">פנייתך תישלח ישירות ל{vendorName}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Name */}
            <InputField icon={User} id="lcf-name" label="שם מלא *" error={errors.name?.message}>
              <input
                {...register("name")}
                id="lcf-name"
                placeholder=" "
                className={inputCls}
              />
            </InputField>

            {/* Email */}
            <InputField icon={Mail} id="lcf-email" label="אימייל *" error={errors.email?.message}>
              <input
                {...register("email")}
                id="lcf-email"
                type="email"
                dir="ltr"
                placeholder=" "
                className={inputCls}
              />
            </InputField>

            {/* Phone */}
            <InputField icon={Phone} id="lcf-phone" label="טלפון">
              <input
                {...register("phone")}
                id="lcf-phone"
                type="tel"
                dir="ltr"
                placeholder=" "
                className={inputCls}
              />
            </InputField>

            {/* Event date — text input with DD/MM/YYYY pattern */}
            <InputField
              icon={Calendar}
              id="lcf-date"
              label="תאריך האירוע"
              error={errors.eventDate?.message}
            >
              <input
                {...register("eventDate")}
                id="lcf-date"
                type="text"
                dir="ltr"
                placeholder=" "
                pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                inputMode="numeric"
                className={inputCls}
              />
            </InputField>

            {/* Message */}
            <TextareaField icon={MessageSquare} error={errors.message?.message}>
              <textarea
                {...register("message")}
                placeholder="ספרו לי על האירוע שלכם... *"
                rows={4}
                className={textareaCls}
              />
            </TextareaField>

            {/* Submit — gold gradient with shimmer */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="
                relative overflow-hidden
                w-full py-3 rounded-xl text-sm font-medium mt-1
                text-white
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-md shadow-[#b8935a]/25
                group
              "
              style={{
                background: "linear-gradient(135deg, #b8935a 0%, #d4af70 50%, #b8935a 100%)",
              }}
            >
              {/* Shimmer sweep */}
              <span className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12" />
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  שלח פנייה
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
