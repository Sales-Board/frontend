import React from "react";
import { AlertTriangle, Inbox, PlugZap } from "lucide-react";
import type { LoadIssue } from "@/dal/types";

/**
 * Shared empty / degraded states.
 *
 * Against a freshly migrated database every list is legitimately empty, and the
 * API server may not be running at all. Those are different situations and the
 * UI says which one it is instead of rendering a blank table.
 */

/**
 * Banner for reads that failed while others succeeded. Renders nothing when
 * there are no issues, so screens can drop it in unconditionally.
 */
export function IssueBanner({ issues }: { issues: LoadIssue[] }) {
  if (issues.length === 0) return null;

  const allUnreachable = issues.every((issue) => issue.unreachable);

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
        allUnreachable
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {allUnreachable ? (
        <PlugZap className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="space-y-1">
        <p className="font-semibold">
          {allUnreachable
            ? "Cannot reach the API server."
            : `${issues.length} request${issues.length > 1 ? "s" : ""} failed. Showing what loaded.`}
        </p>
        {allUnreachable ? (
          <p className="opacity-90">
            Start the backend, then reload. The frontend proxies every call
            server-side, so nothing renders until the API answers.
          </p>
        ) : (
          <ul className="space-y-0.5 opacity-90">
            {issues.map((issue) => (
              <li key={issue.source}>
                <span className="font-medium">{issue.source}</span> — {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Placeholder for a list that loaded successfully and is genuinely empty. */
export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Icon className="h-6 w-6 text-slate-400" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint ? <p className="max-w-md text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/** Wraps a table body so an empty result explains itself inside the layout. */
export function TableEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-xs text-slate-500">
        {message}
      </td>
    </tr>
  );
}

/** Skeleton rows for Suspense fallbacks. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-9 animate-pulse rounded-lg bg-slate-100"
          style={{ animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
