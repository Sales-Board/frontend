import "server-only";
import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type * as S from "./schema";

/**
 * One function per backend operation, grouped by the tag it carries in the
 * OpenAPI document. 62 paths / 82 operations, matching `backend/app/api/routes`.
 *
 * Reads of live operational data are uncached. Only slow-moving reference data
 * (products, campaigns) sets `revalidate`, tagged so a write can invalidate it.
 *
 * Note on request bodies: response models serialize under Excel aliases, but the
 * `*Update` models declare no aliases — PATCH bodies use snake_case. The
 * `*Update` types in `schema.ts` encode that asymmetry.
 */

/** Cache tags for reference data, so mutations can invalidate the matching reads. */
export const CACHE_TAGS = {
  products: "products",
  campaigns: "campaigns",
} as const;

/* ── Health ──────────────────────────────────────────────────────────────── */

/**
 * GET /api/health — liveness plus database reachability.
 * The backend also mounts this router at the root as `GET /health`; both return
 * the same payload, so the app only uses the prefixed one.
 */
export const getHealth = () => apiGet<S.Health>("/health");

/* ── Dashboard & Analytics ───────────────────────────────────────────────── */

/** GET /api/dashboard — headline counts (same payload as analytics/overview). */
export const getDashboard = () => apiGet<S.AnalyticsOverview>("/dashboard");

/** GET /api/analytics/overview — totals across every module. */
export const getAnalyticsOverview = () =>
  apiGet<S.AnalyticsOverview>("/analytics/overview");

/** GET /api/analytics/funnel — lead counts by funnel position. */
export const getAnalyticsFunnel = () =>
  apiGet<S.AnalyticsFunnel>("/analytics/funnel");

/** GET /api/analytics/channels — leads and engagement events per channel. */
export const getAnalyticsChannels = () =>
  apiGet<S.AnalyticsChannels>("/analytics/channels");

/* ── Customers ───────────────────────────────────────────────────────────── */

/** GET /api/customers — paginated customer list. */
export const listCustomers = (query: S.Pagination = {}) =>
  apiGet<S.Customer[]>("/customers", { query: { ...query } });

/** POST /api/customers — create a customer. */
export const createCustomer = (body: S.CustomerWrite & { Customer_ID: string }) =>
  apiPost<S.Customer>("/customers", { body });

/** GET /api/customers/{customer_id} — single customer. */
export const getCustomer = (customerId: number) =>
  apiGet<S.Customer>(`/customers/${customerId}`);

/** PATCH /api/customers/{customer_id} — partial update. */
export const updateCustomer = (customerId: number, body: S.CustomerWrite) =>
  apiPatch<S.Customer>(`/customers/${customerId}`, { body });

/** DELETE /api/customers/{customer_id} — returns 204. */
export const deleteCustomer = (customerId: number) =>
  apiDelete(`/customers/${customerId}`);

/* ── Leads ───────────────────────────────────────────────────────────────── */

/** GET /api/leads — paginated, optionally filtered by customer or campaign. */
export const listLeads = (
  query: S.Pagination & { customer_id?: number; campaign_id?: number } = {},
) => apiGet<S.Lead[]>("/leads", { query: { ...query } });

/** POST /api/leads — create a lead (also writes a lead_created timeline event). */
export const createLead = (body: S.LeadCreate) =>
  apiPost<S.Lead>("/leads", { body });

/** GET /api/leads/{lead_id} — single lead. */
export const getLead = (leadId: number) => apiGet<S.Lead>(`/leads/${leadId}`);

/** PATCH /api/leads/{lead_id} — partial update; body is snake_case. */
export const updateLead = (leadId: number, body: S.LeadUpdate) =>
  apiPatch<S.Lead>(`/leads/${leadId}`, { body });

/** DELETE /api/leads/{lead_id} — returns 204. */
export const deleteLead = (leadId: number) => apiDelete(`/leads/${leadId}`);

/** GET /api/leads/{lead_id}/details — unified payload for the lead workspace. */
export const getLeadDetails = (leadId: number) =>
  apiGet<S.LeadDetails>(`/leads/${leadId}/details`);

/** GET /api/leads/{lead_id}/timeline — lifecycle events, newest first. */
export const getLeadTimeline = (leadId: number) =>
  apiGet<S.LeadTimelineEvent[]>(`/leads/${leadId}/timeline`);

/** GET /api/leads/{lead_id}/journey — website events for this lead. */
export const getLeadJourney = (leadId: number, query: S.Pagination = {}) =>
  apiGet<S.WebsiteEvent[]>(`/leads/${leadId}/journey`, { query: { ...query } });

