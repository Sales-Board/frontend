import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import { toChannelStats, toCustomerRefMap, toLeadRow } from "@/lib/api/adapters";
import { formatNumber, formatPercent } from "@/lib/format";
import type {
  AnalyticsFunnel,
  AnalyticsOverview,
  WorkloadReport,
} from "@/lib/api/schema";
import { collectIssues, toIssue } from "./shared";
import type { ChannelStat, KPIMetric, LeadRow, LoadIssue } from "./types";

const EMPTY_OVERVIEW: AnalyticsOverview = {
  total_customers: 0,
  total_leads: 0,
  total_campaigns: 0,
  total_calls: 0,
  open_tasks: 0,
  pending_followups: 0,
  converted_leads: 0,
  conversion_rate: 0,
};

const EMPTY_FUNNEL: AnalyticsFunnel = {
  new_leads: 0,
  qualified_leads: 0,
  converted_leads: 0,
  lost_leads: 0,
  total_leads: 0,
  conversion_rate: 0,
};

const EMPTY_WORKLOAD: WorkloadReport = {
  total_tasks: 0,
  open_tasks: 0,
  in_progress_tasks: 0,
  completed_tasks: 0,
  total_followups: 0,
  pending_followups: 0,
  completed_followups: 0,
};

export interface DashboardView {
  metrics: KPIMetric[];
  funnel: AnalyticsFunnel;
  workload: WorkloadReport;
  channels: ChannelStat[];
  recentLeads: LeadRow[];
  issues: LoadIssue[];
}

/**
 * Dashboard screen data.
 *
 * GET /api/dashboard           headline counts
 * GET /api/analytics/funnel    lead counts by status bucket
 * GET /api/analytics/channels  leads and engagement per channel
 * GET /api/reports/workload    task and follow-up load
 * GET /api/leads               most recent leads for the activity table
 * GET /api/customers           to resolve Customer_ID for those leads
 */
export async function getDashboardView(): Promise<DashboardView> {
  const [overview, funnel, channels, workload, leads, customers] =
    await Promise.all([
      tolerate(api.getDashboard(), EMPTY_OVERVIEW),
      tolerate(api.getAnalyticsFunnel(), EMPTY_FUNNEL),
      tolerate(api.getAnalyticsChannels(), { items: [] }),
      tolerate(api.getWorkloadReport(), EMPTY_WORKLOAD),
      tolerate(api.listLeads({ limit: 8 }), []),
      tolerate(api.listCustomers({ limit: 200 }), []),
    ]);

  const refs = toCustomerRefMap(customers.data);

  return {
    metrics: toDashboardMetrics(overview.data, workload.data),
    funnel: funnel.data,
    workload: workload.data,
    channels: toChannelStats(channels.data.items),
    recentLeads: leads.data.map((lead) => toLeadRow(lead, refs)),
    issues: collectIssues(
      toIssue("dashboard", overview.error),
      toIssue("analytics/funnel", funnel.error),
      toIssue("analytics/channels", channels.error),
      toIssue("reports/workload", workload.error),
      toIssue("leads", leads.error),
      toIssue("customers", customers.error),
    ),
  };
}

/** `conversion_rate` arrives as a fraction, so it is scaled here for display. */
function toDashboardMetrics(
  overview: AnalyticsOverview,
  workload: WorkloadReport,
): KPIMetric[] {
  const conversionPct = overview.conversion_rate * 100;
  const taskCompletionPct =
    workload.total_tasks > 0
      ? (workload.completed_tasks / workload.total_tasks) * 100
      : 0;

  return [
    {
      id: "leads",
      label: "Total Leads",
      value: formatNumber(overview.total_leads),
      rawValue: overview.total_leads,
      caption: `${formatNumber(overview.total_customers)} customers on record`,
    },
    {
      id: "converted",
      label: "Converted Leads",
      value: formatNumber(overview.converted_leads),
      rawValue: overview.converted_leads,
      caption: `${formatPercent(conversionPct)} conversion rate`,
      progressPct: conversionPct,
      tone: "positive",
    },
    {
      id: "calls",
      label: "Calls Logged",
      value: formatNumber(overview.total_calls),
      rawValue: overview.total_calls,
      caption: `${formatNumber(overview.total_campaigns)} campaigns running`,
    },
    {
      id: "open-work",
      label: "Open Tasks",
      value: formatNumber(overview.open_tasks),
      rawValue: overview.open_tasks,
      caption: `${formatNumber(overview.pending_followups)} follow-ups pending`,
      progressPct: taskCompletionPct,
      tone: overview.open_tasks > 0 ? "warning" : "neutral",
    },
  ];
}
