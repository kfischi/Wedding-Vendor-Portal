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
    <div
      className="flex flex-col h-full"
      style={{ background: "#0a0a0a" }}
    >
      {/* Logo */}
      <div
        className="p-6"
        style={{ borderBottom: "1px solid rgba(184,147,90,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(184,147,90,0.12)",
              border: "1px solid rgba(184,147,90,0.3)",
            }}
          >
            <Shield className="w-5 h-5" style={{ color: "#b8935a" }} />
          </div>
          <div className="min-w-0">
            <h1
              className="font-script leading-none"
              style={{ color: "#b8935a", fontSize: "1.4rem" }}
            >
              WeddingPro
            </h1>
            <p
              className="text-[10px] uppercase tracking-widest mt-0.5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Admin Panel
            </p>
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
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all relative",
              )}
              style={
                active
                  ? {
                      background: "rgba(184,147,90,0.12)",
                      color: "#b8935a",
                      borderRight: "3px solid #b8935a",
                    }
                  : {
                      color: "rgba(255,255,255,0.45)",
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="p-4 space-y-1"
        style={{ borderTop: "1px solid rgba(184,147,90,0.15)" }}
      >
        <p
          className="text-xs px-4 truncate"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {adminEmail}
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            e.currentTarget.style.background = "";
          }}
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
        className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
        style={{ background: "#0a0a0a", color: "white", border: "1px solid rgba(184,147,90,0.3)" }}
        onClick={() => setOpen(!open)}
        aria-label="תפריט ניהול"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
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
