"use client";

import React, { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { exportResourceAction } from "@/dal/actions";
import { formatNumber } from "@/lib/format";

const RESOURCES = [
  "leads",
  "customers",
  "campaigns",
  "products",
  "calls",
  "tasks",
  "followups",
];

/**
 * POST /api/data/export.
 *
 * The backend writes the export to a path on the server and returns that path;
 * it exposes no route to download the file, so this reports the location rather
 * than offering a download link that would 404.
 */
export function ExportPanel() {
  const [result, setResult] = useState<
    { ok: true; path: string; rows: number } | { ok: false; message: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      const response = await exportResourceAction(
        String(formData.get("resource") ?? "leads"),
        String(formData.get("file_format") ?? "json"),
      );
      setResult(
        response.ok
          ? { ok: true, path: response.data.file_path, rows: response.data.row_count }
          : { ok: false, message: response.error },
      );
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Download className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900">Export a resource</h3>
      </div>

      <form action={submit} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
            Resource
          </span>
          <select name="resource" defaultValue="leads" className={inputClass}>
            {RESOURCES.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs sm:w-32">
          <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
            Format
          </span>
          <select name="file_format" defaultValue="json" className={inputClass}>
            <option value="json">json</option>
            <option value="csv">csv</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Exporting…" : "Export"}
        </button>
      </form>

      {result ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-[11px] ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {result.ok ? (
            <>
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-all">
                Wrote {formatNumber(result.rows)} rows to{" "}
                <code className="font-mono">{result.path}</code> on the API server.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{result.message}</span>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none";
