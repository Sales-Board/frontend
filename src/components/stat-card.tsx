"use client";

import React from "react";
import { motion } from "motion/react";
import { KPIMetric } from "@/dal/types";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  metric: KPIMetric;
  index?: number;
}

export function StatCard({ metric, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className="group relative border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all duration-200"
    >
      {/* Top Label */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
          {metric.label}
        </span>
        <span className="text-xs font-medium text-slate-400">
          #0{index + 1}
        </span>
      </div>

      {/* Metric Value */}
      <div className="text-3xl font-bold tracking-tight text-slate-900 mb-3.5 tabular-nums">
        {metric.value}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-500 group-hover:bg-blue-500"
          style={{ width: `${metric.progressPct}%` }}
        />
      </div>

      {/* Bottom Subtext & Change Pill */}
      <div className="flex items-center justify-between text-xs">
        <div
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            metric.isPositive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {metric.isPositive ? (
            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
          ) : (
            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
          )}
          {metric.change}
        </div>

        <span className="text-xs text-slate-500 truncate max-w-[150px]">
          {metric.timeframe}
        </span>
      </div>
    </motion.div>
  );
}
