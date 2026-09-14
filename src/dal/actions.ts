"use server";

import { revalidatePath, updateTag } from "next/cache";
import { ApiError } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import { CACHE_TAGS } from "@/lib/api/endpoints";
import { toDecisionCard, toPredictionCard } from "@/lib/api/adapters";
import type { DecisionCard, PredictionCard } from "./types";

/**
 * Write paths, exposed to Client Components as Server Actions.
 *
 * Everything here runs on the server, so the browser never talks to the
 * backend directly — the same reason reads go through `lib/api/endpoints`.
 * Each action returns a serializable result rather than throwing, so a form can
 * render the backend's own error text (including 422 field messages).
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

async function run<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message, status: error.status };
    }
    throw error;
  }
}

/** Refreshes every screen that reads lead state. */
function revalidateLead(leadId: number) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/workload");
}

/* ── Lead lifecycle ──────────────────────────────────────────────────────── */

/** POST /api/leads/{id}/assign — route a lead to a section and owner. */
export async function assignLeadAction(
  leadId: number,
  input: { to_section: string; to_handler?: string; reason?: string },
) {
  const result = await run(() =>
    api.assignLead(leadId, { ...input, trigger: "manual" }),
  );
  if (result.ok) revalidateLead(leadId);
  return result;
}

/** POST /api/leads/{id}/transfer — hand a lead to a different section/owner. */
export async function transferLeadAction(
  leadId: number,
  input: { to_section: string; to_handler?: string; reason?: string },
) {
  const result = await run(() =>
    api.transferLead(leadId, { ...input, trigger: "manual" }),
  );
  if (result.ok) revalidateLead(leadId);
  return result;
}

/**
 * POST /api/leads/{id}/outcomes — record what happened after an action.
 * The backend may move the lead's stage/status and create a follow-up, so this
 * revalidates the lead views rather than only the workspace.
 */
export async function recordOutcomeAction(
  leadId: number,
  input: {
    outcome_code: string;
    action_type?: string;
    outcome_label?: string;
    notes?: string;
    followup_required?: boolean;
    next_action_hint?: string;
  },
) {
  const result = await run(() => api.recordLeadOutcome(leadId, input));
  if (result.ok) revalidateLead(leadId);
  return result;
}

/**
 * PATCH /api/leads/{id} — used by the pipeline board to move a card.
 * `status` is the field the funnel and pipeline reports group by.
 */
export async function updateLeadStatusAction(leadId: number, status: string) {
  const result = await run(() => api.updateLead(leadId, { status }));
  if (result.ok) revalidateLead(leadId);
  return result;
}

/** PATCH /api/leads/{id} — set priority from the queue. */
export async function updateLeadPriorityAction(leadId: number, priority: string) {
  const result = await run(() => api.updateLead(leadId, { priority }));
  if (result.ok) revalidateLead(leadId);
  return result;
}

/* ── AI & decisions ──────────────────────────────────────────────────────── */

/**
 * POST /api/ai/analyze-lead — run every prediction type for a lead.
 * Each prediction is persisted server-side, so the workspace is revalidated.
 */
export async function analyzeLeadAction(
  leadId: number,
): Promise<ActionResult<PredictionCard[]>> {
  const result = await run(() => api.analyzeLead({ lead_id: leadId }));
  if (!result.ok) return result;
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, data: result.data.predictions.map(toPredictionCard) };
}

/** POST /api/decision/next-action — combine predictions and rules into an action. */
export async function decideNextActionAction(
  leadId: number,
): Promise<ActionResult<DecisionCard>> {
  const result = await run(() => api.decideNextAction({ lead_id: leadId }));
  if (!result.ok) return result;
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, data: toDecisionCard(result.data) };
}

/** POST /api/ai/{type} — run one prediction type on demand. */
export async function predictAction(
  leadId: number,
  type:
    | "validity"
    | "intent"
    | "conversion"
    | "product-recommendation"
    | "lead-score"
    | "segment"
    | "next-best-action",
): Promise<ActionResult<PredictionCard>> {
  const body = { lead_id: leadId };
  const callers = {
    validity: api.predictValidity,
    intent: api.predictIntent,
    conversion: api.predictConversion,
    "product-recommendation": api.predictProduct,
    "lead-score": api.predictLeadScore,
    segment: api.predictSegment,
    "next-best-action": api.predictNextBestAction,
  } as const;

  const result = await run(() => callers[type](body));
  if (!result.ok) return result;
  revalidatePath(`/leads/${leadId}`);
  return { ok: true, data: toPredictionCard(result.data) };
}

