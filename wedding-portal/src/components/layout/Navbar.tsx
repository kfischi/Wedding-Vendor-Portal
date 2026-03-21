"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/shared/LogoIcon";

const NAV_LINKS = [
  { href: "/",         label: "ראשי" },
  { href: "/vendors",  label: "ספקים" },
  { href: "/blog",     label: "בלוג" },
  { href: "/about",    label: "אודות" },
  { href: "/contact",  label: "צור קשר" },
  { href: "/pricing",  label: "מחירים" },
];

const DRAWER_LINKS = [
  { href: "/",           label: "ראשי" },
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
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        dir="rtl"
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b"
            : "border-b border-transparent"
        )}
        style={scrolled ? {
          background: "rgb(9 9 11 / 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "rgb(39 39 42)",
        } : {
          background: "transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-2.5">
              <LogoIcon size={28} />
              <span
                className="font-semibold text-[15px] tracking-tight"
                style={{ color: "rgb(250 250 250)" }}
              >
                WeddingPro
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3.5 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: active ? "rgb(250 250 250)" : "rgb(113 113 122)",
                      background: active ? "rgb(24 24 27)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgb(212 212 216)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgb(113 113 122)";
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ color: "rgb(161 161 170)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(250 250 250)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgb(161 161 170)"}
              >
                התחברות
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "rgb(250 250 250)",
                  color: "rgb(9 9 11)",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgb(212 212 216)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgb(250 250 250)"}
              >
                הצטרפו בחינם
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: "rgb(161 161 170)" }}
              aria-label="פתח תפריט"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: "rgb(0 0 0 / 0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        dir="rtl"
        className={cn(
          "md:hidden fixed top-0 right-0 z-50 h-full w-72 flex flex-col transition-transform duration-300 ease-out"
        )}
        style={{
          background: "rgb(9 9 11)",
          borderLeft: "1px solid rgb(39 39 42)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgb(39 39 42)" }}
        >
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <span className="font-script text-2xl" style={{ color: "rgb(201 168 84)" }}>WeddingPro</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "rgb(113 113 122)" }}
            aria-label="סגור תפריט"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {DRAWER_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: active ? "rgb(250 250 250)" : "rgb(113 113 122)",
                  background: active ? "rgb(24 24 27)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="px-4 pb-8 pt-3" style={{ borderTop: "1px solid rgb(39 39 42)" }}>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "rgb(250 250 250)", color: "rgb(9 9 11)" }}
          >
            הצטרפו בחינם
          </Link>
        </div>
      </aside>
    </>
  );
}
