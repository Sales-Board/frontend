import React from "react";
import { getReportsView } from "@/dal/reports";
import { ExportPanel } from "@/components/export-panel";
import { IssueBanner, TableEmptyRow } from "@/components/states";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

/**
 * Reports — the aggregate report endpoints, plus data export.
 *
 * GET /api/reports/pipeline, /workload, /campaign-performance and
 * /api/data/history. Export runs through POST /api/data/export.
 *
 * These are live figures rather than stored documents: the backend has no
 * report-file catalogue to list or download.
 */
export default async function ReportsPage() {
  const data = await getReportsView();

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Governance
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Reports & Data Export
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Figures are computed on request from the live database.
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard
          title="Pipeline"
          rows={[
            { label: "Total leads", value: data.pipeline.total_leads },
            { label: "New", value: data.pipeline.new_leads },
            { label: "Qualified", value: data.pipeline.qualified_leads },
            { label: "Converted", value: data.pipeline.converted_leads },
            { label: "Lost", value: data.pipeline.lost_leads },
          ]}
        />
        <ReportCard
          title="Workload"
          rows={[
            { label: "Total tasks", value: data.workload.total_tasks },
            { label: "Open tasks", value: data.workload.open_tasks },
            { label: "In progress", value: data.workload.in_progress_tasks },
            { label: "Completed tasks", value: data.workload.completed_tasks },
            { label: "Total follow-ups", value: data.workload.total_followups },
            { label: "Pending follow-ups", value: data.workload.pending_followups },
            { label: "Completed follow-ups", value: data.workload.completed_followups },
          ]}
        />
      </div>

      <ExportPanel />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">
          Campaign performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Campaign</th>
                <th className="px-4 pb-3">Code</th>
                <th className="px-4 pb-3">Leads</th>
                <th className="px-4 pb-3">Converted</th>
                <th className="pb-3 pl-4 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.campaigns.length === 0 ? (
                <TableEmptyRow colSpan={5} message="No campaign data available." />
              ) : (
                data.campaigns.map((campaign) => (
                  <tr key={campaign.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="max-w-[280px] truncate py-3 pr-4 font-semibold text-slate-900">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {campaign.code}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900">
                      {formatNumber(campaign.leadCount)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-emerald-700">
                      {formatNumber(campaign.convertedLeads)}
                    </td>
                    <td className="py-3 pl-4 text-right font-semibold tabular-nums text-slate-900">
                      {formatPercent(campaign.conversionPct)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">
          Import & export history
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Dataset</th>
                <th className="px-4 pb-3">Status</th>
                <th className="px-4 pb-3">Rows</th>
                <th className="px-4 pb-3">Invalid</th>
                <th className="pb-3 pl-4 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.history.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  message="No import or export jobs recorded yet."
                />
              ) : (
                data.history.map((job) => (
                  <tr key={job.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="py-3 pr-4">
                      <span className="block font-semibold text-slate-900">
                        {job.dataset_name}
                      </span>
                      <span className="block max-w-[320px] truncate font-mono text-[11px] text-slate-400">
                        {job.source_path}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                          job.status === "completed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : job.status === "failed"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900">
                      {formatNumber(job.row_count)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {formatNumber(job.invalid_row_count)}
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500">
                      {formatDateTime(job.created_at)}
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

function ReportCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="border-b border-slate-100 pb-3 text-sm font-semibold text-slate-900">
        {title}
      </h3>
      <dl className="mt-3 space-y-1.5 text-xs">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between border-b border-slate-50 py-1 last:border-0"
          >
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {formatNumber(row.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