/** GET /api/leads/{lead_id}/calls — calls placed against this lead. */
export const getLeadCalls = (leadId: number, query: S.Pagination = {}) =>
  apiGet<S.Call[]>(`/leads/${leadId}/calls`, { query: { ...query } });

/** POST /api/leads/{lead_id}/assign — set owner/section, supersede prior assignment. */
export const assignLead = (leadId: number, body: S.LeadAssignmentRequest) =>
  apiPost<S.LeadAssignment>(`/leads/${leadId}/assign`, { body });

/** POST /api/leads/{lead_id}/transfer — same contract as assign, logged as a transfer. */
export const transferLead = (leadId: number, body: S.LeadAssignmentRequest) =>
  apiPost<S.LeadAssignment>(`/leads/${leadId}/transfer`, { body });

/** GET /api/leads/{lead_id}/outcomes — recorded action outcomes. */
export const listLeadOutcomes = (leadId: number) =>
  apiGet<S.LeadOutcome[]>(`/leads/${leadId}/outcomes`);

/**
 * POST /api/leads/{lead_id}/outcomes — record an outcome.
 * Side effects: may move lead stage/status and auto-create a follow-up when
 * `followup_required` is set, then append timeline events.
 */
export const recordLeadOutcome = (leadId: number, body: S.LeadOutcomeCreate) =>
  apiPost<S.LeadOutcome>(`/leads/${leadId}/outcomes`, { body });

/* ── Campaigns ───────────────────────────────────────────────────────────── */

/** GET /api/campaigns — paginated campaign list. */
export const listCampaigns = (query: S.Pagination = {}) =>
  apiGet<S.Campaign[]>("/campaigns", {
    query: { ...query },
    revalidate: 60,
    tags: [CACHE_TAGS.campaigns],
  });

/** POST /api/campaigns — create a campaign. */
export const createCampaign = (body: S.CampaignCreate) =>
  apiPost<S.Campaign>("/campaigns", { body });

/** GET /api/campaigns/{campaign_id} — single campaign. */
export const getCampaign = (campaignId: number) =>
  apiGet<S.Campaign>(`/campaigns/${campaignId}`);

/** PATCH /api/campaigns/{campaign_id} — partial update; body is snake_case. */
export const updateCampaign = (campaignId: number, body: S.CampaignUpdate) =>
  apiPatch<S.Campaign>(`/campaigns/${campaignId}`, { body });

/** DELETE /api/campaigns/{campaign_id} — returns 204. */
export const deleteCampaign = (campaignId: number) =>
  apiDelete(`/campaigns/${campaignId}`);

/** GET /api/campaigns/{campaign_id}/leads — leads attributed to this campaign. */
export const listCampaignLeads = (campaignId: number, query: S.Pagination = {}) =>
  apiGet<S.Lead[]>(`/campaigns/${campaignId}/leads`, { query: { ...query } });

/** GET /api/campaigns/{campaign_id}/performance — event counts by channel and metric. */
export const getCampaignPerformance = (campaignId: number) =>
  apiGet<S.CampaignPerformance>(`/campaigns/${campaignId}/performance`);

/* ── Products ────────────────────────────────────────────────────────────── */

/** GET /api/products — paginated product catalogue. */
export const listProducts = (query: S.Pagination = {}) =>
  apiGet<S.Product[]>("/products", {
    query: { ...query },
    revalidate: 60,
    tags: [CACHE_TAGS.products],
  });

/** POST /api/products — create a product. */
export const createProduct = (body: S.ProductCreate) =>
  apiPost<S.Product>("/products", { body });

/** GET /api/products/{product_id} — single product. */
export const getProduct = (productId: number) =>
  apiGet<S.Product>(`/products/${productId}`);

/** PATCH /api/products/{product_id} — partial update; body is snake_case. */
export const updateProduct = (productId: number, body: S.ProductUpdate) =>
  apiPatch<S.Product>(`/products/${productId}`, { body });

/** DELETE /api/products/{product_id} — returns 204. */
export const deleteProduct = (productId: number) =>
  apiDelete(`/products/${productId}`);

/* ── Calls ───────────────────────────────────────────────────────────────── */

/** GET /api/calls — paginated, optionally filtered by lead, customer or status. */
export const listCalls = (
  query: S.Pagination & {
    lead_id?: number;
    customer_id?: number;
    status_filter?: string;
  } = {},
) => apiGet<S.Call[]>("/calls", { query: { ...query } });

/** POST /api/calls — schedule a call. */
export const createCall = (body: S.CallCreate) =>
  apiPost<S.Call>("/calls", { body });

/** GET /api/calls/{call_id} — single call. */
export const getCall = (callId: number) => apiGet<S.Call>(`/calls/${callId}`);

