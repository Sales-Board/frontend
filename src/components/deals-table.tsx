"use client";

import React, { useState } from "react";
import { BFSIDeal } from "@/dal/types";
import { Search, ChevronRight } from "lucide-react";

interface DealsTableProps {
  deals: BFSIDeal[];
}

export function DealsTable({ deals: initialDeals }: DealsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDeal, setSelectedDeal] = useState<BFSIDeal | null>(null);

  const statuses = ["ALL", "Closed Won", "Negotiation", "Underwriting", "KYC Pending", "Proposal"];

  const filteredDeals = initialDeals.filter((deal) => {
    const matchesSearch =
      deal.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.dealNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "ALL" || deal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all">
      {/* Header with Search and Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 block mb-0.5">
            Active Accounts
          </span>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent Deals & Policy Subscriptions
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-48 transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-lg">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                  selectedStatus === st
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pr-4">Deal ID / Client</th>
              <th className="pb-3 px-4">Product Line</th>
              <th className="pb-3 px-4">Premium Value</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Win Probability</th>
              <th className="pb-3 px-4">Assigned RM</th>
              <th className="pb-3 pl-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredDeals.map((deal) => (
              <tr
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-blue-600">
                      {deal.dealNumber}
                    </span>
                    <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {deal.clientName}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                  {deal.product}
                </td>

                <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 tabular-nums">
                  {deal.premiumValue}
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      deal.status === "Closed Won"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : deal.status === "Negotiation"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : deal.status === "KYC Pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {deal.status}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${deal.closingProbability}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                      {deal.closingProbability}%
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                  {deal.assignedOfficer.name}
                </td>

                <td className="py-3 pl-4 text-right whitespace-nowrap text-[11px] text-slate-400 tabular-nums">
                  {deal.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deal Preview Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-medium text-blue-600">
                  {selectedDeal.dealNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedDeal.clientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Premium Value
                </span>
                <span className="text-base font-bold text-blue-600 tabular-nums">
                  {selectedDeal.premiumValue}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  AI Lead Score
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {selectedDeal.leadScore} / 100
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Policy Scheme</span>
                <span className="text-slate-900 font-medium">{selectedDeal.policyType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="text-blue-600 font-semibold">{selectedDeal.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned RM</span>
                <span className="text-slate-900 font-medium">
                  {selectedDeal.assignedOfficer.name} ({selectedDeal.assignedOfficer.role})
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  alert(`Underwriting confirmed for ${selectedDeal.dealNumber}`);
                  setSelectedDeal(null);
                }}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Approve Underwriting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
