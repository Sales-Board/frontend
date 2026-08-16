import React from "react";
import { getDashboardSummary } from "@/dal/sales-dal";
import { StatCard } from "@/components/stat-card";
import { RevenueTrendChart, ProductDistributionChart } from "@/components/dashboard-charts";
import { DealsTable } from "@/components/deals-table";
import { AIInsightsPanel } from "@/components/ai-insights";
import { QuickActions } from "@/components/quick-actions";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const data = await getDashboardSummary();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Overview
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {data.user.branch} • Monitoring live sales velocity and active commercial pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-all cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Operational Notice Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs text-xs">
        <div className="flex items-center justify-between px-2 py-0.5 border-r border-slate-100">
          <span className="text-slate-500 text-[11px] font-medium uppercase">KYC Pending</span>
          <span className="text-amber-700 font-semibold tabular-nums">{data.quickStats.kycPendingApproval} Cases</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 md:border-r border-slate-100">
          <span className="text-slate-500 text-[11px] font-medium uppercase">Underwriting</span>
          <span className="text-blue-700 font-semibold tabular-nums">{data.quickStats.underwritingQueue} Active</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 border-r border-slate-100">
          <span className="text-slate-500 text-[11px] font-medium uppercase">High Intent</span>
          <span className="text-slate-900 font-semibold tabular-nums">+{data.quickStats.highIntentLeadsToday} Today</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5">
          <span className="text-slate-500 text-[11px] font-medium uppercase">Quota Pacing</span>
          <span className="text-emerald-700 font-semibold tabular-nums">{data.quickStats.targetPacingPct}% Goal</span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {data.metrics.map((metric, idx) => (
          <StatCard key={metric.id} metric={metric} index={idx} />
        ))}
      </div>

      {/* Quick Actions Strip */}
      <QuickActions />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={data.monthlyTrends} />
        </div>
        <div className="lg:col-span-1">
          <ProductDistributionChart data={data.productDistribution} />
        </div>
      </div>

      {/* AI Machine Learning Feed */}
      <AIInsightsPanel insights={data.topAIInsights} />

      {/* Recent Deals Table */}
      <DealsTable deals={data.recentDeals} />
    </div>
  );
}
