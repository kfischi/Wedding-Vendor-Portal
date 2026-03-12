"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Heart, Calendar, User, Mail, Phone, MessageSquare } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: z.string().optional(),
  eventDate: z.string().optional(),
  message: z.string().min(10, "הודעה חייבת להכיל לפחות 10 תווים"),
});

type FormData = z.infer<typeof schema>;

interface LeadCaptureFormProps {
  vendorId: string;
  vendorName: string;
}

function Field({
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
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/50 pointer-events-none" />
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

const inputCls = `
  w-full pr-9 pl-3 py-2.5 rounded-xl text-sm
  border border-champagne bg-ivory/70
  text-obsidian placeholder:text-stone/40
  focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/60
  transition-all duration-200
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
            <h3 className="font-display text-2xl text-obsidian mb-2">
              הפנייה נשלחה!
            </h3>
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
            <Field icon={User} error={errors.name?.message}>
              <input
                {...register("name")}
                placeholder="שם מלא *"
                className={inputCls}
              />
            </Field>

            {/* Email */}
            <Field icon={Mail} error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                dir="ltr"
                placeholder="אימייל *"
                className={inputCls}
              />
            </Field>

            {/* Phone */}
            <Field icon={Phone}>
              <input
                {...register("phone")}
                type="tel"
                dir="ltr"
                placeholder="טלפון"
                className={inputCls}
              />
            </Field>

            {/* Event date */}
            <Field icon={Calendar}>
              <input
                {...register("eventDate")}
                type="date"
                dir="ltr"
                placeholder="dd/mm/yyyy"
                min={new Date().toISOString().split("T")[0]}
                className={inputCls}
              />
            </Field>

            {/* Message */}
            <Field icon={MessageSquare} error={errors.message?.message}>
              <textarea
                {...register("message")}
                placeholder="ספרו לי על האירוע שלכם... *"
                rows={4}
                className={`${inputCls} pt-3 pr-9 resize-none leading-relaxed`}
                style={{ paddingTop: "0.75rem" }}
              />
            </Field>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="
                w-full py-3 rounded-xl text-sm font-medium mt-1
                bg-dusty-rose text-white
                hover:bg-dusty-rose/90
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors duration-200
                flex items-center justify-center gap-2
                shadow-sm shadow-dusty-rose/30
              "
            >
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
