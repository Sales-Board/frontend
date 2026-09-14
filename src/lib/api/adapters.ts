import type * as S from "./schema";
import type {
  CallRow,
  CampaignRow,
  ChannelStat,
  CustomerRow,
  DecisionCard,
  EngagementBreakdown,
  FollowupRow,
  HandlerWorkload,
  JourneyStep,
  LeadRow,
  LeadWorkspace,
  OutcomeRow,
  PipelineColumn,
  PipelineStatus,
  PredictionCard,
  ProductRow,
  ScoreBand,
  TaskRow,
  TimelineItem,
} from "@/dal/types";

/**
 * Wire types → view models. Pure functions only; no fetching, no invention.
 *
 * Every derived value here is either a direct field copy, a unit conversion, or
 * an aggregate over rows the backend returned. Nothing fabricates a customer
 * attribute the dataset does not contain.
 */

/* ── Leads ───────────────────────────────────────────────────────────────── */

/** Score banding for badges. Scores are 0–100 as stored on the lead. */
export function toScoreBand(score: number | null): ScoreBand {
  if (score === null || Number.isNaN(score)) return "unscored";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const NAMED_PIPELINE_STATUSES = new Set(["new", "qualified", "converted", "lost"]);

/**
 * Maps a raw `Label_Source_Lead_Status` onto a pipeline column.
 *
 * The backend's funnel and pipeline reports group by `Lead.status` lowercased
 * and only name four buckets, but total counts *every* status. Anything else
 * lands in `other` so the columns reconcile with the reported total.
 */
export function toPipelineStatus(status: string | null): PipelineStatus {
  const key = (status ?? "").toLowerCase();
  return NAMED_PIPELINE_STATUSES.has(key) ? (key as PipelineStatus) : "other";
}

/**
 * @param customerRefs `customer_id` → anonymized `Customer_ID`, when the caller
 * has already loaded customers. Leads carry only the numeric id.
 */
export function toLeadRow(
  lead: S.Lead,
  customerRefs?: Map<number, string>,
): LeadRow {
  return {
    id: lead.id,
    customerId: lead.customer_id,
    campaignId: lead.campaign_id,
    customerRef:
      customerRefs?.get(lead.customer_id) ?? `Customer #${lead.customer_id}`,
    channel: lead.CRM_Channel ?? "unknown",
    medium: lead.CRM_Data_Medium ?? "unknown",
    status: lead.Label_Source_Lead_Status,
    pipelineStatus: toPipelineStatus(lead.Label_Source_Lead_Status),
    stage: lead.current_stage,
    section: lead.current_section ?? "unassigned",
    handler: lead.current_handler ?? "Unassigned",
    priority: lead.priority,
    score: lead.lead_score,
    scoreBand: toScoreBand(lead.lead_score),
    recommendedAction: lead.recommended_action,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  };
}

export const toCustomerRefMap = (customers: S.Customer[]): Map<number, string> =>
  new Map(customers.map((c) => [c.id, c.Customer_ID]));

/* ── Customers, products, campaigns ──────────────────────────────────────── */

export function toCustomerRow(customer: S.Customer): CustomerRow {
  return {
    id: customer.id,
    customerRef: customer.Customer_ID,
    gender: customer.CRM_Gender ?? "Unknown",
    ageBand: customer.CRM_Age_Band ?? "Unknown",
    incomeBand: customer.CRM_Income_Band ?? "Unknown",
    occupation: customer.CRM_Occupation ?? "Unknown",
    education: customer.CRM_Education ?? "Unknown",
    tobaccoUser: customer.CRM_Tobacco_User ?? "Unknown",
    nonResident: customer.CRM_NonResident_Flag ?? "Unknown",
    existingPlan: customer.CRM_Existing_Plan_Flag ?? "None",
    createdAt: customer.created_at,
  };
}

export const toProductRow = (product: S.Product): ProductRow => ({
  id: product.id,
  code: product.CRM_Product_Code,
  name: product.CRM_Product_Name,
});

export const toCampaignRow = (campaign: S.Campaign): CampaignRow => ({
  id: campaign.id,
  code: campaign.code,
  name: campaign.CRM_UTM_Campaign,
  channel: campaign.CRM_UTM_Source ?? "unknown",
  status: campaign.status,
  startDate: campaign.start_date,
  endDate: campaign.end_date,
});

/* ── Operational records ─────────────────────────────────────────────────── */

export const toCallRow = (call: S.Call): CallRow => ({
  id: call.id,
  leadId: call.lead_id,
  customerId: call.customer_id,
  direction: call.CDR_Call_Direction,
  status: call.CDR_Top_Call_Status,
  phoneNumber: call.phone_number,
  notes: call.notes,
  durationSeconds: call.CDR_Avg_Talk_Sec,
  scheduledAt: call.scheduled_at,
  startedAt: call.started_at,
  endedAt: call.ended_at,
});

export const toTaskRow = (task: S.Task): TaskRow => ({
  id: task.id,
  leadId: task.lead_id,
  customerId: task.customer_id,
  title: task.Label_Source_Disposition,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueAt: task.due_at,
});

export const toFollowupRow = (followup: S.Followup): FollowupRow => ({
  id: followup.id,
  taskId: followup.task_id,
  leadId: followup.lead_id,
  customerId: followup.customer_id,
  channel: followup.channel,
  notes: followup.Label_Basis,
  status: followup.status,
  scheduledAt: followup.scheduled_at,
  completedAt: followup.completed_at,
});

export const toJourneyStep = (event: S.WebsiteEvent): JourneyStep => ({
  id: event.id,
  eventName: event.event_name,
  stepName: event.WEB_Step_Name,
  stepNumber: event.WEB_Step_Number,
  deviceType: event.WEB_Device_Type,
  isRepeatVisitor: event.WEB_New_Vs_Repeat,
  at: event.event_time,
});

export const toTimelineItem = (event: S.LeadTimelineEvent): TimelineItem => ({
  id: event.id,
  eventType: event.event_type,
  eventSource: event.event_source,
  at: event.created_at,
  details: event.details,
});

export const toOutcomeRow = (outcome: S.LeadOutcome): OutcomeRow => ({
  id: outcome.id,
  actionType: outcome.action_type,
  outcomeCode: outcome.outcome_code,
  outcomeLabel: outcome.outcome_label,
  notes: outcome.notes,
  followupRequired: outcome.followup_required,
  nextActionHint: outcome.next_action_hint,
  at: outcome.created_at,
});

/* ── AI & decisions ──────────────────────────────────────────────────────── */

/** Scores are 0–1 for most prediction types; clamp defensively for meters. */
const toPct = (value: number) => Math.max(0, Math.min(100, value * 100));

export const toPredictionCard = (
  prediction: S.AIPrediction | S.AIPredictionLog,
): PredictionCard => ({
  predictionType: prediction.prediction_type,
  label: prediction.label,
  modelName: prediction.model_name,
  score: prediction.score,
  scorePct: toPct(prediction.score),
  rationale: prediction.rationale ?? "",
  details: prediction.details,
  createdAt: "created_at" in prediction ? prediction.created_at : null,
});

export const toDecisionCard = (
  decision: S.Decision | S.DecisionLog,
): DecisionCard => ({
  decisionType: decision.decision_type,
  recommendedAction: decision.recommended_action,
  priority: decision.priority,
  confidencePct: toPct(decision.confidence),
  rationale: decision.rationale,
  inputs: decision.inputs,
  createdAt: "created_at" in decision ? decision.created_at : null,
});

/* ── Aggregates ──────────────────────────────────────────────────────────── */

export function toEngagementBreakdown(
  summary: S.LeadEngagementSummary,
): EngagementBreakdown {
  return {
    totalEvents: summary.total_events,
    totalMetricValue: summary.total_metric_value,
    byChannel: Object.entries(summary.by_channel ?? {})
      .map(([channel, value]) => ({
        channel,
        events: value.events,
        metricSum: value.metric_sum,
      }))
      .sort((a, b) => b.events - a.events),
  };
}

export function toChannelStats(items: S.ChannelAnalyticsItem[]): ChannelStat[] {
  const totalLeads = items.reduce((sum, item) => sum + item.lead_count, 0);
  return items
    .map((item) => ({
      channel: item.channel,
      leadCount: item.lead_count,
      engagementEvents: item.engagement_events,
      sharePct: totalLeads > 0 ? (item.lead_count / totalLeads) * 100 : 0,
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

const PIPELINE_COLUMNS: { key: PipelineStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "converted", label: "Converted" },
  { key: "lost", label: "Lost" },
  { key: "other", label: "Other" },
];

/**
 * Buckets leads into pipeline columns. The `other` column is dropped when
 * empty, but kept whenever any lead carries a status outside the named four —
 * otherwise the visible counts would not add up to the reported total.
 */
export function toPipelineColumns(leads: LeadRow[]): PipelineColumn[] {
  const grouped = new Map<PipelineStatus, LeadRow[]>();
  for (const lead of leads) {
    const bucket = grouped.get(lead.pipelineStatus) ?? [];
    bucket.push(lead);
    grouped.set(lead.pipelineStatus, bucket);
  }

  return PIPELINE_COLUMNS.filter(
    (column) => column.key !== "other" || (grouped.get("other")?.length ?? 0) > 0,
  ).map((column) => {
    const bucket = grouped.get(column.key) ?? [];
    return {
      key: column.key,
      label: column.label,
      count: bucket.length,
      leads: bucket.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)),
    };
  });
}

/**
 * Builds per-handler load from leads, tasks and follow-ups.
 *
 * The backend has no user or team table; `current_handler` on the lead is the
 * only record of ownership, and tasks/follow-ups attach to leads rather than to
 * people, so their counts are attributed through the owning lead.
 */
export function toHandlerWorkloads(
  leads: LeadRow[],
  tasks: TaskRow[],
  followups: FollowupRow[],
): HandlerWorkload[] {
  const handlerByLead = new Map(leads.map((lead) => [lead.id, lead.handler]));

  const buckets = new Map<
    string,
    {
      sections: Set<string>;
      leadCount: number;
      convertedLeads: number;
      openTasks: number;
      pendingFollowups: number;
    }
  >();

  const bucketFor = (handler: string) => {
    let bucket = buckets.get(handler);
    if (!bucket) {
      bucket = {
        sections: new Set<string>(),
        leadCount: 0,
        convertedLeads: 0,
        openTasks: 0,
        pendingFollowups: 0,
      };
      buckets.set(handler, bucket);
    }
    return bucket;
  };

  for (const lead of leads) {
    const bucket = bucketFor(lead.handler);
    bucket.leadCount += 1;
    bucket.sections.add(lead.section);
    if (lead.pipelineStatus === "converted") bucket.convertedLeads += 1;
  }

  for (const task of tasks) {
    if (task.leadId === null) continue;
    const handler = handlerByLead.get(task.leadId);
    if (!handler) continue;
    if (task.status === "open" || task.status === "in_progress") {
      bucketFor(handler).openTasks += 1;
    }
  }

  for (const followup of followups) {
    if (followup.leadId === null) continue;
    const handler = handlerByLead.get(followup.leadId);
    if (!handler) continue;
    if (followup.status === "pending" || followup.status === "scheduled") {
      bucketFor(handler).pendingFollowups += 1;
    }
  }

  return Array.from(buckets.entries())
    .map(([handler, bucket]) => ({
      handler,
      sections: Array.from(bucket.sections).sort(),
      leadCount: bucket.leadCount,
      convertedLeads: bucket.convertedLeads,
      openTasks: bucket.openTasks,
      pendingFollowups: bucket.pendingFollowups,
      conversionPct:
        bucket.leadCount > 0
          ? (bucket.convertedLeads / bucket.leadCount) * 100
          : 0,
    }))
    .sort((a, b) => b.leadCount - a.leadCount);
}

/* ── Lead workspace ──────────────────────────────────────────────────────── */

/** Folds the unified `/leads/{id}/details` payload into one view model. */
export function toLeadWorkspace(details: S.LeadDetails): LeadWorkspace {
  const customerRefs = details.customer
    ? new Map([[details.customer.id, details.customer.Customer_ID]])
    : undefined;

  return {
    lead: toLeadRow(details.lead, customerRefs),
    customer: details.customer ? toCustomerRow(details.customer) : null,
    campaign: details.campaign ? toCampaignRow(details.campaign) : null,
    assignment: details.assignment
      ? {
          section: details.assignment.to_section,
          handler: details.assignment.to_handler,
          fromSection: details.assignment.from_section,
          fromHandler: details.assignment.from_handler,
          assignmentType: details.assignment.assignment_type,
          reason: details.assignment.reason,
          at: details.assignment.created_at,
        }
      : null,
    engagement: toEngagementBreakdown(details.engagement),
    journey: (details.journey ?? []).map(toJourneyStep),
    latestPredictions: Object.values(details.ai?.latest ?? {}).map(
      toPredictionCard,
    ),
    recentDecisions: (details.ai?.recent_decisions ?? []).map(toDecisionCard),
    calls: (details.calls ?? []).map(toCallRow),
    tasks: (details.tasks ?? []).map(toTaskRow),
    followups: (details.followups ?? []).map(toFollowupRow),
    outcomes: (details.outcomes ?? []).map(toOutcomeRow),
    timeline: (details.timeline ?? []).map(toTimelineItem),
  };
}
