"use client";

import React, { useState, useTransition } from "react";
import { Sparkles, Zap, AlertCircle } from "lucide-react";
import type { DecisionCard, PredictionCard } from "@/dal/types";
import { analyzeLeadAction, decideNextActionAction } from "@/dal/actions";
import { formatPercent, formatRelative, humanize } from "@/lib/format";
import { EmptyState } from "./states";

interface PredictionPanelProps {
  leadId: number;
  initialPredictions: PredictionCard[];
  initialDecisions: DecisionCard[];
}

/**
 * AI predictions and the decision recommendation for one lead.
 *
 * "Run analysis" calls POST /api/ai/analyze-lead, which scores every prediction
 * type and persists each result. "Recommend action" calls
 * POST /api/decision/next-action, which combines those stored predictions with
 * business rules. Both run as Server Actions, so the browser never reaches the
 * backend directly.
 */
export function PredictionPanel({
  leadId,
  initialPredictions,
  initialDecisions,
}: PredictionPanelProps) {
  const [predictions, setPredictions] = useState(initialPredictions);
  const [decisions, setDecisions] = useState(initialDecisions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runAnalysis = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeLeadAction(leadId);
      if (result.ok) setPredictions(result.data);
      else setError(result.error);
    });
  };

  const runDecision = () => {
    setError(null);
    startTransition(async () => {
      const result = await decideNextActionAction(leadId);
      if (result.ok) setDecisions([result.data, ...decisions]);
      else setError(result.error);
    });
  };

  const latestDecision = decisions[0] ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            Machine Learning Signals
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Predictions & next best action
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAnalysis}
            disabled={pending}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {pending ? "Running…" : "Run analysis"}
          </button>
          <button
            onClick={runDecision}
            disabled={pending}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Recommend action
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {latestDecision ? (
        <div className="mt-4 space-y-1.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Recommended · {humanize(latestDecision.priority)} priority
            </span>
            <span className="text-[11px] font-medium tabular-nums text-blue-700">
              {formatPercent(latestDecision.confidencePct, 0)} confidence
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {humanize(latestDecision.recommendedAction)}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            {latestDecision.rationale}
          </p>
        </div>
      ) : null}

      {predictions.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No predictions stored for this lead"
            hint="Run analysis to score validity, intent, conversion, segment, product fit and next best action."
            icon={Sparkles}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {predictions.map((prediction) => (
            <div
              key={prediction.predictionType}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                    {humanize(prediction.predictionType)}
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-slate-500">
                    {formatPercent(prediction.scorePct, 0)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {humanize(prediction.label)}
                </p>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${prediction.scorePct}%` }}
                  />
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  {prediction.rationale}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[11px] text-slate-400">
                <span className="truncate">{prediction.modelName}</span>
                {prediction.createdAt ? (
                  <span>{formatRelative(prediction.createdAt)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
