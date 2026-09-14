"use client";

import React, { useEffect, useState } from "react";

type Status = "checking" | "online" | "degraded" | "offline";

const PRESENTATION: Record<Status, { dot: string; text: string; label: string }> = {
  checking: { dot: "bg-slate-400 animate-pulse", text: "text-slate-500", label: "Checking…" },
  online: { dot: "bg-emerald-500", text: "text-emerald-700", label: "API online" },
  degraded: { dot: "bg-amber-500", text: "text-amber-700", label: "Database issue" },
  offline: { dot: "bg-rose-500", text: "text-rose-700", label: "API offline" },
};

/**
 * Live backend health, polled through the same-origin proxy at /api/health.
 *
 * This replaces what used to be a hardcoded quota widget. The backend has no
 * revenue or target data, but whether it is reachable is genuinely useful —
 * every screen here depends on it.
 */
export function ApiStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("checking");
  const [database, setDatabase] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        if (!response.ok) {
          setStatus("offline");
          return;
        }
        const payload: { status: string; database: string } = await response.json();
        setDatabase(payload.database);
        setStatus(payload.database === "connected" ? "online" : "degraded");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    check();
    const timer = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const presentation = PRESENTATION[status];

  if (compact) {
    return (
      <span
        title={presentation.label}
        className={`inline-flex h-2 w-2 rounded-full ${presentation.dot}`}
      />
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Backend
        </span>
        <span className={`h-2 w-2 rounded-full ${presentation.dot}`} />
      </div>
      <p className={`text-[12px] font-semibold leading-snug ${presentation.text}`}>
        {presentation.label}
      </p>
      <p className="text-[11px] text-slate-500">
        {status === "offline"
          ? "Start the API server to load data."
          : database
            ? `Database: ${database}`
            : "Contacting /api/health…"}
      </p>
    </div>
  );
}
