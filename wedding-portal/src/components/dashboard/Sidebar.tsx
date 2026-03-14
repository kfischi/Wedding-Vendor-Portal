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
  Star,
  Menu,
  X,
  LogOut,
  Crown,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "ראשי",
    items: [
      { href: "/dashboard", label: "סקירה", icon: LayoutDashboard, exact: true, showBadge: false },
      { href: "/dashboard/analytics", label: "אנליטיקס", icon: BarChart2, exact: false, showBadge: false },
    ],
  },
  {
    label: "ניהול",
    items: [
      { href: "/dashboard/content", label: "תוכן", icon: FileText, exact: false, showBadge: false },
      { href: "/dashboard/content/pricing", label: "מחירים", icon: Package, exact: false, showBadge: false },
      { href: "/dashboard/media", label: "מדיה", icon: Image, exact: false, showBadge: false },
      { href: "/dashboard/leads", label: "לידים", icon: Users, exact: false, showBadge: true },
      { href: "/dashboard/reviews", label: "ביקורות", icon: Star, exact: false, showBadge: false },
    ],
  },
  {
    label: "חשבון",
    items: [
      { href: "/dashboard/billing", label: "חיוב", icon: CreditCard, exact: false, showBadge: false },
      { href: "/dashboard/settings", label: "הגדרות", icon: Settings, exact: false, showBadge: false },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "בית", icon: LayoutDashboard, exact: true, showBadge: false },
  { href: "/dashboard/leads", label: "לידים", icon: Users, exact: false, showBadge: true },
  { href: "/dashboard/content", label: "תוכן", icon: FileText, exact: false, showBadge: false },
  { href: "/dashboard/media", label: "מדיה", icon: Image, exact: false, showBadge: false },
  { href: "/dashboard/billing", label: "חיוב", icon: CreditCard, exact: false, showBadge: false },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  businessName: string;
  plan: "free" | "standard" | "premium";
  newLeadsCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_CONFIG: Record<string, { label: string; cls: string }> = {
  free:     { label: "חינמי",     cls: "text-stone bg-champagne/60 border-champagne" },
  standard: { label: "Standard",  cls: "text-dusty-rose bg-dusty-rose/10 border-dusty-rose/20" },
  premium:  { label: "Premium ✦", cls: "text-gold bg-gold/10 border-gold/25" },
};

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  showBadge,
  badgeCount,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group border",
        isActive
          ? "bg-gold/10 text-gold border-gold/20 shadow-sm"
          : "text-stone border-transparent hover:bg-champagne/40 hover:text-obsidian"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-gold" : "text-stone/50 group-hover:text-obsidian"
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {showBadge && !!badgeCount && badgeCount > 0 && (
        <span className="text-[10px] font-bold bg-dusty-rose text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

// ── SidebarContent ────────────────────────────────────────────────────────────

function SidebarContent({
  businessName,
  plan,
  newLeadsCount,
  onClose,
}: {
  businessName: string;
  plan: "free" | "standard" | "premium";
  newLeadsCount: number;
  onClose?: () => void;
}) {
  const router = useRouter();
  const initials = getInitials(businessName);
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.standard;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo + vendor identity */}
      <div className="px-4 pt-6 pb-5 border-b border-champagne/60">
        <Link href="/dashboard" onClick={onClose} className="block mb-5">
          <span className="font-script text-2xl text-gold leading-none">WeddingPro</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Gold avatar with initials */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-obsidian truncate leading-snug">
              {businessName}
            </p>
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full border inline-block mt-0.5",
                planCfg.cls
              )}
            >
              {planCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-bold text-stone/35 uppercase tracking-[0.12em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  exact={item.exact}
                  showBadge={item.showBadge}
                  badgeCount={item.showBadge ? newLeadsCount : 0}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: upgrade CTA + logout */}
      <div className="px-3 pb-4 pt-3 border-t border-champagne/60 space-y-1.5">
        {plan !== "premium" && (
          <Link
            href="/dashboard/billing"
            onClick={onClose}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-l from-gold/15 to-gold/5 text-gold border border-gold/25 hover:border-gold/50 transition-all"
          >
            <Crown className="h-4 w-4 shrink-0" />
            שדרג ל-Premium
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-stone/60 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          יציאה
        </button>
      </div>
    </div>
  );
}

// ── Sidebar (exported) ────────────────────────────────────────────────────────

export function Sidebar({ businessName, plan, newLeadsCount }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-xl bg-white shadow-md border border-champagne"
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5 text-obsidian" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-obsidian/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 right-0 z-50 h-full w-72 bg-white border-l border-champagne/70 shadow-2xl transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-champagne/50 text-stone z-10"
          aria-label="סגור תפריט"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent
          businessName={businessName}
          plan={plan}
          newLeadsCount={newLeadsCount}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-l border-champagne/60 h-screen sticky top-0 shadow-[2px_0_20px_rgb(26_22_20/0.04)]">
        <SidebarContent businessName={businessName} plan={plan} newLeadsCount={newLeadsCount} />
      </aside>

      {/* Mobile bottom nav bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-champagne/60">
        <div className="flex items-center justify-around px-2 py-1">
          {MOBILE_NAV.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                  isActive ? "text-gold" : "text-stone/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.showBadge && newLeadsCount > 0 && (
                  <span className="absolute -top-0.5 right-1.5 bg-dusty-rose text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {newLeadsCount > 9 ? "9+" : newLeadsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
