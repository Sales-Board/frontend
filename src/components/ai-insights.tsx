"use client";

import React, { useState } from "react";
import { AIInsight } from "@/dal/types";
import { Sparkles, Check, Zap } from "lucide-react";

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const [executed, setExecuted] = useState<Record<string, boolean>>({});

  const handleAction = (id: string) => {
    setExecuted((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 block mb-0.5">
            Machine Learning Signals
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            AI Sales & Cross-Sell Recommendations
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span>3 Live Predictions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
        {insights.map((item) => {
          const isDone = executed[item.id];

          return (
            <div
              key={item.id}
              className="border border-slate-200 bg-slate-50/60 p-4 rounded-lg flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-blue-700 font-semibold uppercase text-[10px] tracking-wider">
                    {item.category}
                  </span>
                  <span className="text-slate-500 text-[11px] font-medium">
                    {item.confidence}% Match
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-emerald-700 font-semibold text-xs block tabular-nums">
                    {item.impactScore}
                  </span>
                </div>

                <button
                  disabled={isDone}
                  onClick={() => handleAction(item.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isDone
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 shadow-2xs"
                  }`}
                >
                  {isDone ? "Executed" : "Execute"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
