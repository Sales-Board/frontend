import React from "react";
import Link from "next/link";
import { getPipelineView } from "@/dal/leads";
import { IssueBanner, EmptyState } from "@/components/states";
import { formatNumber, formatRelative, humanize } from "@/lib/format";

/**
 * Pipeline board — leads grouped by the status field the backend's funnel and
 * pipeline reports count.
 *
 * GET /api/reports/pipeline gives the authoritative totals across the whole
 * table; GET /api/leads supplies the cards but is capped at 500 rows, so the
 * page says when the board is showing a subset instead of quietly disagreeing
 * with the report.
 */
export default async function PipelinePage() {
  const data = await getPipelineView();

  const totals: { label: string; value: number }[] = [
    { label: "Total", value: data.report.total_leads },
    { label: "New", value: data.report.new_leads },
    { label: "Qualified", value: data.report.qualified_leads },
    { label: "Converted", value: data.report.converted_leads },
    { label: "Lost", value: data.report.lost_leads },
  ];

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Funnel
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Pipeline
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Grouped by lead status.
            {data.isPartial
              ? ` Showing the first ${formatNumber(data.loadedCount)} of ${formatNumber(data.report.total_leads)} leads — column counts are a sample, the totals below cover everything.`
              : ""}
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs md:grid-cols-5">
        {totals.map((total, index) => (
          <div
            key={total.label}
            className={`flex items-center justify-between px-2 py-0.5 ${
              index === totals.length - 1 ? "" : "md:border-r md:border-slate-100"
            }`}
          >
            <span className="text-[11px] font-medium uppercase text-slate-500">
              {total.label}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatNumber(total.value)}
            </span>
          </div>
        ))}
      </div>

      {data.columns.length === 0 ? (
        <EmptyState
          title="No leads to place on the board"
          hint="Run the backend's sample-data preload to populate the pipeline."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-5">
          {data.columns.map((column) => (
            <div
              key={column.key}
              className="flex min-w-[220px] flex-col rounded-xl border border-slate-200 bg-slate-100/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="block text-xs font-bold uppercase text-slate-900">
                  {column.label}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-blue-600 shadow-2xs">
                  {formatNumber(column.count)}
                </span>
              </div>

              <div className="space-y-2">
                {column.leads.slice(0, 40).map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="group block space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-blue-600">
                        Lead #{lead.id}
                      </span>
                      <span className="tabular-nums text-slate-400">
                        {lead.score === null ? "—" : lead.score.toFixed(0)}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                      {lead.customerRef}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {humanize(lead.channel)} · {lead.handler}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatRelative(lead.updatedAt)}
                    </p>
                  </Link>
                ))}

                {column.leads.length > 40 ? (
                  <p className="px-1 pt-1 text-[11px] text-slate-500">
                    +{formatNumber(column.leads.length - 40)} more
                  </p>
                ) : null}

                {column.leads.length === 0 ? (
                  <p className="px-1 py-6 text-center text-[11px] text-slate-400">
                    Empty
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
