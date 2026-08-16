"use client";

import React, { useState } from "react";
import { Sliders, Database, Check } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            System
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Underwriting & Integration Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated risk scoring tolerances and Data Access Layer connections.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          <span>{saved ? "Saved" : "Save Settings"}</span>
        </button>
      </div>

      <div className="border border-slate-200 bg-white p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Straight-Through Underwriting Thresholds
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-500 block text-[11px] uppercase font-semibold mb-1">
              Minimum Credit Score
            </label>
            <input
              type="number"
              defaultValue={750}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-slate-500 block text-[11px] uppercase font-semibold mb-1">
              Max Auto-Approval Limit (₹)
            </label>
            <input
              type="text"
              defaultValue="₹50,00,000"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-200 bg-white p-5 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Centralized Data Access Layer Status
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-slate-700 font-medium">
              src/dal/sales-dal.ts
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
