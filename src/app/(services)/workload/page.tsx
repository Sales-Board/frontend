import React from "react";
import { getWorkloadView } from "@/dal/workload";
import { IssueBanner, TableEmptyRow } from "@/components/states";
import { formatNumber, formatPercent, formatRelative, humanize } from "@/lib/format";

/**
 * Workload — who is carrying what.
 *
 * The backend has no user or team table. `leads.current_handler` is the only
 * record of ownership, and tasks and follow-ups attach to leads rather than to
 * people, so per-handler figures are aggregated in `getWorkloadView` from
 * /api/leads, /api/tasks and /api/followups. The totals strip comes from
 * /api/reports/workload, which counts the whole table.
 */
export default async function WorkloadPage() {
  const data = await getWorkloadView();

  const totals = [
    { label: "Total tasks", value: data.report.total_tasks },
    { label: "Open", value: data.report.open_tasks },
    { label: "In progress", value: data.report.in_progress_tasks },
    { label: "Completed", value: data.report.completed_tasks },
    { label: "Follow-ups pending", value: data.report.pending_followups },
    { label: "Follow-ups done", value: data.report.completed_followups },
  ];

  const openTasks = data.tasks.filter(
    (task) => task.status === "open" || task.status === "in_progress",
  );

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Operations
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Workload by Handler
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ownership is taken from each lead&apos;s current handler — the backend
            stores no separate user or team records.
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs md:grid-cols-6">
        {totals.map((total, index) => (
          <div
            key={total.label}
            className={`flex flex-col px-2 py-0.5 ${
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

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">Handlers</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Handler</th>
                <th className="px-4 pb-3">Sections</th>
                <th className="px-4 pb-3">Leads</th>
                <th className="px-4 pb-3">Converted</th>
                <th className="px-4 pb-3">Conversion</th>
                <th className="px-4 pb-3">Open tasks</th>
                <th className="pb-3 pl-4 text-right">Pending follow-ups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.handlers.length === 0 ? (
                <TableEmptyRow
                  colSpan={7}
                  message="No leads assigned yet, so there is no workload to report."
                />
              ) : (
                data.handlers.map((handler) => (
                  <tr
                    key={handler.handler}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {handler.handler}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">
                      {handler.sections.map(humanize).join(", ")}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-900">
                      {formatNumber(handler.leadCount)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-emerald-700">
                      {formatNumber(handler.convertedLeads)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(handler.conversionPct, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatPercent(handler.conversionPct, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-amber-700">
                      {formatNumber(handler.openTasks)}
                    </td>
                    <td className="py-3 pl-4 text-right tabular-nums text-slate-600">
                      {formatNumber(handler.pendingFollowups)}
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
          Open tasks
          <span className="ml-2 text-xs font-normal tabular-nums text-slate-500">
            {formatNumber(openTasks.length)} loaded
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Task</th>
                <th className="px-4 pb-3">Lead</th>
                <th className="px-4 pb-3">Priority</th>
                <th className="px-4 pb-3">Status</th>
                <th className="pb-3 pl-4 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {openTasks.length === 0 ? (
                <TableEmptyRow colSpan={5} message="No open tasks." />
              ) : (
                openTasks.slice(0, 100).map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="max-w-[280px] py-3 pr-4">
                      <span className="block truncate font-semibold text-slate-900">
                        {task.title}
                      </span>
                      {task.description ? (
                        <span className="block truncate text-[11px] text-slate-500">
                          {task.description}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {task.leadId
                        ? (data.leadLabels[task.leadId] ?? `Lead #${task.leadId}`)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {humanize(task.priority)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {humanize(task.status)}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500">
                      {task.dueAt ? formatRelative(task.dueAt) : "—"}
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
