"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LeftRail,
  SecondarySidebar,
  MobileSidebar,
  MobileMenuButton,
} from "./sidebar";
import { BrandIcon } from "./brand";
import { ChevronRight, RefreshCw } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 700);
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return ["Dashboard"];
    return segments.map(
      (s) => s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")
    );
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Pinned Left Rail (Narrow 56px, flush to the screen's left edge) */}
      <LeftRail />

      {/* Pinned Secondary Sidebar (224px navigation panel) */}
      <SecondarySidebar />

      {/* Mobile Drawer */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Viewport Container (Fills 100% of remaining screen width) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <div className="lg:hidden">
              <MobileMenuButton onClick={() => setMobileOpen(true)} />
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-600 font-medium hidden sm:inline">sales:board</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline" />
              {breadcrumbs.map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? "text-slate-900 font-semibold"
                        : "text-slate-500"
                    }
                  >
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync live pipeline"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : "text-slate-400"}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
