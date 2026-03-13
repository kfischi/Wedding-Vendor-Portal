"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: string;
  label: string;
}

function parseValue(raw: string): { num: number; suffix: string; decimals: number } {
  const match = raw.match(/^([\d,]+\.?\d*)(.*)$/);
  if (!match) return { num: 0, suffix: raw, decimals: 0 };
  const numStr = match[1].replace(/,/g, "");
  const num = parseFloat(numStr);
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { num, suffix: match[2], decimals };
}

function CountUp({ raw, active }: { raw: string; active: boolean }) {
  const { num, suffix, decimals } = parseValue(raw);
  const [display, setDisplay] = useState(decimals > 0 ? `0.0${suffix}` : `0${suffix}`);

  useEffect(() => {
    if (!active) return;
    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = eased * num;

      let formatted: string;
      if (decimals > 0) {
        formatted = current.toFixed(decimals);
      } else if (num >= 1000) {
        formatted = Math.round(current).toLocaleString("en-US").replace(/,/g, ",");
      } else {
        formatted = String(Math.round(current));
      }

      setDisplay(formatted + suffix);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [active, num, suffix, decimals]);

  return <>{display}</>;
}

export function AnimatedStats({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="bg-obsidian text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10" ref={ref}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-x-reverse sm:divide-white/10">
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="text-center sm:px-8"
            >
              <p className="font-display text-3xl sm:text-4xl text-gold">
                <CountUp raw={value} active={inView} />
              </p>
              <p className="text-white/50 text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
