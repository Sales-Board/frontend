/**
 * View models rendered by the UI.
 *
 * These are derived from the backend wire types in `lib/api/schema.ts` by the
 * adapters in `lib/api/adapters.ts`. Nothing here invents customer attributes:
 * the source dataset is anonymized (a `Customer_ID` plus banded demographics),
 * and it carries no names, contact details or monetary values.
 */

/** A headline number on a dashboard card. */
export interface KPIMetric {
  id: string;
  label: string;
  /** Preformatted for display. */
  value: string;
  rawValue: number;
  /** Secondary line under the value. */
  caption: string;
  /** 0–100, omitted when the metric has no meaningful ceiling. */
  progressPct?: number;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

/** Lead score banding used for badges and sorting. */
export type ScoreBand = "high" | "medium" | "low" | "unscored";

/**
 * Pipeline buckets, keyed by the lowercased `Label_Source_Lead_Status` values
 * the backend counts. `other` collects every status outside the named four —
 * without it the columns would not sum to the reported total.
 */
export type PipelineStatus =
  | "new"
  | "qualified"
  | "converted"
  | "lost"
  | "other";

export interface LeadRow {
  id: number;
  customerId: number;
  campaignId: number | null;
  /** Anonymized `Customer_ID` when resolvable, else `Customer #<id>`. */
  customerRef: string;
  channel: string;
  medium: string;
  /** Raw `Label_Source_Lead_Status`, as stored. */
  status: string;
  /** Which pipeline column this lead falls into. */
  pipelineStatus: PipelineStatus;
  stage: string;
  section: string;
  handler: string;
  priority: string;
  score: number | null;
  scoreBand: ScoreBand;
  recommendedAction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRow {
  id: number;
  customerRef: string;
  gender: string;
  ageBand: string;
  incomeBand: string;
  occupation: string;
  education: string;
  tobaccoUser: string;
  nonResident: string;
  existingPlan: string;
  createdAt: string;
}

export interface ProductRow {
  id: number;
  code: string;
  name: string;
}

export interface CampaignRow {
  id: number;
  code: string;
  name: string;
  channel: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

/** A campaign joined with its conversion figures from the reports module. */
export interface CampaignPerformanceRow extends CampaignRow {
  leadCount: number;
  convertedLeads: number;
  /** Already converted to a percentage. */
  conversionPct: number;
}

export interface ChannelStat {
  channel: string;
  leadCount: number;
  engagementEvents: number;
  /** Share of total leads, as a percentage. */
  sharePct: number;
}

export interface PipelineColumn {
  key: PipelineStatus;
  label: string;
  count: number;
  leads: LeadRow[];
}

/**
 * Per-handler load, aggregated client-side from leads, tasks and follow-ups.
 * The backend has no user or team entity — `current_handler` is the only
 * identifier of who owns work.
 */
export interface HandlerWorkload {
  handler: string;
  sections: string[];
  leadCount: number;
  convertedLeads: number;
  openTasks: number;
  pendingFollowups: number;
  /** Converted / total leads for this handler, as a percentage. */
  conversionPct: number;
}

export interface CallRow {
  id: number;
  leadId: number | null;
  customerId: number | null;
  direction: string;
  status: string;
  phoneNumber: string | null;
  notes: string | null;
  durationSeconds: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface TaskRow {
  id: number;
  leadId: number | null;
  customerId: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
}

export interface FollowupRow {
  id: number;
  taskId: number | null;
  leadId: number | null;
  customerId: number | null;
  channel: string;
  notes: string | null;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
}

export interface JourneyStep {
  id: number;
  eventName: string;
  stepName: string | null;
  stepNumber: number | null;
  deviceType: string | null;
  isRepeatVisitor: boolean;
  at: string;
}

export interface TimelineItem {
  id: number;
  eventType: string;
  eventSource: string;
  at: string;
  details: Record<string, unknown> | null;
}

export interface OutcomeRow {
  id: number;
  actionType: string;
  outcomeCode: string;
  outcomeLabel: string | null;
  notes: string | null;
  followupRequired: boolean;
  nextActionHint: string | null;
  at: string;
}

/** One AI prediction, normalized for card rendering. */
export interface PredictionCard {
  predictionType: string;
  label: string;
  modelName: string;
  /** Raw score as returned (0–1 for most prediction types). */
  score: number;
  /** Score expressed 0–100 for meters and badges. */
  scorePct: number;
  rationale: string;
  details: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface DecisionCard {
  decisionType: string;
  recommendedAction: string;
  priority: string;
  /** Confidence expressed 0–100. */
  confidencePct: number;
  rationale: string;
  inputs: Record<string, unknown> | null;
  createdAt: string | null;
}

/** Engagement roll-up for a single lead. */
export interface EngagementBreakdown {
  totalEvents: number;
  totalMetricValue: number;
  byChannel: { channel: string; events: number; metricSum: number }[];
}

/** Everything the lead workspace renders, from one `/details` call. */
export interface LeadWorkspace {
  lead: LeadRow;
  customer: CustomerRow | null;
  campaign: CampaignRow | null;
  assignment: {
    section: string | null;
    handler: string | null;
    fromSection: string | null;
    fromHandler: string | null;
    assignmentType: string;
    reason: string | null;
    at: string;
  } | null;
  engagement: EngagementBreakdown;
  journey: JourneyStep[];
  latestPredictions: PredictionCard[];
  recentDecisions: DecisionCard[];
  calls: CallRow[];
  tasks: TaskRow[];
  followups: FollowupRow[];
  outcomes: OutcomeRow[];
  timeline: TimelineItem[];
}

/** System health and data-integrity snapshot for the System screen. */
export interface SystemStatus {
  apiReachable: boolean;
  databaseStatus: string;
  tableCounts: { table: string; count: number }[];
  completeness: { field: string; pct: number }[];
  issues: {
    code: string;
    message: string;
    severity: string;
    count: number;
  }[];
  totalIssues: number;
  generatedAt: string | null;
}

/** Non-fatal problem surfaced on a screen that aggregates many reads. */
export interface LoadIssue {
  /** Which read failed, e.g. "analytics/channels". */
  source: string;
  message: string;
  /** True when the backend could not be reached at all. */
  unreachable: boolean;
}
