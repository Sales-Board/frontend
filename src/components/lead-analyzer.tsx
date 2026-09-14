"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Sparkles, Zap } from "lucide-react";
import type { DecisionCard, LeadRow, PredictionCard } from "@/dal/types";
import {
  analyzeLeadAction,
  decideNextActionAction,
  predictAction,
} from "@/dal/actions";
import { formatPercent, humanize } from "@/lib/format";
import { EmptyState } from "./states";

/** One button per /api/ai/* scoring route. */
const PREDICTION_TYPES = [
  "validity",
  "intent",
  "conversion",
  "product-recommendation",
  "lead-score",
  "segment",
  "next-best-action",
] as const;

/**
 * Picks a lead and runs the AI and decision endpoints against it.
 *
 * "Run full analysis" → POST /api/ai/analyze-lead (every type, each persisted)
 * Individual chips    → POST /api/ai/{type}
 * "Next action"       → POST /api/decision/next-action
 */
export function LeadAnalyzer({ leads }: { leads: LeadRow[] }) {
  const [leadId, setLeadId] = useState<number>(leads[0]?.id ?? 0);
  const [predictions, setPredictions] = useState<PredictionCard[]>([]);
  const [decision, setDecision] = useState<DecisionCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = leads.find((lead) => lead.id === leadId);

  const mergePrediction = (card: PredictionCard) =>
    setPredictions((current) => [
      card,
      ...current.filter((item) => item.predictionType !== card.predictionType),
    ]);

  const runFull = () => {
    setError(null);
    startTransition(async () => {
      const result = await analyzeLeadAction(leadId);
      if (result.ok) setPredictions(result.data);
      else setError(result.error);
    });
  };

  const runOne = (type: (typeof PREDICTION_TYPES)[number]) => {
    setError(null);
    startTransition(async () => {
      const result = await predictAction(leadId, type);
      if (result.ok) mergePrediction(result.data);
      else setError(result.error);
    });
  };

  const runDecision = () => {
    setError(null);
    startTransition(async () => {
      const result = await decideNextActionAction(leadId);
      if (result.ok) setDecision(result.data);
      else setError(result.error);
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs">
            <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
              Lead
            </span>
            <select
              value={leadId}
              onChange={(event) => {
                setLeadId(Number(event.target.value));
                setPredictions([]);
                setDecision(null);
                setError(null);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  #{lead.id} — {lead.customerRef} ({humanize(lead.status)})
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={runFull}
            disabled={pending || !leadId}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {pending ? "Working…" : "Run full analysis"}
          </button>

          <button
            onClick={runDecision}
            disabled={pending || !leadId}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Next action
          </button>
        </div>

        {selected ? (
          <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <span>
              {humanize(selected.channel)} · {humanize(selected.stage)} ·{" "}
              {selected.handler} · score{" "}
              {selected.score === null ? "—" : selected.score.toFixed(0)}
            </span>
            <Link
              href={`/leads/${selected.id}`}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
            >
              Open workspace <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {PREDICTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => runOne(type)}
              disabled={pending || !leadId}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
            >
              {humanize(type)}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {decision ? (
        <section className="space-y-1.5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              {humanize(decision.decisionType)} · {humanize(decision.priority)} priority
            </span>
            <span className="text-[11px] font-medium tabular-nums text-blue-700">
              {formatPercent(decision.confidencePct, 0)} confidence
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {humanize(decision.recommendedAction)}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            {decision.rationale}
          </p>
        </section>
      ) : null}

      {predictions.length === 0 ? (
        <EmptyState
          title="No predictions yet"
          hint="Run a full analysis, or score one dimension at a time with the chips above."
          icon={Sparkles}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {predictions.map((prediction) => (
            <article
              key={prediction.predictionType}
              className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs"
            >
              <div className="mb-2 flex items-center justify-between">
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

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${prediction.scorePct}%` }}
                />
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                {prediction.rationale}
              </p>

              <p className="mt-3 truncate border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                {prediction.modelName}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
