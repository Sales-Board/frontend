"use client";

import React, { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, GitBranch, Target } from "lucide-react";
import {
  assignLeadAction,
  recordOutcomeAction,
  transferLeadAction,
} from "@/dal/actions";

interface Props {
  leadId: number;
  currentSection: string;
  currentHandler: string;
}

/**
 * Lifecycle writes for one lead.
 *
 * Assign  → POST /api/leads/{id}/assign
 * Transfer→ POST /api/leads/{id}/transfer
 * Outcome → POST /api/leads/{id}/outcomes
 *
 * Recording an outcome can move the lead's stage/status and create a follow-up
 * on the backend, so the actions revalidate the lead views rather than patching
 * local state.
 */
export function LeadLifecycleActions({
  leadId,
  currentSection,
  currentHandler,
}: Props) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const routeLead = (mode: "assign" | "transfer") => (formData: FormData) => {
    setResult(null);
    const input = {
      to_section: String(formData.get("to_section") ?? "").trim(),
      to_handler: String(formData.get("to_handler") ?? "").trim() || undefined,
      reason: String(formData.get("reason") ?? "").trim() || undefined,
    };

    startTransition(async () => {
      const response =
        mode === "assign"
          ? await assignLeadAction(leadId, input)
          : await transferLeadAction(leadId, input);

      setResult(
        response.ok
          ? {
              ok: true,
              message: `${mode === "assign" ? "Assigned" : "Transferred"} to ${
                response.data.to_section ?? "—"
              }${response.data.to_handler ? ` (${response.data.to_handler})` : ""}.`,
            }
          : { ok: false, message: response.error },
      );
    });
  };

  const submitOutcome = (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      const response = await recordOutcomeAction(leadId, {
        outcome_code: String(formData.get("outcome_code") ?? "").trim(),
        action_type: String(formData.get("action_type") ?? "call"),
        outcome_label: String(formData.get("outcome_label") ?? "").trim() || undefined,
        notes: String(formData.get("notes") ?? "").trim() || undefined,
        followup_required: formData.get("followup_required") === "on",
      });

      setResult(
        response.ok
          ? {
              ok: true,
              message: `Outcome "${response.data.outcome_code}" recorded${
                response.data.followup_required ? " with a follow-up" : ""
              }.`,
            }
          : { ok: false, message: response.error },
      );
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <GitBranch className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">Lifecycle actions</h3>
        <span className="ml-auto text-[11px] text-slate-400">
          Currently {currentHandler} · {currentSection}
        </span>
      </div>

      {result ? (
        <div
          className={`mb-4 flex items-start gap-2 rounded-lg border p-2.5 text-[11px] ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form action={routeLead("assign")} className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Assign / route
          </p>
          <input
            name="to_section"
            required
            placeholder="Section (required), e.g. tele_sales"
            defaultValue={currentSection}
            className={inputClass}
          />
          <input name="to_handler" placeholder="Handler (optional)" className={inputClass} />
          <input name="reason" placeholder="Reason (optional)" className={inputClass} />
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={primaryButton}>
              {pending ? "Working…" : "Assign"}
            </button>
            <button
              type="submit"
              disabled={pending}
              formAction={routeLead("transfer")}
              className={secondaryButton}
            >
              Transfer
            </button>
          </div>
        </form>

        <form action={submitOutcome} className="space-y-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <Target className="h-3.5 w-3.5 text-amber-500" />
            Record outcome
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="outcome_code"
              required
              placeholder="Code, e.g. interested"
              className={inputClass}
            />
            <select name="action_type" defaultValue="call" className={inputClass}>
              <option value="call">call</option>
              <option value="message">message</option>
              <option value="email">email</option>
              <option value="meeting">meeting</option>
            </select>
          </div>
          <input name="outcome_label" placeholder="Label (optional)" className={inputClass} />
          <input name="notes" placeholder="Notes (optional)" className={inputClass} />
          <label className="flex items-center gap-2 text-[11px] text-slate-600">
            <input type="checkbox" name="followup_required" className="rounded border-slate-300" />
            Create a follow-up automatically
          </label>
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Working…" : "Record outcome"}
          </button>
        </form>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none";

const primaryButton =
  "rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-60";

const secondaryButton =
  "rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-60";
