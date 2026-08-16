"use client";

import React, { useState, useEffect } from "react";
import { getReports } from "@/dal/sales-dal";
import { SalesReport } from "@/dal/types";
import { FileText, Download } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<SalesReport[]>([]);

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Governance
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Compliance & Sales Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated compliance audit dossiers, reconciliation reports, and underwriting logs.
          </p>
        </div>

        <button
          onClick={() => alert("Generating report dossier...")}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Generate Dossier</span>
        </button>
      </div>

      <div className="border border-slate-200 bg-white p-5 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pr-4">Dossier / Title</th>
                <th className="pb-3 px-4">Period</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Size</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-slate-900">{rep.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">{rep.period}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {rep.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 tabular-nums">{rep.fileSize}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 tabular-nums">{rep.generatedDate}</td>
                  <td className="py-3 pl-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => alert(`Downloading ${rep.title}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> {rep.format}
                    </button>
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