/** PATCH /api/calls/{call_id} — partial update; body is snake_case. */
export const updateCall = (callId: number, body: S.CallUpdate) =>
  apiPatch<S.Call>(`/calls/${callId}`, { body });

/** DELETE /api/calls/{call_id} — returns 204. */
export const deleteCall = (callId: number) => apiDelete(`/calls/${callId}`);

/** POST /api/calls/{call_id}/start — mark a call started. */
export const startCall = (callId: number, body: { started_at?: string | null } = {}) =>
  apiPost<S.Call>(`/calls/${callId}/start`, { body });

/** POST /api/calls/{call_id}/end — mark a call ended; derives duration. */
export const endCall = (
  callId: number,
  body: { ended_at?: string | null; notes?: string | null } = {},
) => apiPost<S.Call>(`/calls/${callId}/end`, { body });

/* ── Tasks ───────────────────────────────────────────────────────────────── */

/** GET /api/tasks — paginated, optionally filtered by lead, customer or status. */
export const listTasks = (
  query: S.Pagination & {
    lead_id?: number;
    customer_id?: number;
    status_filter?: string;
  } = {},
) => apiGet<S.Task[]>("/tasks", { query: { ...query } });

/** POST /api/tasks — create a task. */
export const createTask = (body: S.TaskCreate) =>
  apiPost<S.Task>("/tasks", { body });

/** GET /api/tasks/{task_id} — single task. */
export const getTask = (taskId: number) => apiGet<S.Task>(`/tasks/${taskId}`);

/** PATCH /api/tasks/{task_id} — partial update; body is snake_case. */
export const updateTask = (taskId: number, body: S.TaskUpdate) =>
  apiPatch<S.Task>(`/tasks/${taskId}`, { body });

/** DELETE /api/tasks/{task_id} — returns 204. */
export const deleteTask = (taskId: number) => apiDelete(`/tasks/${taskId}`);

/* ── Follow-ups ──────────────────────────────────────────────────────────── */

/** GET /api/followups — paginated, optionally filtered by task, lead or customer. */
export const listFollowups = (
  query: S.Pagination & {
    task_id?: number;
    lead_id?: number;
    customer_id?: number;
  } = {},
) => apiGet<S.Followup[]>("/followups", { query: { ...query } });

/** POST /api/followups — schedule a follow-up. */
export const createFollowup = (body: S.FollowupCreate) =>
  apiPost<S.Followup>("/followups", { body });

/** PATCH /api/followups/{followup_id} — partial update; body is snake_case. */
export const updateFollowup = (followupId: number, body: S.FollowupUpdate) =>
  apiPatch<S.Followup>(`/followups/${followupId}`, { body });

/* ── Engagement channels ─────────────────────────────────────────────────── */

type EngagementQuery = S.Pagination & {
  lead_id?: number;
  customer_id?: number;
  campaign_id?: number;
};

/** GET /api/engagement/whatsapp — WhatsApp message events. */
export const listWhatsappEvents = (query: EngagementQuery = {}) =>
  apiGet<S.EngagementEvent[]>("/engagement/whatsapp", { query: { ...query } });

/** GET /api/engagement/rcs — RCS message events. */
export const listRcsEvents = (query: EngagementQuery = {}) =>
  apiGet<S.EngagementEvent[]>("/engagement/rcs", { query: { ...query } });

/** GET /api/engagement/email — email engagement events. */
export const listEmailEvents = (query: EngagementQuery = {}) =>
  apiGet<S.EngagementEvent[]>("/engagement/email", { query: { ...query } });

/** GET /api/engagement/website — website engagement events (channel-scoped). */
export const listWebsiteEngagementEvents = (query: EngagementQuery = {}) =>
  apiGet<S.EngagementEvent[]>("/engagement/website", { query: { ...query } });

/* ── Website journey ─────────────────────────────────────────────────────── */

/**
 * GET /api/journey/website — website events across leads.
 * Distinct from /engagement/website: this returns WEB_* funnel-step records,
 * not channel engagement metrics.
 */
export const listJourneyEvents = (
  query: S.Pagination & {
    lead_id?: number;
    customer_id?: number;
    device_type?: string;
  } = {},
) => apiGet<S.WebsiteEvent[]>("/journey/website", { query: { ...query } });

/** GET /api/journey/leads/{lead_id} — event totals and last-seen for one lead. */
export const getJourneySummary = (leadId: number) =>
  apiGet<S.JourneySummary>(`/journey/leads/${leadId}`);

/* ── AI predictions ──────────────────────────────────────────────────────── */

/** POST /api/ai/validity — predict LABEL_Customer_Validity. */
export const predictValidity = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/validity", { body });

