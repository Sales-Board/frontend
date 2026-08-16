"use client";

import React, { useState } from "react";
import { Plus, Calculator, Sparkles, ShieldCheck } from "lucide-react";

export function QuickActions() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const actions = [
    {
      id: "log_policy",
      label: "Log Policy Deal",
      desc: "Record proposal and issue reference",
      icon: Plus,
    },
    {
      id: "calc_premium",
      label: "Premium Calculator",
      desc: "Instant actuarial quote & margin",
      icon: Calculator,
    },
    {
      id: "ai_score",
      label: "Run AI Lead Scorer",
      desc: "Predict conversion & risk rating",
      icon: Sparkles,
    },
    {
      id: "kyc_audit",
      label: "Audit KYC & AML",
      desc: "Straight-through verification check",
      icon: ShieldCheck,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => setActiveModal(act.id)}
              className="p-3.5 border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs rounded-xl text-left transition-all duration-150 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  Fast
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {act.label}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {act.desc}
              </p>
            </button>
          );
        })}
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {actions.find((a) => a.id === activeModal)?.label}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                  Client / Account Name
                </label>
                <input
                  type="text"
                  defaultValue="Bajaj Finserv Corporate Trust"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                  Target Premium (₹)
                </label>
                <input
                  type="text"
                  defaultValue="₹65,00,000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Action submitted.");
                  setActiveModal(null);
                }}
                className="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Submit Action
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
