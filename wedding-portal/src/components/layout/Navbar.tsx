"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/vendors",  label: "ספקים" },
  { href: "/blog",     label: "בלוג" },
  { href: "/about",    label: "אודות" },
  { href: "/contact",  label: "צור קשר" },
  { href: "/pricing",  label: "מחירים" },
];

const DRAWER_LINKS = [
  { href: "/vendors",    label: "ספקים" },
  { href: "/blog",       label: "בלוג" },
  { href: "/about",      label: "אודות" },
  { href: "/contact",    label: "צור קשר" },
  { href: "/pricing",    label: "מחירים" },
  { href: "/auth/login", label: "התחברות" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        dir="rtl"
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-[0_1px_20px_rgb(26_22_20/0.08)] border-b border-champagne/60"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <span className="font-script text-2xl text-gold leading-none">WeddingPro</span>
            </Link>

            {/* Desktop nav links — right side (RTL = visually left of logo) */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-gold"
                      : "text-obsidian/70 hover:text-obsidian hover:bg-champagne/40"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA buttons — left side */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-xl text-sm font-medium text-obsidian border border-champagne hover:border-gold/40 hover:bg-champagne/30 transition-all"
              >
                התחברות
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gold text-white hover:bg-gold/90 active:scale-[0.98] transition-all shadow-sm"
              >
                הצטרפו בחינם
              </Link>
            </div>

            {/* Mobile hamburger — animated */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-obsidian hover:bg-champagne/40 transition-colors"
              aria-label={open ? "סגור תפריט" : "פתח תפריט"}
              aria-expanded={open}
            >
              <span className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
                <span className={cn(
                  "block h-[1.5px] w-5 bg-current rounded-full origin-center transition-all duration-300",
                  open && "translate-y-[6.5px] rotate-45"
                )} />
                <span className={cn(
                  "block h-[1.5px] bg-current rounded-full transition-all duration-200",
                  open ? "w-0 opacity-0" : "w-5 opacity-100"
                )} />
                <span className={cn(
                  "block h-[1.5px] w-5 bg-current rounded-full origin-center transition-all duration-300",
                  open && "-translate-y-[6.5px] -rotate-45"
                )} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-obsidian/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        dir="rtl"
        className={cn(
          "md:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-champagne/60">
          <Link href="/" onClick={() => setOpen(false)}>
            <span className="font-script text-2xl text-gold">WeddingPro</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-champagne/50 text-stone transition-colors"
            aria-label="סגור תפריט"
          >
            <span className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
              <span className="block h-[1.5px] w-5 bg-current rounded-full origin-center translate-y-[6.5px] rotate-45 transition-none" />
              <span className="block h-[1.5px] w-0 bg-current rounded-full opacity-0 transition-none" />
              <span className="block h-[1.5px] w-5 bg-current rounded-full origin-center -translate-y-[6.5px] -rotate-45 transition-none" />
            </span>
          </button>
        </div>

        {/* Drawer links */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {DRAWER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-gold/10 text-gold"
                  : "text-obsidian hover:bg-champagne/40"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer CTA */}
        <div className="px-4 pb-8 pt-3 border-t border-champagne/60">
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gold text-white hover:bg-gold/90 transition-all shadow-sm"
          >
            הצטרפו בחינם
          </Link>
        </div>
      </aside>
    </>
  );
}