/** POST /api/ai/intent — predict purchase intent. */
export const predictIntent = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/intent", { body });

/** POST /api/ai/conversion — predict conversion likelihood. */
export const predictConversion = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/conversion", { body });

/** POST /api/ai/product-recommendation — recommend a product for the lead. */
export const predictProduct = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/product-recommendation", { body });

/** POST /api/ai/lead-score — derive the composite lead score. */
export const predictLeadScore = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/lead-score", { body });

/** POST /api/ai/segment — assign the lead to a behavioural segment. */
export const predictSegment = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/segment", { body });

/** POST /api/ai/next-best-action — recommend the next action. */
export const predictNextBestAction = (body: S.AIPredictionRequest) =>
  apiPost<S.AIPrediction>("/ai/next-best-action", { body });

/** POST /api/ai/analyze-lead — run every prediction type in one call and log each. */
export const analyzeLead = (body: S.AIPredictionRequest) =>
  apiPost<S.AILeadAnalysis>("/ai/analyze-lead", { body });

/** GET /api/ai/leads/{lead_id} — stored prediction log for a lead. */
export const getLeadPredictions = (leadId: number) =>
  apiGet<S.AIPredictionLog[]>(`/ai/leads/${leadId}`);

/** GET /api/ai/customers/{customer_id} — stored prediction log for a customer. */
export const getCustomerPredictions = (customerId: number) =>
  apiGet<S.AIPredictionLog[]>(`/ai/customers/${customerId}`);

/* ── Decision engine ─────────────────────────────────────────────────────── */

/** POST /api/decision/next-action — combine predictions and rules into an action. */
export const decideNextAction = (body: S.DecisionRequest) =>
  apiPost<S.Decision>("/decision/next-action", { body });

/** GET /api/decision/leads/{lead_id} — stored decision log for a lead. */
export const getLeadDecisions = (leadId: number) =>
  apiGet<S.DecisionLog[]>(`/decision/leads/${leadId}`);

/** GET /api/decision/customers/{customer_id} — stored decision log for a customer. */
export const getCustomerDecisions = (customerId: number) =>
  apiGet<S.DecisionLog[]>(`/decision/customers/${customerId}`);

/* ── Reports ─────────────────────────────────────────────────────────────── */

/** GET /api/reports/pipeline — lead counts by pipeline position. */
export const getPipelineReport = () =>
  apiGet<S.PipelineReport>("/reports/pipeline");

/** GET /api/reports/workload — task and follow-up load by status. */
export const getWorkloadReport = () =>
  apiGet<S.WorkloadReport>("/reports/workload");

/** GET /api/reports/campaign-performance — per-campaign conversion (enveloped). */
export const getCampaignPerformanceReport = () =>
  apiGet<S.CampaignPerformanceReport>("/reports/campaign-performance");

/* ── Data management ─────────────────────────────────────────────────────── */

/** GET /api/data/quality — row counts and per-table completeness. */
export const getDataQuality = () => apiGet<S.DataQuality>("/data/quality");

/** GET /api/data/validation — active data-integrity issues. */
export const getDataValidation = () =>
  apiGet<S.DataValidation>("/data/validation");

/** GET /api/data/history — past import jobs. */
export const getDataHistory = (query: S.Pagination = {}) =>
  apiGet<S.ImportJob[]>("/data/history", { query: { ...query } });

/** POST /api/data/import — start an import from a server-side path. */
export const importData = (body: S.ImportJobRequest) =>
  apiPost<S.ImportJob>("/data/import", { body });

/** GET /api/data/import/{job_id} — status of one import job. */
export const getImportJob = (jobId: number) =>
  apiGet<S.ImportJob>(`/data/import/${jobId}`);

/**
 * POST /api/data/export — write a resource to a file on the server.
 * Returns a server-side `file_path`; the backend exposes no download route, so
 * the UI reports the path rather than offering a download.
 */
export const exportData = (body: S.ExportRequest) =>
  apiPost<S.ExportResult>("/data/export", { body });

/* ── ML ──────────────────────────────────────────────────────────────────── */

/** GET /api/ml/models — trained model catalogue. */
export const listModels = (query: S.Pagination = {}) =>
  apiGet<S.MLModelSummary[]>("/ml/models", { query: { ...query } });

/** POST /api/ml/train — kick off a training run. */
export const trainModel = (body: S.MLTrainRequest = {}) =>
  apiPost<S.MLTrainingJob>("/ml/train", { body });

/** GET /api/ml/train/{job_id} — status and metrics for one training job. */
export const getTrainingJob = (jobId: number) =>
  apiGet<S.MLTrainingJob>(`/ml/train/${jobId}`);
