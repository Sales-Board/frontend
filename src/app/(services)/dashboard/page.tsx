import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDashboardView } from "@/dal/dashboard";
import { StatCard } from "@/components/stat-card";
import { FunnelChart, ChannelChart } from "@/components/analytics-charts";
import { LeadTable } from "@/components/lead-table";
import { QuickActions } from "@/components/quick-actions";
import { IssueBanner } from "@/components/states";
import { formatNumber } from "@/lib/format";

/**
 * Dashboard — headline counts, funnel, channel mix and the newest leads.
 * Data comes from `getDashboardView` (see that loader for the routes it calls).
 */
export default async function DashboardPage() {
  const data = await getDashboardView();

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Overview
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Lead Intelligence Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live counts from the lead, campaign, call and task modules.
          </p>
        </div>

        <Link
          href="/leads"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700"
        >
          <span>Open lead queue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <IssueBanner issues={data.issues} />

      {/* Operational strip — task and follow-up load from /api/reports/workload. */}
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs md:grid-cols-4">
        <Stat label="Open Tasks" value={data.workload.open_tasks} tone="text-amber-700" />
        <Stat
          label="In Progress"
          value={data.workload.in_progress_tasks}
          tone="text-blue-700"
        />
        <Stat
          label="Pending Follow-ups"
          value={data.workload.pending_followups}
          tone="text-slate-900"
        />
        <Stat
          label="Completed Tasks"
          value={data.workload.completed_tasks}
          tone="text-emerald-700"
          last
        />
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {data.metrics.map((metric, index) => (
          <StatCard key={metric.id} metric={metric} index={index} />
        ))}
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart data={data.funnel} />
        <ChannelChart data={data.channels} />
      </div>

      <LeadTable
        leads={data.recentLeads}
        title="Most recent leads"
        compact
        emptyMessage="No leads in the database yet. Run the backend's sample-data preload to populate it."
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  last = false,
}: {
  label: string;
  value: number;
  tone: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-0.5 ${last ? "" : "border-r border-slate-100"}`}
    >
      <span className="text-[11px] font-medium uppercase text-slate-500">
        {label}
      </span>
      <span className={`font-semibold tabular-nums ${tone}`}>
        {formatNumber(value)}
      </span>
    </div>
  );
}
