"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { categoryTiles, type CategoryTile } from "@/lib/data/categories";

const sizeCls: Record<CategoryTile["size"], string> = {
  large: "md:col-span-8 md:row-span-2",
  medium: "md:col-span-4 md:row-span-1",
  small: "md:col-span-4 md:row-span-1",
};

const aspectCls: Record<CategoryTile["size"], string> = {
  large: "aspect-[16/10] md:aspect-auto",
  medium: "aspect-[4/3] md:aspect-auto",
  small: "aspect-[4/3] md:aspect-auto",
};

const easeLuxury = [0.16, 1, 0.3, 1] as const;
const easeReveal = [0.22, 1, 0.36, 1] as const;

export function CategoryBento() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12" aria-label="קטגוריות">
      <div className="mx-auto max-w-7xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: easeLuxury }}
          className="text-micro-label text-obsidian/60 mb-4"
        >
          ספקים בעלי שם
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: easeLuxury }}
          className="text-editorial text-5xl md:text-7xl mb-16"
        >
          כל הקטגוריות
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 md:gap-6">
          {categoryTiles.map((tile, i) => (
            <motion.div
              key={tile.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.8,
                delay: i * 0.06,
                ease: easeReveal,
              }}
              className={`relative overflow-hidden group ${sizeCls[tile.size]} ${aspectCls[tile.size]}`}
            >
              <Link
                href={`/vendors?category=${tile.slug}`}
                aria-label={tile.name}
                className="absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-4"
              >
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-obsidian/75 via-obsidian/20 to-transparent"
                />
                <div className="absolute bottom-6 right-6 text-ivory">
                  <p className="text-editorial text-2xl md:text-3xl">
                    {tile.name}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
