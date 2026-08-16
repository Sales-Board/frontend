"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitPullRequest,
  Sparkles,
  BarChart3,
  FileText,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  User,
  X,
  Menu,
} from "lucide-react";
import { BrandIcon, BrandWordmark } from "./brand";

/* ------------------------------------------------------------------ */
/*  Navigation Groups                                                  */
/* ------------------------------------------------------------------ */

export const NAV_GROUPS = [
  {
    group: "Sales",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/leads", icon: Users, badge: "142" },
      { label: "Deals", href: "/deals", icon: Briefcase },
      { label: "Pipeline", href: "/pipeline", icon: GitPullRequest },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { label: "AI Copilot", href: "/ai-assistant", icon: Sparkles },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    group: "Management",
    items: [
      { label: "Sales Team", href: "/team", icon: TrendingUp },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

export const CircularProgress = ({ value, max }: { value: number; max: number }) => {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <svg
      className="h-4 w-4 -rotate-90"
      viewBox="0 0 100 100"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <circle
        cx="50"
        cy="50"
        fill="none"
        r={r}
        strokeWidth="10"
        className="stroke-slate-200"
      />
      <circle
        cx="50"
        cy="50"
        fill="none"
        r={r}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / max) * c}
        className="stroke-blue-600 transition-[stroke-dashoffset] duration-300 ease-in-out"
      />
    </svg>
  );
};

export const UserAvatar = ({
  initials = "RV",
  size = "md",
}: {
  initials?: string;
  size?: "sm" | "md";
}) => {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs font-semibold";
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 overflow-hidden ${dim}`}
    >
      <span>{initials}</span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  LeftRail (Narrow 56px Icon Rail - Flush to Screen Left Edge)      */
/* ------------------------------------------------------------------ */

export function LeftRail() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const railItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/leads", icon: Users },
    { label: "Deals", href: "/deals", icon: Briefcase },
    { label: "AI Copilot", href: "/ai-assistant", icon: Sparkles },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <aside className="hidden lg:flex w-14 shrink-0 h-screen flex-col items-center py-4 justify-between border-r border-slate-200 bg-slate-50/70 select-none z-30">
      {/* Top: Brand Icon */}
      <div className="flex flex-col items-center gap-4">
        <Link href="/dashboard" className="transition-transform hover:scale-105">
          <BrandIcon size={32} />
        </Link>

        <div className="h-px w-6 bg-slate-200" />

        {/* Rail Shortcut Icons */}
        <nav className="flex flex-col gap-1.5">
          {railItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="h-4 w-4 stroke-[1.75px]" />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom utilities: Settings + User Avatar Popover */}
      <div className="flex flex-col items-center gap-2 relative">
        <Link
          href="/settings"
          title="Settings"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
        >
          <HelpCircle className="h-4 w-4 stroke-[1.75px]" />
        </Link>

        <div className="h-px w-6 bg-slate-200" />

        {/* User Avatar */}
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="relative cursor-pointer transition-transform hover:scale-105"
        >
          <UserAvatar initials="RV" size="md" />
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Popover Menu */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-12 bottom-0 w-56 bg-white border border-slate-200 rounded-xl p-3 text-xs z-50 shadow-xl"
            >
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                <UserAvatar size="sm" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 block truncate">
                    Rajesh Varma
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    CCO — Mumbai
                  </span>
                </div>
              </div>

              <div className="py-2 space-y-0.5">
                <Link
                  href="/team"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Sales Quota
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    alert("Signed out.");
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[12px] font-medium cursor-pointer transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  SecondarySidebar (224px Grouped Navigation Panel)                 */
/* ------------------------------------------------------------------ */

export function SecondarySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 h-screen flex-col justify-between p-3.5 border-r border-slate-200 bg-white select-none z-20">
      <div className="space-y-6">
        <div className="px-1.5 pt-1">
          <BrandWordmark />
        </div>

        {/* Grouped Navigation */}
        <div className="space-y-5">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <span className="px-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
                {grp.group}
              </span>

              <nav className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                            isActive ? "text-blue-600" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <span className="w-1 h-3.5 rounded-full bg-blue-600 shrink-0 ml-1.5" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Target Progress Box */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Monthly Target
          </span>
          <CircularProgress value={78} max={100} />
        </div>
        <p className="text-[12px] text-slate-900 font-semibold leading-snug">
          78% Attained (₹4.82 Cr)
        </p>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full w-[78%] transition-all" />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Sidebar Drawer                                              */
/* ------------------------------------------------------------------ */

export function MobileSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between z-10 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <BrandWordmark />
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {NAV_GROUPS.map((grp) => (
                  <div key={grp.group} className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                      {grp.group}
                    </span>
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        item.href === "/dashboard"
                          ? pathname === "/dashboard"
                          : pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Rajesh Varma</span>
              <button
                onClick={() => {
                  alert("Signed out");
                  onClose();
                }}
                className="text-rose-600 font-medium hover:underline"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      aria-label="Open Navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
