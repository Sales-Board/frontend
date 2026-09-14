import "server-only";
import { ApiError, tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import {
  toCustomerRefMap,
  toLeadRow,
  toLeadWorkspace,
  toPipelineColumns,
} from "@/lib/api/adapters";
import type { PipelineReport } from "@/lib/api/schema";
import { MAX_PAGE_SIZE, collectIssues, toIssue } from "./shared";
import type {
  LeadRow,
  LeadWorkspace,
  LoadIssue,
  PipelineColumn,
} from "./types";

export interface LeadsView {
  leads: LeadRow[];
  /** Distinct values present in the returned rows, for filter controls. */
  statuses: string[];
  handlers: string[];
  issues: LoadIssue[];
}

/**
 * Leads queue.
 *
 * GET /api/leads      the queue itself (skip/limit, optional customer/campaign)
 * GET /api/customers  to resolve each lead's anonymized Customer_ID
 */
export async function getLeadsView(
  options: { skip?: number; limit?: number; campaignId?: number } = {},
): Promise<LeadsView> {
  const limit = options.limit ?? 100;

  const [leads, customers] = await Promise.all([
    tolerate(
      api.listLeads({
        skip: options.skip,
        limit,
        campaign_id: options.campaignId,
      }),
      [],
    ),
    tolerate(api.listCustomers({ limit: MAX_PAGE_SIZE }), []),
  ]);

  // Built once, not per lead — this map is O(customers) to construct.
  const refs = toCustomerRefMap(customers.data);
  const rows = leads.data.map((lead) => toLeadRow(lead, refs));

  return {
    leads: rows,
    statuses: Array.from(new Set(rows.map((row) => row.status))).sort(),
    handlers: Array.from(new Set(rows.map((row) => row.handler))).sort(),
    issues: collectIssues(
      toIssue("leads", leads.error),
      toIssue("customers", customers.error),
    ),
  };
}

const EMPTY_PIPELINE: PipelineReport = {
  total_leads: 0,
  new_leads: 0,
  qualified_leads: 0,
  converted_leads: 0,
  lost_leads: 0,
};

export interface PipelineView {
  columns: PipelineColumn[];
  report: PipelineReport;
  /**
   * True when the rows loaded are only part of the table, so column counts are
   * a sample while `report` covers everything. The UI says so rather than
   * showing two totals that disagree.
   */
  isPartial: boolean;
  loadedCount: number;
  issues: LoadIssue[];
}

/**
 * Pipeline board.
 *
 * GET /api/reports/pipeline  authoritative totals per status bucket
 * GET /api/leads             the cards themselves (capped at 500 by the backend)
 * GET /api/customers         to resolve Customer_ID on each card
 */
export async function getPipelineView(): Promise<PipelineView> {
  const [report, leads, customers] = await Promise.all([
    tolerate(api.getPipelineReport(), EMPTY_PIPELINE),
    tolerate(api.listLeads({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listCustomers({ limit: MAX_PAGE_SIZE }), []),
  ]);

  // Built once, not per lead — this map is O(customers) to construct.
  const refs = toCustomerRefMap(customers.data);
  const rows = leads.data.map((lead) => toLeadRow(lead, refs));

  return {
    columns: toPipelineColumns(rows),
    report: report.data,
    isPartial: report.data.total_leads > rows.length,
    loadedCount: rows.length,
    issues: collectIssues(
      toIssue("reports/pipeline", report.error),
      toIssue("leads", leads.error),
      toIssue("customers", customers.error),
    ),
  };
}

export type LeadWorkspaceResult =
  | { ok: true; workspace: LeadWorkspace }
  | { ok: false; notFound: boolean; message: string };

/**
 * Lead workspace.
 *
 * GET /api/leads/{id}/details — a single payload carrying the lead, customer,
 * campaign, current assignment, engagement roll-up, journey, AI predictions,
 * decisions, calls, tasks, follow-ups, outcomes and timeline.
 */
export async function getLeadWorkspace(
  leadId: number,
): Promise<LeadWorkspaceResult> {
  try {
    return { ok: true, workspace: toLeadWorkspace(await api.getLeadDetails(leadId)) };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        notFound: error.isNotFound,
        message: error.message,
      };
    }
    throw error;
  }
}
