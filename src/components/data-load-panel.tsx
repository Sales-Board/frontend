"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from "lucide-react";

interface LoadDataset {
  name: string;
  fields: string[];
  required_fields: string[];
  match_field: string;
}

interface LoadRequest {
  dataset_name: string;
  file_name: string;
  file_format: "csv" | "json";
  content: string;
}

interface PreviewRow {
  row: number;
  action: "insert" | "update" | "skip" | "invalid";
  key: string | null;
  issues: string[];
}

interface LoadPreview {
  dataset_name: string;
  file_name: string;
  row_count: number;
  current_count: number;
  insert_count: number;
  update_count: number;
  skip_count: number;
  invalid_count: number;
  replace_delete_count: number;
  replace_blocked_count: number;
  replace_blocked_reason: string | null;
  preview_rows: PreviewRow[];
}

interface LoadJob {
  id: number;
  dataset_name: string;
  source_path: string;
  status: string;
  row_count: number;
  invalid_row_count: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

type LoadMode = "merge" | "append" | "replace";

const DATASET_LABELS: Record<string, string> = {
  customers: "Customers / Accounts",
  leads: "Leads",
  products: "Products",
  campaigns: "Campaigns",
  calls: "Calls",
  tasks: "Tasks",
  followups: "Follow-ups",
  engagement_events: "Engagement events",
  website_events: "Website events",
  lead_assignments: "Lead assignments",
  lead_outcomes: "Lead outcomes",
  lead_timeline_events: "Lead timeline events",
};

const DATASET_LINKS: Record<string, string> = {
  customers: "/accounts",
  leads: "/leads",
  products: "/analytics",
  campaigns: "/analytics",
  calls: "/leads",
  tasks: "/workload",
  followups: "/workload",
  engagement_events: "/analytics",
  website_events: "/pipeline",
  lead_assignments: "/leads",
  lead_outcomes: "/leads",
  lead_timeline_events: "/leads",
};

async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String(payload.detail)
        : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload as T;
}

