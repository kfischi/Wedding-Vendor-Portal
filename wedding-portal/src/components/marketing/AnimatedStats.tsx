"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStatsProps {
  totalVendors: number;
  categories: number;
  avgRating: number;
  verifiedPercentage: number;
}

const heFormatter = new Intl.NumberFormat("he-IL");

function useCountUp(target: number, duration = 1500, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, enabled]);

  return value;
}

export function AnimatedStats({
  totalVendors,
  categories,
  avgRating,
  verifiedPercentage,
}: AnimatedStatsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (totalVendors < 3) return null;

  const shouldAnimate = inView && !prefersReducedMotion;

  const vendorsCount = useCountUp(totalVendors, 1500, shouldAnimate);
  const categoriesCount = useCountUp(categories, 1500, shouldAnimate);
  const verifiedCount = useCountUp(verifiedPercentage, 1500, shouldAnimate);

  const items = [
    {
      value: heFormatter.format(vendorsCount),
      suffix: "+",
      label: "ספקים נבחרים",
    },
    {
      value: heFormatter.format(categoriesCount),
      suffix: "",
      label: "קטגוריות",
    },
    {
      value: avgRating > 0 ? avgRating.toFixed(1) : "—",
      suffix: avgRating > 0 ? "★" : "",
      label: "דירוג ממוצע",
    },
    {
      value: heFormatter.format(verifiedCount),
      suffix: "%",
      label: "ספקים מאומתים",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="bg-obsidian text-white"
      aria-label="סטטיסטיקות הפורטל"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-x-reverse sm:divide-white/10">
          {items.map(({ value, suffix, label }) => (
            <div key={label} className="text-center sm:px-8">
              <p className="font-display text-3xl sm:text-4xl text-gold tabular-nums">
                {value}
                <span className="opacity-60">{suffix}</span>
              </p>
              <p className="text-white/50 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
