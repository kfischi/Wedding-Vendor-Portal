"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { VendorPricing } from "@/lib/db/schema";

function scrollToContact() {
  document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.1 },
  }),
};

export function PricingSection({ packages }: { packages: VendorPricing[] }) {
  if (packages.length === 0) return null;

  const displayed = packages.slice(0, 3);

  return (
    <section>
      <div className="mb-7">
        <h2 className="font-display text-3xl text-obsidian">חבילות ומחירים</h2>
        <p className="text-stone text-sm mt-1">בחרו את החבילה המתאימה לאירוע שלכם</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayed.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className={`relative bg-cream-white rounded-2xl p-6 card-shadow flex flex-col border transition-shadow hover:shadow-lg ${
              pkg.isPopular
                ? "border-gold/40 ring-1 ring-gold/20"
                : "border-champagne/60"
            }`}
          >
            {/* Popular badge */}
            {pkg.isPopular && (
              <div className="absolute -top-3 right-5">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-gradient-to-r from-gold to-amber-500 px-3 py-1 rounded-full shadow-sm">
                  <Star className="w-3 h-3 fill-white" />
                  הכי פופולרי
                </span>
              </div>
            )}

            {/* Name */}
            <h3 className="font-display text-xl text-obsidian mb-1 mt-1">{pkg.name}</h3>

            {/* Description */}
            {pkg.description && (
              <p className="text-stone text-sm mb-4 leading-relaxed">{pkg.description}</p>
            )}

            {/* Price */}
            <div className="mb-5">
              <p className="font-display text-4xl text-obsidian leading-none">
                {formatPrice(pkg.price)}
              </p>
              <p className="text-stone/60 text-xs mt-1">לאירוע</p>
            </div>

            {/* Features */}
            {pkg.features.length > 0 && (
              <ul className="space-y-2.5 mb-6 flex-1">
                {pkg.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2.5 text-sm text-stone">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <button
              onClick={scrollToContact}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-auto ${
                pkg.isPopular
                  ? "bg-gradient-to-r from-gold to-amber-500 text-white hover:opacity-90 shadow-sm shadow-gold/25"
                  : "bg-ivory border border-champagne text-obsidian hover:bg-champagne/40"
              }`}
            >
              בחר חבילה
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
