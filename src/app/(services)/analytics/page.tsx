import React from "react";
import { getProductPerformance, getDashboardSummary } from "@/dal/sales-dal";
import { RevenueTrendChart, ProductDistributionChart } from "@/components/dashboard-charts";
import { MapPin } from "lucide-react";

export default async function AnalyticsPage() {
  const [products, summary] = await Promise.all([
    getProductPerformance(),
    getDashboardSummary(),
  ]);

  const regional = [
    { name: "West (Mumbai & Pune)", rev: "₹2.10 Cr", target: "₹1.90 Cr", pct: 110.5 },
    { name: "North (Delhi NCR & UP)", rev: "₹1.35 Cr", target: "₹1.40 Cr", pct: 96.4 },
    { name: "South (Bengaluru & Chennai)", rev: "₹0.95 Cr", target: "₹0.85 Cr", pct: 111.7 },
    { name: "East (Kolkata & Odisha)", rev: "₹0.42 Cr", target: "₹0.45 Cr", pct: 93.3 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Analytics
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Sales Velocity & Regional Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Territory quota attainment, product share breakdown, and monthly pacing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {regional.map((r, idx) => (
          <div
            key={idx}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" /> {r.name.split(" ")[0]}
                </span>
                <span className="text-xs font-bold text-blue-600 tabular-nums">
                  {r.pct}%
                </span>
              </div>
              <span className="text-xl font-bold text-slate-900 block tabular-nums">
                {r.rev}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Target: {r.target}</span>
              <span className="text-emerald-700 font-semibold">+14.2% YoY</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTrendChart data={summary.monthlyTrends} />
        </div>
        <div className="lg:col-span-1">
          <ProductDistributionChart data={summary.productDistribution} />
        </div>
      </div>
    </div>
  );
}