/* ── Operational records ─────────────────────────────────────────────────── */

/** POST /api/tasks — create a task, optionally attached to a lead. */
export async function createTaskAction(input: {
  Label_Source_Disposition: string;
  lead_id?: number;
  customer_id?: number;
  description?: string;
  priority?: string;
  due_at?: string;
}) {
  const result = await run(() => api.createTask(input));
  if (result.ok) {
    revalidatePath("/workload");
    revalidatePath("/dashboard");
    if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  }
  return result;
}

/** PATCH /api/tasks/{id} — move a task through its status. */
export async function updateTaskStatusAction(taskId: number, status: string) {
  const result = await run(() => api.updateTask(taskId, { status }));
  if (result.ok) {
    revalidatePath("/workload");
    revalidatePath("/dashboard");
  }
  return result;
}

/** POST /api/followups — schedule a follow-up. */
export async function createFollowupAction(input: {
  channel?: string;
  lead_id?: number;
  customer_id?: number;
  task_id?: number;
  scheduled_at?: string;
  Label_Basis?: string;
}) {
  const result = await run(() => api.createFollowup(input));
  if (result.ok) {
    revalidatePath("/workload");
    if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  }
  return result;
}

/** PATCH /api/followups/{id} — complete or reschedule a follow-up. */
export async function updateFollowupAction(
  followupId: number,
  input: { status?: string; scheduled_at?: string; notes?: string },
) {
  const result = await run(() => api.updateFollowup(followupId, input));
  if (result.ok) revalidatePath("/workload");
  return result;
}

/** POST /api/calls — schedule a call against a lead. */
export async function createCallAction(input: {
  lead_id?: number;
  customer_id?: number;
  phone_number?: string;
  notes?: string;
  scheduled_at?: string;
}) {
  const result = await run(() => api.createCall(input));
  if (result.ok && input.lead_id) revalidateLead(input.lead_id);
  return result;
}

/** POST /api/calls/{id}/start — mark a call started. */
export async function startCallAction(callId: number, leadId?: number) {
  const result = await run(() => api.startCall(callId));
  if (result.ok && leadId) revalidatePath(`/leads/${leadId}`);
  return result;
}

/** POST /api/calls/{id}/end — mark a call ended; the backend derives duration. */
export async function endCallAction(
  callId: number,
  input: { notes?: string } = {},
  leadId?: number,
) {
  const result = await run(() => api.endCall(callId, input));
  if (result.ok && leadId) revalidatePath(`/leads/${leadId}`);
  return result;
}

/* ── Data & ML ───────────────────────────────────────────────────────────── */

/**
 * POST /api/data/export — write a resource to a file on the server.
 * Returns the server-side path; there is no download route to link to.
 */
export async function exportResourceAction(resource: string, fileFormat = "json") {
  const result = await run(() =>
    api.exportData({ resource, file_format: fileFormat }),
  );
  if (result.ok) revalidatePath("/reports");
  return result;
}

/** POST /api/ml/train — start a training run and return the job. */
export async function trainModelAction(modelName?: string) {
  const result = await run(() =>
    api.trainModel(modelName ? { model_name: modelName } : {}),
  );
  if (result.ok) revalidatePath("/system");
  return result;
}

/** GET /api/ml/train/{job_id} — poll a training job from the client. */
export async function getTrainingJobAction(jobId: number) {
  return run(() => api.getTrainingJob(jobId));
}

/* ── Reference data ──────────────────────────────────────────────────────── */

/** POST /api/products — add a product, then drop the cached catalogue. */
export async function createProductAction(input: {
  CRM_Product_Code: string;
  CRM_Product_Name: string;
}) {
  const result = await run(() => api.createProduct(input));
  if (result.ok) updateTag(CACHE_TAGS.products);
  return result;
}

/** POST /api/campaigns — add a campaign, then drop the cached catalogue. */
export async function createCampaignAction(input: {
  code: string;
  CRM_UTM_Campaign: string;
  CRM_UTM_Source?: string;
}) {
  const result = await run(() => api.createCampaign(input));
  if (result.ok) updateTag(CACHE_TAGS.campaigns);
  return result;
}
