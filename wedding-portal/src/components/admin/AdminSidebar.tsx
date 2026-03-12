"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "לוח בקרה", icon: LayoutDashboard, exact: true },
  { href: "/admin/vendors", label: "ספקים", icon: Users },
  { href: "/admin/coupons", label: "קופונים", icon: Tag },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

interface AdminSidebarProps {
  adminEmail: string;
}

export function AdminSidebar({ adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const Nav = () => (
    <div className="flex flex-col h-full bg-obsidian">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(184,147,90,0.15)",
              border: "1px solid rgba(184,147,90,0.3)",
            }}
          >
            <Shield className="w-5 h-5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 leading-none mb-0.5 uppercase tracking-wider">
              Admin Panel
            </p>
            <h1 className="font-display text-base text-gold leading-none truncate">
              Wedding Portal
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "text-gold"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
              style={
                active
                  ? {
                      background: "rgba(184,147,90,0.12)",
                      border: "1px solid rgba(184,147,90,0.25)",
                    }
                  : {}
              }
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active ? "text-gold" : ""
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <p className="text-xs text-white/30 px-4 truncate">{adminEmail}</p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>יציאה</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center text-white bg-obsidian shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label="תפריט ניהול"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-64 z-40 transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Nav />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen">
        <Nav />
      </aside>
    </>
  );
}
