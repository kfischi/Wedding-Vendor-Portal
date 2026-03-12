"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSection {
  id: string;
  label: string;
}

interface VendorNavbarProps {
  businessName: string;
  sections: NavSection[];
}

export function VendorNavbar({ businessName, sections }: VendorNavbarProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll-spy + header opacity
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 80);

      // Find active section
      let current = "";
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = id;
        }
      }
      setActive(current);
    };

    const setActive = (id: string) => setActiveId(id);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const NavLinks = ({ onClick }: { onClick?: (id: string) => void }) => (
    <>
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => (onClick ?? scrollTo)(id)}
          className={cn(
            "text-sm transition-colors duration-200 px-1 py-0.5 relative",
            activeId === id
              ? "text-dusty-rose font-medium"
              : "text-stone hover:text-obsidian"
          )}
        >
          {label}
          {activeId === id && (
            <span className="absolute -bottom-0.5 right-0 left-0 h-0.5 bg-dusty-rose rounded-full" />
          )}
        </button>
      ))}
    </>
  );

  return (
    <>
      <nav
        dir="rtl"
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-ivory/90 backdrop-blur-md border-b border-champagne/50 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo / Business name */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="font-display text-lg text-obsidian truncate max-w-[180px] sm:max-w-none">
              {businessName}
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-stone hover:bg-champagne/40 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="תפריט ניווט"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div
        dir="rtl"
        className={cn(
          "fixed top-14 right-0 left-0 z-30 md:hidden bg-ivory border-b border-champagne/50 shadow-lg transition-all duration-200",
          menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="flex flex-col px-6 py-3 gap-1">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                "text-sm text-right py-2.5 border-b border-champagne/40 last:border-0 transition-colors",
                activeId === id ? "text-dusty-rose font-medium" : "text-stone hover:text-obsidian"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
