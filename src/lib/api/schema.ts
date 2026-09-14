/**
 * Wire contract for the FastAPI backend.
 *
 * Field names here are the names that appear **on the wire**, not the Python
 * attribute names. The backend's Pydantic models declare Excel aliases
 * (`Field(alias="CRM_Channel")`, `serialization_alias="Excel_Fields"`) and
 * FastAPI serializes responses by alias, so `LeadRead.source_channel` arrives
 * as `CRM_Channel`. Keep this file in lockstep with `backend/app/schemas/`.
 *
 * Dates and datetimes arrive as ISO-8601 strings.
 */

/** Excel_Fields snapshot attached to every data-bearing record. */
export type ExcelFields = Record<string, unknown> | null;

export type IsoDateTime = string;
export type IsoDate = string;

/* ── Health ──────────────────────────────────────────────────────────────── */

export interface Health {
  status: string;
  database: string;
}

/* ── Customers ───────────────────────────────────────────────────────────── */

export interface Customer {
  id: number;
  /** Anonymized row id from the source dataset — there are no real names. */
  Customer_ID: string;
  CRM_Gender: string | null;
  CRM_Age_Band: string | null;
  CRM_Income_Band: string | null;
  CRM_Occupation: string | null;
  CRM_Education: string | null;
  CRM_Tobacco_User: string | null;
  CRM_NonResident_Flag: string | null;
  CRM_Existing_Plan_Flag: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface CustomerWrite {
  Customer_ID?: string;
  CRM_Gender?: string | null;
  CRM_Age_Band?: string | null;
  CRM_Income_Band?: string | null;
  CRM_Occupation?: string | null;
  CRM_Education?: string | null;
  CRM_Tobacco_User?: string | null;
  CRM_NonResident_Flag?: string | null;
  CRM_Existing_Plan_Flag?: string | null;
}

/* ── Leads ───────────────────────────────────────────────────────────────── */

export interface Lead {
  id: number;
  customer_id: number;
  campaign_id: number | null;
  CRM_Channel: string | null;
  CRM_Data_Medium: string | null;
  /** Raw CRM lead status; the lifecycle stage lives in `current_stage`. */
  Label_Source_Lead_Status: string;
  current_stage: string;
  current_section: string | null;
  current_handler: string | null;
  priority: string;
  lead_score: number | null;
  recommended_action: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface LeadCreate {
  customer_id: number;
  campaign_id?: number | null;
  CRM_Channel?: string | null;
  CRM_Data_Medium?: string | null;
  Label_Source_Lead_Status?: string;
  current_stage?: string;
  current_section?: string | null;
  current_handler?: string | null;
  priority?: string;
  lead_score?: number | null;
  recommended_action?: string | null;
  excel_fields?: Record<string, unknown> | null;
}

/** PATCH /leads/{id} accepts snake_case names only — it declares no aliases. */
export interface LeadUpdate {
  customer_id?: number;
  campaign_id?: number | null;
  source_channel?: string | null;
  source_medium?: string | null;
  status?: string;
  current_stage?: string;
  current_section?: string | null;
  current_handler?: string | null;
  priority?: string;
  lead_score?: number | null;
  recommended_action?: string | null;
  excel_fields?: Record<string, unknown> | null;
}

/* ── Campaigns ───────────────────────────────────────────────────────────── */

export interface Campaign {
  id: number;
  code: string;
  CRM_UTM_Campaign: string;
  CRM_UTM_Source: string | null;
  status: string;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface CampaignCreate {
  code: string;
  CRM_UTM_Campaign: string;
  CRM_UTM_Source?: string | null;
  status?: string;
  start_date?: IsoDate | null;
  end_date?: IsoDate | null;
}

/** PATCH /campaigns/{id} takes snake_case field names. */
export interface CampaignUpdate {
  code?: string;
  name?: string;
  channel?: string | null;
  status?: string;
  start_date?: IsoDate | null;
  end_date?: IsoDate | null;
}

export interface CampaignPerformance {
  campaign_id: number;
  total_events: number;
  by_channel: Record<string, number>;
  by_metric: Record<string, number>;
}

/* ── Products ────────────────────────────────────────────────────────────── */

export interface Product {
  id: number;
  CRM_Product_Code: string;
  CRM_Product_Name: string;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface ProductCreate {
  CRM_Product_Code: string;
  CRM_Product_Name: string;
}

/** PATCH /products/{id} takes snake_case field names. */
export interface ProductUpdate {
  code?: string;
  name?: string;
}

/* ── Calls ───────────────────────────────────────────────────────────────── */

export interface Call {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  CDR_Call_Direction: string;
  CDR_Top_Call_Status: string;
  phone_number: string | null;
  notes: string | null;
  scheduled_at: IsoDateTime | null;
  started_at: IsoDateTime | null;
  ended_at: IsoDateTime | null;
  /** Call duration in seconds, aliased to the CDR column name. */
  CDR_Avg_Talk_Sec: number | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface CallCreate {
  lead_id?: number | null;
  customer_id?: number | null;
  CDR_Call_Direction?: string;
  CDR_Top_Call_Status?: string;
  phone_number?: string | null;
  notes?: string | null;
  scheduled_at?: IsoDateTime | null;
}

/** PATCH /calls/{id} takes snake_case `direction` / `status`. */
export interface CallUpdate {
  lead_id?: number | null;
  customer_id?: number | null;
  direction?: string;
  status?: string;
  phone_number?: string | null;
  notes?: string | null;
  scheduled_at?: IsoDateTime | null;
}

/* ── Tasks & Follow-ups ──────────────────────────────────────────────────── */

export interface Task {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  /** Task title, aliased to the disposition column it was derived from. */
  Label_Source_Disposition: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface TaskCreate {
  lead_id?: number | null;
  customer_id?: number | null;
  Label_Source_Disposition: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_at?: IsoDateTime | null;
}

/** PATCH /tasks/{id} takes snake_case `title`. */
export interface TaskUpdate {
  lead_id?: number | null;
  customer_id?: number | null;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_at?: IsoDateTime | null;
}

export interface Followup {
  id: number;
  task_id: number | null;
  lead_id: number | null;
  customer_id: number | null;
  channel: string;
  /** Follow-up notes, aliased to the label-basis column. */
  Label_Basis: string | null;
  status: string;
  scheduled_at: IsoDateTime | null;
  completed_at: IsoDateTime | null;
  created_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface FollowupCreate {
  task_id?: number | null;
  lead_id?: number | null;
  customer_id?: number | null;
  channel?: string;
  Label_Basis?: string | null;
  status?: string;
  scheduled_at?: IsoDateTime | null;
}

/** PATCH /followups/{id} takes snake_case `notes`. */
export interface FollowupUpdate {
  task_id?: number | null;
  lead_id?: number | null;
  customer_id?: number | null;
  channel?: string;
  notes?: string | null;
  status?: string;
  scheduled_at?: IsoDateTime | null;
  completed_at?: IsoDateTime | null;
}

/* ── Engagement & Journey ────────────────────────────────────────────────── */

export interface EngagementEvent {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  campaign_id: number | null;
  CRM_Channel: string;
  metric_type: string;
  /** Metric value, aliased to the messaging-engagement column. */
  MSG_Engaged: number;
  event_payload: Record<string, unknown> | null;
  event_time: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface WebsiteEvent {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  event_name: string;
  WEB_Step_Name: string | null;
  WEB_Step_Number: number | null;
  WEB_Device_Type: string | null;
  WEB_New_Vs_Repeat: boolean;
  event_payload: Record<string, unknown> | null;
  event_time: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface JourneySummary {
  lead_id: number;
  total_events: number;
  unique_event_names: string[];
  last_event_time: IsoDateTime | null;
}

/* ── AI ──────────────────────────────────────────────────────────────────── */

/** Every /ai/* scoring route accepts this body; at least one id is required. */
export interface AIPredictionRequest {
  lead_id?: number | null;
  customer_id?: number | null;
  context?: Record<string, unknown> | null;
}

export interface AIPrediction {
  prediction_type: string;
  model_name: string;
  score: number;
  label: string;
  rationale: string;
  details: Record<string, unknown> | null;
}

export interface AIPredictionLog extends AIPrediction {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  rationale: string;
  created_at: IsoDateTime;
}

export interface AILeadAnalysis {
  lead_id: number | null;
  customer_id: number | null;
  generated_at: IsoDateTime;
  predictions: AIPrediction[];
}

/* ── Decision engine ─────────────────────────────────────────────────────── */

export interface DecisionRequest {
  lead_id?: number | null;
  customer_id?: number | null;
}

export interface Decision {
  decision_type: string;
  recommended_action: string;
  priority: string;
  confidence: number;
  rationale: string;
  inputs: Record<string, unknown> | null;
}

export interface DecisionLog extends Decision {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  created_at: IsoDateTime;
}

/* ── Analytics ───────────────────────────────────────────────────────────── */

/** Shared by GET /dashboard and GET /analytics/overview. */
export interface AnalyticsOverview {
  total_customers: number;
  total_leads: number;
  total_campaigns: number;
  total_calls: number;
  open_tasks: number;
  pending_followups: number;
  converted_leads: number;
  conversion_rate: number;
}

export interface AnalyticsFunnel {
  new_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
  total_leads: number;
  conversion_rate: number;
}

export interface ChannelAnalyticsItem {
  channel: string;
  lead_count: number;
  engagement_events: number;
}

/** One of the few genuinely enveloped responses. */
export interface AnalyticsChannels {
  items: ChannelAnalyticsItem[];
}

/* ── Reports ─────────────────────────────────────────────────────────────── */

export interface CampaignReportItem {
  campaign_id: number;
  campaign_code: string;
  campaign_name: string;
  lead_count: number;
  converted_leads: number;
  conversion_rate: number;
}

/** Enveloped, unlike the list routes. */
export interface CampaignPerformanceReport {
  items: CampaignReportItem[];
}

export interface WorkloadReport {
  total_tasks: number;
  open_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_followups: number;
  pending_followups: number;
  completed_followups: number;
}

export interface PipelineReport {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
}

/* ── Data management ─────────────────────────────────────────────────────── */

export interface ImportJob {
  id: number;
  dataset_name: string;
  source_path: string;
  status: string;
  row_count: number;
  valid_row_count: number;
  invalid_row_count: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
  created_at: IsoDateTime;
  completed_at: IsoDateTime | null;
}

export interface ImportJobRequest {
  source_path: string;
  dataset_name?: string | null;
  file_format?: string | null;
}

export interface DataQuality {
  generated_at: IsoDateTime;
  table_counts: Record<string, number>;
  completeness: Record<string, number>;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: string;
  count: number;
}

export interface DataValidation {
  generated_at: IsoDateTime;
  total_issues: number;
  issues: ValidationIssue[];
}

export interface ExportRequest {
  resource: string;
  file_format?: string;
}

export interface ExportResult {
  job_id: number;
  resource: string;
  file_format: string;
  /** Server-side path. The backend exposes no download route for it. */
  file_path: string;
  row_count: number;
  status: string;
}

/* ── ML ──────────────────────────────────────────────────────────────────── */

export interface MLTrainRequest {
  model_name?: string;
}

export interface MLTrainingJob {
  id: number;
  model_name: string;
  status: string;
  training_rows: number;
  metrics: Record<string, unknown> | null;
  artifact_path: string | null;
  error_message: string | null;
  created_at: IsoDateTime;
  completed_at: IsoDateTime | null;
}

export interface MLModelSummary {
  model_name: string;
  latest_job_id: number;
  status: string;
  training_rows: number;
  created_at: IsoDateTime;
}

/* ── Lead lifecycle ──────────────────────────────────────────────────────── */

/** Body for both POST /leads/{id}/assign and POST /leads/{id}/transfer. */
export interface LeadAssignmentRequest {
  to_section: string;
  to_handler?: string | null;
  reason?: string | null;
  trigger?: string | null;
  related_decision_id?: number | null;
  details?: Record<string, unknown> | null;
}

export interface LeadAssignment {
  id: number;
  lead_id: number;
  customer_id: number | null;
  assignment_type: string;
  from_section: string | null;
  to_section: string | null;
  from_handler: string | null;
  to_handler: string | null;
  reason: string | null;
  trigger: string | null;
  related_decision_id: number | null;
  is_current: boolean;
  details: Record<string, unknown> | null;
  created_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface LeadOutcomeCreate {
  action_type?: string;
  outcome_code: string;
  outcome_label?: string | null;
  notes?: string | null;
  followup_required?: boolean;
  next_action_hint?: string | null;
  details?: Record<string, unknown> | null;
}

export interface LeadOutcome {
  id: number;
  lead_id: number;
  customer_id: number | null;
  action_type: string;
  outcome_code: string;
  outcome_label: string | null;
  notes: string | null;
  followup_required: boolean;
  next_action_hint: string | null;
  details: Record<string, unknown> | null;
  created_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

export interface LeadTimelineEvent {
  id: number;
  lead_id: number;
  customer_id: number | null;
  event_type: string;
  event_source: string;
  details: Record<string, unknown> | null;
  created_at: IsoDateTime;
  Excel_Fields: ExcelFields;
}

/** Engagement roll-up embedded in the unified lead details payload. */
export interface LeadEngagementSummary {
  total_events: number;
  total_metric_value: number;
  by_channel: Record<string, { events: number; metric_sum: number }>;
}

/** AI roll-up embedded in the unified lead details payload. */
export interface LeadAISummary {
  latest: Record<string, AIPredictionLog>;
  recent: AIPredictionLog[];
  recent_decisions: DecisionLog[];
}

/** GET /leads/{id}/details — one payload for the whole lead workspace. */
export interface LeadDetails {
  lead: Lead;
  customer: Customer | null;
  campaign: Campaign | null;
  assignment: LeadAssignment | null;
  engagement: LeadEngagementSummary;
  journey: WebsiteEvent[];
  ai: LeadAISummary;
  calls: Call[];
  tasks: Task[];
  followups: Followup[];
  outcomes: LeadOutcome[];
  timeline: LeadTimelineEvent[];
}

/* ── Shared query shapes ─────────────────────────────────────────────────── */

export interface Pagination {
  skip?: number;
  /** Backend caps this at 500. */
  limit?: number;
}
