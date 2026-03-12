"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Image,
  Users,
  BarChart2,
  CreditCard,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "סקירה", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/content", label: "תוכן", icon: FileText },
  { href: "/dashboard/media", label: "מדיה", icon: Image },
  { href: "/dashboard/leads", label: "לידים", icon: Users },
  { href: "/dashboard/analytics", label: "אנליטיקס", icon: BarChart2 },
  { href: "/dashboard/billing", label: "חיוב", icon: CreditCard },
  { href: "/dashboard/settings", label: "הגדרות", icon: Settings },
];

interface SidebarProps {
  businessName: string;
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-dusty-rose/10 text-dusty-rose"
          : "text-stone hover:bg-champagne/60 hover:text-obsidian"
      )}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", isActive ? "text-dusty-rose" : "")}
      />
      {label}
    </Link>
  );
}

function SidebarContent({
  businessName,
  onLinkClick,
}: {
  businessName: string;
  onLinkClick?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full">
      {/* לוגו */}
      <div className="px-4 py-6 border-b border-champagne">
        <Link href="/dashboard" onClick={onLinkClick}>
          <span className="font-display text-2xl text-obsidian">WeddingPro</span>
          <p className="text-xs text-stone mt-0.5 truncate max-w-[160px]">
            {businessName}
          </p>
        </Link>
      </div>

      {/* ניווט */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onClick={onLinkClick} />
        ))}
      </nav>

      {/* יציאה */}
      <div className="px-3 py-4 border-t border-champagne">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          יציאה
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ businessName }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-xl bg-cream-white card-shadow border border-champagne"
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5 text-obsidian" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-obsidian/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 right-0 z-50 h-full w-72 bg-ivory border-l border-champagne transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-champagne/50"
          aria-label="סגור תפריט"
        >
          <X className="h-5 w-5 text-obsidian" />
        </button>
        <SidebarContent
          businessName={businessName}
          onLinkClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ivory border-l border-champagne h-screen sticky top-0">
        <SidebarContent businessName={businessName} />
      </aside>
    </>
  );
}
