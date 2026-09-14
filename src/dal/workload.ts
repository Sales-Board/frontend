import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import {
  toCustomerRefMap,
  toFollowupRow,
  toHandlerWorkloads,
  toLeadRow,
  toTaskRow,
} from "@/lib/api/adapters";
import type { WorkloadReport } from "@/lib/api/schema";
import { MAX_PAGE_SIZE, collectIssues, toIssue } from "./shared";
import type {
  FollowupRow,
  HandlerWorkload,
  LoadIssue,
  TaskRow,
} from "./types";

const EMPTY_WORKLOAD: WorkloadReport = {
  total_tasks: 0,
  open_tasks: 0,
  in_progress_tasks: 0,
  completed_tasks: 0,
  total_followups: 0,
  pending_followups: 0,
  completed_followups: 0,
};

export interface WorkloadView {
  report: WorkloadReport;
  handlers: HandlerWorkload[];
  tasks: TaskRow[];
  followups: FollowupRow[];
  /** Lead id → anonymized Customer_ID, for labelling task and follow-up rows. */
  leadLabels: Record<number, string>;
  issues: LoadIssue[];
}

/**
 * Workload screen — who is carrying what.
 *
 * There is no user or team table in the backend; `leads.current_handler` is the
 * only record of ownership, and tasks/follow-ups attach to leads rather than to
 * people. Per-handler figures are therefore aggregated here from three lists.
 *
 * GET /api/reports/workload  authoritative task/follow-up totals
 * GET /api/leads             ownership and conversion per handler
 * GET /api/tasks             open task counts
 * GET /api/followups         pending follow-up counts
 * GET /api/customers         to label rows with Customer_ID
 */
export async function getWorkloadView(): Promise<WorkloadView> {
  const [report, leads, tasks, followups, customers] = await Promise.all([
    tolerate(api.getWorkloadReport(), EMPTY_WORKLOAD),
    tolerate(api.listLeads({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listTasks({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listFollowups({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listCustomers({ limit: MAX_PAGE_SIZE }), []),
  ]);

  const refs = toCustomerRefMap(customers.data);
  const leadRows = leads.data.map((lead) => toLeadRow(lead, refs));
  const taskRows = tasks.data.map(toTaskRow);
  const followupRows = followups.data.map(toFollowupRow);

  const leadLabels: Record<number, string> = {};
  for (const lead of leadRows) leadLabels[lead.id] = lead.customerRef;

  return {
    report: report.data,
    handlers: toHandlerWorkloads(leadRows, taskRows, followupRows),
    tasks: taskRows,
    followups: followupRows,
    leadLabels,
    issues: collectIssues(
      toIssue("reports/workload", report.error),
      toIssue("leads", leads.error),
      toIssue("tasks", tasks.error),
      toIssue("followups", followups.error),
      toIssue("customers", customers.error),
    ),
  };
}
