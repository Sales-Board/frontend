"use client";

import React from "react";
import { TrendingUp, Radio } from "lucide-react";
import type { AnalyticsFunnel } from "@/lib/api/schema";
import type { ChannelStat } from "@/dal/types";
import { formatNumber, formatPercent, humanize } from "@/lib/format";
import { EmptyState } from "./states";

/**
 * Charts drawn from the analytics endpoints.
 *
 * These are horizontal bars rather than a time series: the backend stores no
 * historical snapshots, so there is no trend over time to plot.
 */

const FUNNEL_STEPS = [
  { key: "new_leads", label: "New", className: "bg-blue-600" },
  { key: "qualified_leads", label: "Qualified", className: "bg-indigo-600" },
  { key: "converted_leads", label: "Converted", className: "bg-emerald-600" },
  { key: "lost_leads", label: "Lost", className: "bg-rose-500" },
] as const;

export function FunnelChart({ data }: { data: AnalyticsFunnel }) {
  // The four named buckets need not sum to total_leads: the backend counts
  // every distinct status but only names these four.
  const named = FUNNEL_STEPS.reduce((sum, step) => sum + data[step.key], 0);
  const other = Math.max(0, data.total_leads - named);
  const max = Math.max(data.total_leads, 1);

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            Lead Funnel
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Leads by status
          </h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="tabular-nums">
            {formatPercent(data.conversion_rate * 100)} converted
          </span>
        </div>
      </div>

      {data.total_leads === 0 ? (
        <div className="pt-4">
          <EmptyState
            title="No leads yet"
            hint="Load the sample dataset into the database to populate the funnel."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {FUNNEL_STEPS.map((step) => {
            const value = data[step.key];
            return (
              <div key={step.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{step.label}</span>
                  <span className="tabular-nums text-slate-500">
                    {formatNumber(value)}
                    <span className="ml-1.5 text-slate-400">
                      {formatPercent((value / max) * 100, 0)}
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${step.className}`}
                    style={{ width: `${(value / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}

          {other > 0 ? (
            <p className="border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              {formatNumber(other)} lead{other === 1 ? "" : "s"} carry a status
              outside these four buckets and are counted in the total.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ChannelChart({ data }: { data: ChannelStat[] }) {
  const max = Math.max(...data.map((item) => item.leadCount), 1);

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            Acquisition
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Leads by channel
          </h3>
        </div>
        <Radio className="h-4 w-4 text-slate-400" />
      </div>

      {data.length === 0 ? (
        <div className="pt-4">
          <EmptyState title="No channel data" hint="Channels appear once leads exist." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.slice(0, 8).map((item) => (
            <div key={item.channel} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  {humanize(item.channel)}
                </span>
                <span className="tabular-nums text-slate-500">
                  {formatNumber(item.leadCount)}
                  <span className="ml-1.5 text-slate-400">
                    {formatPercent(item.sharePct, 0)}
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(item.leadCount / max) * 100}%` }}
                />
              </div>
              {item.engagementEvents > 0 ? (
                <span className="text-[11px] text-slate-400">
                  {formatNumber(item.engagementEvents)} engagement events
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
