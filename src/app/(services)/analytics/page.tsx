import React from "react";
import { getAnalyticsView } from "@/dal/analytics";
import { FunnelChart, ChannelChart } from "@/components/analytics-charts";
import { IssueBanner, TableEmptyRow } from "@/components/states";
import { formatNumber, formatPercent, humanize } from "@/lib/format";

/**
 * Analytics — funnel, channel mix, campaign conversion and engagement volume.
 * See `getAnalyticsView` for the routes behind each block.
 *
 * There is no time series here: the backend stores no historical snapshots, so
 * month-over-month movement cannot be computed from its data.
 */
export default async function AnalyticsPage() {
  const data = await getAnalyticsView();

  const summary = [
    { label: "Customers", value: data.overview.total_customers },
    { label: "Leads", value: data.overview.total_leads },
    { label: "Campaigns", value: data.overview.total_campaigns },
    { label: "Calls", value: data.overview.total_calls },
  ];

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Analytics
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Funnel, Channels & Campaigns
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Aggregates across the lead, engagement and campaign modules.
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </span>
            <span className="mt-1 block text-xl font-bold tabular-nums text-slate-900">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChart data={data.funnel} />
        <ChannelChart data={data.channels} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">
          Engagement volume by channel
        </h3>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {data.engagement.map((item) => (
            <div
              key={item.channel}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {humanize(item.channel)}
              </span>
              <span className="mt-1 block text-lg font-bold tabular-nums text-slate-900">
                {formatNumber(item.events)}
              </span>
              <span className="text-[11px] text-slate-500">
                {formatNumber(item.metricSum)} engaged
              </span>
            </div>
          ))}
        </div>
        <p className="pt-3 text-[11px] text-slate-500">
          Counts reflect up to 500 most recent events per channel, read from
          /api/engagement/*.
        </p>
      </section>

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
                <th className="px-4 pb-3">Channel</th>
                <th className="px-4 pb-3">Leads</th>
                <th className="px-4 pb-3">Converted</th>
                <th className="pb-3 pl-4 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.campaigns.length === 0 ? (
                <TableEmptyRow colSpan={6} message="No campaign data available." />
              ) : (
                data.campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="max-w-[240px] truncate py-3 pr-4 font-semibold text-slate-900">
                      {campaign.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {campaign.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {humanize(campaign.channel)}
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
    </div>
  );
}
