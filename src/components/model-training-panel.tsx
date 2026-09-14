"use client";

import React, { useState, useTransition } from "react";
import { AlertCircle, Brain, CheckCircle2, RefreshCw } from "lucide-react";
import { getTrainingJobAction, trainModelAction } from "@/dal/actions";
import type { MLTrainingJob } from "@/lib/api/schema";
import { formatNumber } from "@/lib/format";

/**
 * POST /api/ml/train, then GET /api/ml/train/{job_id} to refresh.
 *
 * Training runs synchronously in the backend request, so the returned job is
 * usually already finished. The refresh button re-reads it anyway, for the case
 * where a job is left in a running state.
 */
export function ModelTrainingPanel() {
  const [job, setJob] = useState<MLTrainingJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startTraining = (formData: FormData) => {
    setError(null);
    const modelName = String(formData.get("model_name") ?? "").trim();
    startTransition(async () => {
      const result = await trainModelAction(modelName || undefined);
      if (result.ok) setJob(result.data);
      else setError(result.error);
    });
  };

  const refresh = () => {
    if (!job) return;
    setError(null);
    startTransition(async () => {
      const result = await getTrainingJobAction(job.id);
      if (result.ok) setJob(result.data);
      else setError(result.error);
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Brain className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">Train a model</h3>
      </div>

      <form action={startTraining} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
            Model name
          </span>
          <input
            name="model_name"
            placeholder="lead_conversion_baseline"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Training…" : "Start training"}
        </button>
      </form>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {job ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-slate-900">
              {job.status === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : null}
              Job #{job.id} — {job.status}
            </span>
            <button
              onClick={refresh}
              disabled={pending}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            {job.model_name} · {formatNumber(job.training_rows)} training rows
          </p>

          {job.error_message ? (
            <p className="mt-1.5 text-[11px] text-rose-700">{job.error_message}</p>
          ) : null}

          {job.metrics ? (
            <dl className="mt-2 grid grid-cols-2 gap-1.5 border-t border-slate-200 pt-2 text-[11px] sm:grid-cols-3">
              {Object.entries(job.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="truncate text-slate-500">{key}</dt>
                  <dd className="shrink-0 font-medium tabular-nums text-slate-900">
                    {typeof value === "number" ? value.toFixed(3) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