export function DataLoadPanel() {
  const [datasets, setDatasets] = useState<LoadDataset[]>([]);
  const [history, setHistory] = useState<LoadJob[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [payload, setPayload] = useState<LoadRequest | null>(null);
  const [preview, setPreview] = useState<LoadPreview | null>(null);
  const [mode, setMode] = useState<LoadMode>("merge");
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      requestJson<LoadDataset[]>("/api/data/load/datasets"),
      requestJson<LoadJob[]>("/api/data/history?skip=0&limit=100"),
    ])
      .then(([availableDatasets, jobs]) => {
        if (!active) return;
        setDatasets(availableDatasets);
        setDatasetName(availableDatasets[0]?.name ?? "");
        setHistory(jobs.filter((job) => job.details && "mode" in job.details).slice(0, 10));
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load data workspace.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedDataset = datasets.find((dataset) => dataset.name === datasetName);
  const canApply = preview !== null && preview.invalid_count === 0;
  const mergeDescription = useMemo(() => {
    if (!preview) return null;
    return `${preview.insert_count} new, ${preview.update_count} matching`;
  }, [preview]);

  const handlePreview = async () => {
    if (!file || !datasetName || isPreviewing) return;
    setError(null);
    setSuccess(null);
    setPreview(null);
    setIsPreviewing(true);
    try {
      if (file.size > 10_000_000) {
        throw new Error("Choose a file smaller than 10 MB.");
      }
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "csv" && extension !== "json") {
        throw new Error("Choose a CSV or JSON file.");
      }
      const nextPayload: LoadRequest = {
        dataset_name: datasetName,
        file_name: file.name,
        file_format: extension,
        content: await file.text(),
      };
      const result = await requestJson<LoadPreview>(
        "/api/data/load/preview",
        nextPayload,
      );
      setPayload(nextPayload);
      setPreview(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not preview this file.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = async () => {
    if (!payload || !canApply || isApplying) return;
    if (
      mode === "replace" &&
      !window.confirm(
        `Replace ${DATASET_LABELS[payload.dataset_name] ?? payload.dataset_name}? ${preview?.replace_delete_count ?? 0} existing record(s) not present in the file will be removed.`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    setIsApplying(true);
    try {
      const result = await requestJson<{
        mode: LoadMode;
        inserted_count: number;
        updated_count: number;
        skipped_count: number;
        deleted_count: number;
      }>("/api/data/load/apply", { ...payload, mode });
      setSuccess(
        `${result.mode} complete: ${result.inserted_count} added, ${result.updated_count} updated, ${result.skipped_count} skipped, ${result.deleted_count} removed.`,
      );
      setPreview(null);
      setPayload(null);
      setFile(null);
      setFileInputKey((key) => key + 1);
      try {
        const jobs = await requestJson<LoadJob[]>("/api/data/history?skip=0&limit=100");
        setHistory(jobs.filter((job) => job.details && "mode" in job.details).slice(0, 10));
      } catch (cause) {
        setError(
          `Import applied, but activity could not refresh: ${
            cause instanceof Error ? cause.message : "request failed"
          }`,
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not apply this import.");
    } finally {
      setIsApplying(false);
    }
  };

  const downloadTemplate = () => {
    if (!selectedDataset) return;
    const csv = `${selectedDataset.fields.join(",")}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedDataset.name}-template.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearPreview = () => {
    setFile(null);
    setFileInputKey((key) => key + 1);
    setPayload(null);
    setPreview(null);
    setSuccess(null);
  };

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Operations
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Load data
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Preview changes before applying a CSV or JSON dataset. Imported
            records feed the matching sections throughout the application.
          </p>
        </div>
        <Link
          href="/system"
          className="text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          View data quality
        </Link>
      </header>

      {error ? <Notice tone="error" message={error} /> : null}
      {success ? <Notice tone="success" message={success} /> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Import a dataset</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
          <label className="text-xs">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Application dataset
            </span>
            <select
              value={datasetName}
              onChange={(event) => {
                setDatasetName(event.target.value);
                clearPreview();
              }}
              disabled={isLoading || datasets.length === 0}
              className={inputClass}
            >
              {datasets.map((dataset) => (
                <option key={dataset.name} value={dataset.name}>
                  {DATASET_LABELS[dataset.name] ?? dataset.name}
                </option>
              ))}
            </select>
            {selectedDataset ? (
              <>
                <span className="mt-1.5 block leading-relaxed text-slate-500">
                  Matches records by <code>{selectedDataset.match_field}</code>.
                  Empty optional values become null for new records and preserve
                  existing values when updating records.
                </span>
                <details className="mt-2 text-[10px] text-slate-500">
                  <summary className="cursor-pointer font-medium text-blue-700">
                    Show supported fields
                  </summary>
                  <p className="mt-1 leading-relaxed">
                    <span className="font-semibold">Required: </span>
                    {selectedDataset.required_fields.join(", ") || "none"}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    <span className="font-semibold">Fields: </span>
                    {selectedDataset.fields.join(", ")}
                  </p>
                </details>
              </>
            ) : null}
          </label>

          <div>
            <label className="block text-xs">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                CSV or JSON file
              </span>
              <input
                key={fileInputKey}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPayload(null);
                  setPreview(null);
                  setSuccess(null);
                }}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                Max 10 MB · blank optional fields are allowed · unknown columns
                are retained as custom fields
              </span>
              <button
                type="button"
                onClick={downloadTemplate}
                disabled={!selectedDataset}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:text-blue-800 disabled:text-slate-300"
              >
                <Download className="h-3 w-3" />
                Download template
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handlePreview()}
            disabled={!file || !datasetName || isPreviewing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPreviewing ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {isPreviewing ? "Checking file…" : "Preview changes"}
          </button>
        </div>
      </section>

      {preview ? (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Preview: {DATASET_LABELS[preview.dataset_name] ?? preview.dataset_name}
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {preview.file_name} · {preview.row_count.toLocaleString()} rows
                · {preview.current_count.toLocaleString()} existing records
              </p>
            </div>
            <button
              type="button"
              onClick={clearPreview}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear preview
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="New records" value={preview.insert_count} tone="blue" />
            <Metric
              label={mode === "append" ? "Duplicates skipped" : "Matching records"}
              value={preview.update_count}
              tone="amber"
            />
            <Metric label="Invalid rows" value={preview.invalid_count} tone={preview.invalid_count ? "rose" : "slate"} />
            <Metric label="Removed on replace" value={preview.replace_delete_count} tone={preview.replace_delete_count ? "rose" : "slate"} />
          </div>

          {preview.replace_blocked_count > 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Replace is unavailable:{" "}
              {preview.replace_blocked_reason ??
                `${preview.replace_blocked_count} linked record(s) would be affected. Import or remove dependent records first; linked records will not be cascade-deleted.`}
            </p>
          ) : null}

          {preview.invalid_count > 0 ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              Fix invalid rows before applying. The preview lists up to 100 rows.
            </p>
          ) : null}

          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Match key</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.preview_rows.map((row) => (
                  <tr key={row.row}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{row.row}</td>
                    <td className="max-w-56 truncate px-3 py-2 font-mono text-[11px] text-slate-600">
                      {row.key ?? "—"}
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-700">
                      {mode === "append" && row.action === "update" ? "skip" : row.action}
                    </td>
                    <td className="px-3 py-2 text-rose-700">
                      {row.issues.length ? row.issues.join(" · ") : "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <ModeButton
              selected={mode === "merge"}
              title="Merge"
              description={`${mergeDescription ?? "Add new and update matching"}; blank optional fields preserve existing values.`}
              onClick={() => setMode("merge")}
            />
            <ModeButton
              selected={mode === "append"}
              title="Append"
              description="Add new records only; skip rows with a matching key."
              onClick={() => setMode("append")}
            />
            <ModeButton
              selected={mode === "replace"}
              title="Replace"
              description={`Make this dataset match the file; ${preview.replace_delete_count} unlisted record(s) will be removed.`}
              onClick={() => setMode("replace")}
              disabled={preview.replace_blocked_count > 0}
            />
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
            <p className="max-w-xl text-[10px] leading-relaxed text-slate-500">
              Apply is transactional. The changes will be visible in the
              corresponding live sections after the import completes.
            </p>
            <button
              type="button"
              onClick={() => void handleApply()}
              disabled={!canApply || isApplying || (mode === "replace" && preview.replace_blocked_count > 0)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isApplying ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              {isApplying ? "Applying…" : `Apply ${mode}`}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Recent load activity</h2>
        </div>
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading activity…</p>
        ) : history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Dataset</th>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2">Rows</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="py-2 pl-3 text-right">Open section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((job) => (
                  <tr key={job.id}>
                    <td className="py-2.5 pr-3">
                      <span className="block font-medium text-slate-800">
                        {DATASET_LABELS[job.dataset_name] ?? job.dataset_name}
                      </span>
                      <span className="block max-w-48 truncate text-[10px] text-slate-400">
                        {job.source_path}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 capitalize text-slate-600">
                      {String(job.details?.mode ?? "—")}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{job.row_count.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                        {job.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <Link
                        href={DATASET_LINKS[job.dataset_name] ?? "/system"}
                        className="font-medium text-blue-700 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Applied imports will appear here.</p>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "rose" | "slate";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-50 text-slate-600",
  };
  return (
    <div className={`rounded-lg p-3 ${colors[tone]}`}>
      <span className="block text-[10px] font-medium">{label}</span>
      <span className="mt-1 block text-lg font-bold tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

function ModeButton({
  selected,
  title,
  description,
  onClick,
  disabled = false,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? "border-blue-300 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="block text-xs font-semibold text-slate-900">{title}</span>
      <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">
        {description}
      </span>
    </button>
  );
}

function Notice({ tone, message }: { tone: "error" | "success"; message: string }) {
  const isSuccess = tone === "success";
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none";
