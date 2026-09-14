import React from "react";
import { getLeadsView } from "@/dal/leads";
import { LeadAnalyzer } from "@/components/lead-analyzer";
import { EmptyState, IssueBanner } from "@/components/states";

/**
 * AI Copilot — runs the prediction and decision endpoints against a chosen lead.
 *
 * This is not a chat assistant. The backend's AI surface is a set of scoring
 * routes (validity, intent, conversion, product fit, lead score, segment, next
 * best action) plus a rules-and-predictions decision engine; there is no
 * natural-language endpoint to talk to.
 */
export default async function AICopilotPage() {
  const data = await getLeadsView({ limit: 200 });

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Intelligence
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            AI Copilot
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Score a lead across every prediction type, then ask the decision
            engine for the next action.
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      {data.leads.length === 0 ? (
        <EmptyState
          title="No leads to analyze"
          hint="Run the backend's sample-data preload, then return here to score a lead."
        />
      ) : (
        <LeadAnalyzer leads={data.leads} />
      )}
    </div>
  );
}
