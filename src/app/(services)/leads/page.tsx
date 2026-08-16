"use client";

import React, { useState, useEffect } from "react";
import { getLeads } from "@/dal/sales-dal";
import { BFSILead } from "@/dal/types";
import { Search, ChevronRight, Sparkles } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<BFSILead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedLead, setSelectedLead] = useState<BFSILead | null>(null);

  useEffect(() => {
    getLeads().then(setLeads);
  }, []);

  const stages = ["ALL", "New", "Contacted", "Qualified", "Proposal Sent", "Converted"];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === "ALL" || lead.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Lead Queue
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Inbound Leads & Triage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AI-scored lead queue automatically synced from all inbound channels.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-56 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-lg">
          {stages.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStage(st)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                selectedStage === st
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Lead ID / Prospect</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">AI Score</th>
                <th className="pb-3 px-4">Est. Value</th>
                <th className="pb-3 px-4">Stage</th>
                <th className="pb-3 px-4">Assigned RM</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-blue-600">
                        {lead.leadId}
                      </span>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {lead.customerName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {lead.contactEmail}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    {lead.category}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900 tabular-nums">
                    {lead.leadScore} / 100
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 tabular-nums">
                    {lead.estimatedValue}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {lead.stage}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    {lead.assignedTo}
                  </td>

                  <td className="py-3 pl-4 text-right whitespace-nowrap">
                    <button className="text-[11px] font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
                      Review <ChevronRight className="inline h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-medium text-blue-600">{selectedLead.leadId}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedLead.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded bg-slate-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Recommended Scheme</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {selectedLead.recommendedProduct}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Contact</span>
                <span className="text-slate-900 font-medium">{selectedLead.contactEmail} • {selectedLead.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Estimated Value</span>
                <span className="text-emerald-700 font-bold tabular-nums">{selectedLead.estimatedValue}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned RM</span>
                <span className="text-slate-900 font-medium">{selectedLead.assignedTo}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  alert(`Direct WhatsApp outreach triggered for ${selectedLead.customerName}`);
                  setSelectedLead(null);
                }}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs"
              >
                Trigger Outreach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
