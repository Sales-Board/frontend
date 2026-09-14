"use client";

import React from "react";
import { motion } from "motion/react";
import { KPIMetric } from "@/dal/types";

interface StatCardProps {
  metric: KPIMetric;
  index?: number;
}

const TONE_BAR: Record<NonNullable<KPIMetric["tone"]>, string> = {
  neutral: "bg-blue-600",
  positive: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-rose-600",
};

/**
 * A headline figure from the analytics endpoints. There is no period-over-period
 * comparison here: the backend stores no historical snapshots, so a change
 * percentage could not be computed without inventing one.
 */
export function StatCard({ metric, index = 0 }: StatCardProps) {
  const tone = metric.tone ?? "neutral";
  const hasProgress = typeof metric.progressPct === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-xs"
    >
      <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors group-hover:text-blue-600">
        {metric.label}
      </span>

      <div className="mb-3.5 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        {metric.value}
      </div>

      {hasProgress ? (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${TONE_BAR[tone]}`}
            style={{
              width: `${Math.max(0, Math.min(100, metric.progressPct ?? 0))}%`,
            }}
          />
        </div>
      ) : null}

      <span className="text-xs text-slate-500">{metric.caption}</span>
    </motion.div>
  );
}
