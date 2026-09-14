import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import type {
  ImportJob,
  PipelineReport,
  WorkloadReport,
} from "@/lib/api/schema";
import { collectIssues, toIssue } from "./shared";
import type { CampaignPerformanceRow, LoadIssue } from "./types";

const EMPTY_PIPELINE: PipelineReport = {
  total_leads: 0,
  new_leads: 0,
  qualified_leads: 0,
  converted_leads: 0,
  lost_leads: 0,
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

export interface ReportsView {
  pipeline: PipelineReport;
  workload: WorkloadReport;
  campaigns: CampaignPerformanceRow[];
  /** Import and export jobs already run on the server. */
  history: ImportJob[];
  issues: LoadIssue[];
}

/**
 * Reports screen.
 *
 * GET /api/reports/pipeline              lead counts by status
 * GET /api/reports/workload              task and follow-up load
 * GET /api/reports/campaign-performance  per-campaign conversion (enveloped)
 * GET /api/data/history                  past import/export jobs
 *
 * Exports are triggered by the `exportResource` server action; the backend
 * writes a file server-side and exposes no download route for it.
 */
export async function getReportsView(): Promise<ReportsView> {
  const [pipeline, workload, campaignReport, history] = await Promise.all([
    tolerate(api.getPipelineReport(), EMPTY_PIPELINE),
    tolerate(api.getWorkloadReport(), EMPTY_WORKLOAD),
    tolerate(api.getCampaignPerformanceReport(), { items: [] }),
    tolerate(api.getDataHistory({ limit: 25 }), []),
  ]);

  return {
    pipeline: pipeline.data,
    workload: workload.data,
    campaigns: campaignReport.data.items
      .map((item) => ({
        id: item.campaign_id,
        code: item.campaign_code,
        name: item.campaign_name,
        channel: "—",
        status: "—",
        startDate: null,
        endDate: null,
        leadCount: item.lead_count,
        convertedLeads: item.converted_leads,
        conversionPct: item.conversion_rate * 100,
      }))
      .sort((a, b) => b.leadCount - a.leadCount),
    history: history.data,
    issues: collectIssues(
      toIssue("reports/pipeline", pipeline.error),
      toIssue("reports/workload", workload.error),
      toIssue("reports/campaign-performance", campaignReport.error),
      toIssue("data/history", history.error),
    ),
  };
}
