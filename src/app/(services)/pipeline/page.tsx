"use client";

import React, { useState, useEffect } from "react";
import { getDeals } from "@/dal/sales-dal";
import { BFSIDeal, DealStatus } from "@/dal/types";
import { Plus } from "lucide-react";

export default function PipelinePage() {
  const [deals, setDeals] = useState<BFSIDeal[]>([]);

  useEffect(() => {
    getDeals().then(setDeals);
  }, []);

  const stages: { status: DealStatus; label: string }[] = [
    { status: "Proposal", label: "Proposal Sent" },
    { status: "KYC Pending", label: "KYC & AML" },
    { status: "Underwriting", label: "Underwriting" },
    { status: "Negotiation", label: "Negotiation" },
    { status: "Closed Won", label: "Closed Won" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Funnel
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Pipeline Visualizer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            5-stage underwriting and policy closing workflow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.status === stage.status);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.rawPremium, 0);

          return (
            <div
              key={stage.status}
              className="bg-slate-100/60 border border-slate-200 rounded-xl p-3 flex flex-col justify-between min-w-[220px]"
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-900 block">
                      {stage.label}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      ₹{(stageTotal / 100000).toFixed(1)}L ({stageDeals.length})
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-blue-600 shadow-2xs">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3 space-y-1.5 transition-all shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-600 font-medium">{deal.dealNumber}</span>
                        <span className="text-slate-900 font-bold tabular-nums">{deal.premiumValue}</span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {deal.clientName}
                      </h4>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>RM: {deal.assignedOfficer.name.split(" ")[0]}</span>
                        <span className="text-emerald-700 font-semibold tabular-nums">{deal.closingProbability}%</span>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No deals
                    </div>
                  )}
                </div>
              </div>

              <button className="mt-3 w-full py-1.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer">
                <Plus className="h-3 w-3" /> Add Deal
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
