import React from "react";
import { getTeam } from "@/dal/sales-dal";

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Personnel
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Sales Officers & Relationship Managers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual RM target achievement, deal closing velocity, and active portfolios.
          </p>
        </div>
      </div>

      <div className="border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Rank / Officer</th>
                <th className="pb-3 px-4">Branch</th>
                <th className="pb-3 px-4">Revenue Closed</th>
                <th className="pb-3 px-4">Quota Attainment</th>
                <th className="pb-3 px-4">Active Leads</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {team.map((rm, idx) => (
                <tr key={rm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-slate-400 w-5">
                        0{idx + 1}
                      </span>
                      <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                        {rm.avatar}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {rm.name}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {rm.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{rm.branch}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                    ₹{rm.revenueClosedCr} Cr
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(rm.targetAchievedPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900 tabular-nums">
                        {rm.targetAchievedPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 tabular-nums">{rm.activeLeads}</td>
                  <td className="py-3 pl-4 text-right">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rm.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
