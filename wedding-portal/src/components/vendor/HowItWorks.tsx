"use client";

import { motion } from "framer-motion";
import { MessageCircle, Calendar, Camera, ArrowLeft } from "lucide-react";

const STEPS = [
  {
    icon: MessageCircle,
    title: "צרו קשר",
    description: "מלאו את הטופס או שלחו הודעת WhatsApp — נחזור אליכם תוך 24 שעות.",
    color: "bg-dusty-rose/10 text-dusty-rose border-dusty-rose/20",
  },
  {
    icon: Calendar,
    title: "פגישת היכרות",
    description: "נקיים פגישה (פיזית או זום) להבנת החזון שלכם ולתכנון מדויק.",
    color: "bg-gold/10 text-gold border-gold/20",
  },
  {
    icon: Camera,
    title: "האירוע שלכם",
    description: "ביום הגדול נהיה שם — מלאי תשומת לב לכל רגע ופרט.",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
];

const stepVariants = {
  hidden: (i: number) => ({ opacity: 0, x: i % 2 === 0 ? -30 : 30 }),
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, delay: i * 0.15 },
  }),
};

export function HowItWorks() {
  return (
    <section className="rounded-2xl overflow-hidden" style={{ background: "rgb(232 221 208 / 0.35)" }}>
      <div className="p-8 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="font-script text-gold text-xl mb-1">התהליך שלנו</p>
          <h2 className="font-display text-3xl text-obsidian">איך זה עובד?</h2>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex-1 flex flex-col md:flex-row items-center">
              {/* Step card */}
              <motion.div
                custom={i}
                variants={stepVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="flex-1 w-full bg-cream-white rounded-2xl p-6 card-shadow text-center flex flex-col items-center gap-3"
              >
                {/* Step number */}
                <span className="text-xs font-medium text-stone/50 uppercase tracking-wider">
                  שלב {i + 1}
                </span>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-6 h-6" />
                </div>

                {/* Text */}
                <h3 className="font-display text-xl text-obsidian">{step.title}</h3>
                <p className="text-stone text-sm leading-relaxed">{step.description}</p>
              </motion.div>

              {/* Arrow connector (desktop only) */}
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
                  className="hidden md:flex items-center justify-center w-10 flex-shrink-0 text-champagne"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
