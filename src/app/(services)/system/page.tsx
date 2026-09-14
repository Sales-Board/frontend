import React from "react";
import { Database, ShieldCheck, Server } from "lucide-react";
import { getSystemView } from "@/dal/system";
import { ModelTrainingPanel } from "@/components/model-training-panel";
import { IssueBanner, TableEmptyRow } from "@/components/states";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
  humanize,
} from "@/lib/format";

/**
 * System — connection health, data integrity and the ML model catalogue.
 *
 * GET /api/health, /api/data/quality, /api/data/validation, /api/ml/models.
 * Training is started from the panel below (POST /api/ml/train).
 *
 * This replaces the former Settings screen: the backend exposes no settings to
 * read or write, so there was nothing for a preferences form to persist.
 */
export default async function SystemPage() {
  const data = await getSystemView();
  const { status } = data;

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            System
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Health, Data Quality & Models
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {status.generatedAt
              ? `Quality snapshot generated ${formatDateTime(status.generatedAt)}.`
              : "Quality snapshot unavailable."}
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">API</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                status.apiReachable ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="font-semibold text-slate-900">
              {status.apiReachable ? "Reachable" : "Unreachable"}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Requests are proxied server-side; the browser never calls the API
            host directly.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Database</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                status.databaseStatus === "connected"
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
            />
            <span className="font-semibold text-slate-900">
              {humanize(status.databaseStatus)}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Reported by /api/health.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
          Table row counts
        </h3>
        {status.tableCounts.length === 0 ? (
          <p className="pt-3 text-xs text-slate-500">No counts available.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {status.tableCounts.map((row) => (
              <div
                key={row.table}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
              >
                <span className="block truncate text-[11px] font-medium text-slate-500">
                  {row.table}
                </span>
                <span className="mt-0.5 block text-lg font-bold tabular-nums text-slate-900">
                  {formatNumber(row.count)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
            Field completeness
          </h3>
          {status.completeness.length === 0 ? (
            <p className="pt-3 text-xs text-slate-500">Nothing to report.</p>
          ) : (
            <ul className="mt-3 space-y-2.5 text-xs">
              {status.completeness.map((item) => (
                <li key={item.field} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="truncate pr-2 text-slate-600">
                      {humanize(item.field.replace(/_ratio$/, ""))}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      {formatPercent(item.pct, 0)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        item.pct >= 95
                          ? "bg-emerald-600"
                          : item.pct >= 70
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(item.pct, 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Validation issues
              </h3>
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                status.totalIssues === 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {formatNumber(status.totalIssues)}
            </span>
          </div>
          {status.issues.length === 0 ? (
            <p className="pt-3 text-xs text-slate-500">
              No data-integrity issues reported.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 text-xs">
              {status.issues.map((issue) => (
                <li key={issue.code} className="flex justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span className="block font-medium text-slate-900">
                      {issue.message}
                    </span>
                    <span className="block font-mono text-[11px] text-slate-400">
                      {issue.code} · {issue.severity}
                    </span>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {formatNumber(issue.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ModelTrainingPanel />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">Model catalogue</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Model</th>
                <th className="px-4 pb-3">Status</th>
                <th className="px-4 pb-3">Training rows</th>
                <th className="px-4 pb-3">Latest job</th>
                <th className="pb-3 pl-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.models.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  message="No models trained yet. Start a training run above."
                />
              ) : (
                data.models.map((model) => (
                  <tr
                    key={model.model_name}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {model.model_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {model.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900">
                      {formatNumber(model.training_rows)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">
                      #{model.latest_job_id}
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500">
                      {formatDateTime(model.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
