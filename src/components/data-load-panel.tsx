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
  ShieldCheck,
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

interface PipelineLoadRequest {
  file_name: string;
  content_base64: string;
}

interface PipelineEffect {
  dataset_name: string;
  current_count: number;
  insert_count: number;
  update_count: number;
  skip_count: number;
}

interface PipelineWorkbookQuality {
  inspected_rows: number;
  valid_rows: number;
  invalid_rows: number;
  fields_with_missing_values: number;
  field_completeness: {
    field: string;
    populated_count: number;
    missing_count: number;
    completeness: number;
  }[];
}

interface PreviewRow {
  row: number;
  action: "insert" | "update" | "skip" | "invalid";
  key: string | null;
  issues: string[];
  details?: Record<string, string | number | null>;
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
  pipeline_effects?: PipelineEffect[];
  pipeline_quality?: PipelineWorkbookQuality;
}

interface PipelineWorkbookPreviewResult {
  file_name: string;
  row_count: number;
  invalid_count: number;
  quality: PipelineWorkbookQuality;
  effects: PipelineEffect[];
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
  pipeline_workbook: "Full pipeline workbook",
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
  pipeline_workbook: "/leads",
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

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function toPipelinePreview(result: PipelineWorkbookPreviewResult): LoadPreview {
  const totals = result.effects.reduce(
    (sum, effect) => ({
      current_count: sum.current_count + effect.current_count,
      insert_count: sum.insert_count + effect.insert_count,
      update_count: sum.update_count + effect.update_count,
      skip_count: sum.skip_count + effect.skip_count,
    }),
    { current_count: 0, insert_count: 0, update_count: 0, skip_count: 0 },
  );
  return {
    dataset_name: "pipeline_workbook",
    file_name: result.file_name,
    row_count: result.row_count,
    current_count: totals.current_count,
    insert_count: totals.insert_count,
    update_count: totals.update_count,
    skip_count: totals.skip_count,
    invalid_count: result.invalid_count,
    replace_delete_count: 0,
    replace_blocked_count: 1,
    replace_blocked_reason: "Replace is disabled for full pipeline workbooks to protect records outside this file.",
    preview_rows: result.preview_rows,
    pipeline_effects: result.effects,
    pipeline_quality: result.quality,
  };
}

export function DataLoadPanel() {
  const [datasets, setDatasets] = useState<LoadDataset[]>([]);
  const [history, setHistory] = useState<LoadJob[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [payload, setPayload] = useState<LoadRequest | PipelineLoadRequest | null>(null);
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
  const matchingCount = preview?.pipeline_effects
    ? mode === "append"
      ? preview.pipeline_effects.find((effect) => effect.dataset_name === "leads")?.skip_count ?? 0
      : preview.update_count
    : preview?.update_count ?? 0;
  const mergeDescription = useMemo(() => {
    if (!preview) return null;
    return `${preview.insert_count} new, ${preview.update_count} matching`;
  }, [preview]);
  const missingQualityFields = useMemo(
    () =>
      (preview?.pipeline_quality?.field_completeness ?? [])
        .filter((field) => field.missing_count > 0)
        .sort((left, right) => right.missing_count - left.missing_count),
    [preview],
  );

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
      if (extension === "xlsx") {
        const nextPayload: PipelineLoadRequest = {
          file_name: file.name,
          content_base64: toBase64(new Uint8Array(await file.arrayBuffer())),
        };
        const result = await requestJson<PipelineWorkbookPreviewResult>(
          "/api/data/load/pipeline/preview",
          { ...nextPayload, mode },
        );
        setPayload(nextPayload);
        setPreview(toPipelinePreview(result));
        setDatasetName("pipeline_workbook");
        setMode("merge");
        return;
      }
      if (extension !== "csv" && extension !== "json") {
        throw new Error("Choose an .xlsx pipeline workbook, CSV, or JSON file.");
      }
      if (datasetName === "pipeline_workbook") {
        setDatasetName(datasets[0]?.name ?? "");
      }
      const nextPayload: LoadRequest = {
        dataset_name: datasetName === "pipeline_workbook"
          ? datasets[0]?.name ?? ""
          : datasetName,
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

  const selectMode = async (nextMode: LoadMode) => {
    setMode(nextMode);
    if (!preview?.pipeline_effects || !payload || !("content_base64" in payload)) return;
    setError(null);
    setIsPreviewing(true);
    try {
      const result = await requestJson<PipelineWorkbookPreviewResult>(
        "/api/data/load/pipeline/preview",
        { ...payload, mode: nextMode },
      );
      setPreview(toPipelinePreview(result));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the preview.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = async () => {
    if (!payload || !canApply || isApplying) return;
    if (
      mode === "replace" &&
      !window.confirm(
        `Replace ${
          "dataset_name" in payload
            ? DATASET_LABELS[payload.dataset_name] ?? payload.dataset_name
            : "pipeline workbook"
        }? ${preview?.replace_delete_count ?? 0} existing record(s) not present in the file will be removed.`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    setIsApplying(true);
    try {
      if ("content_base64" in payload) {
        const result = await requestJson<{
          mode: LoadMode;
          row_count: number;
          effects: PipelineEffect[];
        }>("/api/data/load/pipeline/apply", { ...payload, mode });
        setSuccess(
          `${result.mode} complete for ${result.row_count} workbook rows: ${result.effects
            .filter((effect) => effect.insert_count > 0 || effect.update_count > 0)
            .map((effect) => `${effect.dataset_name}: ${effect.insert_count} added, ${effect.update_count} updated`)
            .join("; ")}.`,
        );
      } else {
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
      }
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
            Preview changes before applying a full Excel pipeline workbook or
            an individual CSV/JSON dataset.
          </p>
        </div>
        <Link
          href={preview?.pipeline_quality ? "#upload-data-quality" : "#import-dataset"}
          className="text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          {preview?.pipeline_quality ? "View upload data quality" : "Check upload data quality"}
        </Link>
      </header>

      {error ? <Notice tone="error" message={error} /> : null}
      {success ? <Notice tone="success" message={success} /> : null}

      <section id="import-dataset" className="rounded-xl border border-slate-200 bg-white p-5">
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
              <option value="pipeline_workbook">Full pipeline workbook (.xlsx)</option>
            </select>
            {datasetName === "pipeline_workbook" ? (
              <span className="mt-1.5 block leading-relaxed text-slate-500">
                Imports the workbook’s source rows into linked customers,
                products, campaigns, leads, calls, tasks, follow-ups, and
                activity. Replace is disabled to protect data outside the file.
              </span>
            ) : selectedDataset ? (
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
                Excel workbook, CSV or JSON file
              </span>
              <input
                key={fileInputKey}
                type="file"
                accept=".xlsx,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  setPayload(null);
                  setPreview(null);
                  setSuccess(null);
                  const extension = selectedFile?.name.split(".").pop()?.toLowerCase();
                  if (extension === "xlsx") {
                    setDatasetName("pipeline_workbook");
                    setMode("merge");
                  } else if (datasetName === "pipeline_workbook") {
                    setDatasetName(datasets[0]?.name ?? "");
                  }
                }}
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                Max 10 MB · .xlsx previews the full pipeline; CSV/JSON loads
                one selected section
              </span>
              {datasetName !== "pipeline_workbook" ? (
                <button
                  type="button"
                  onClick={downloadTemplate}
                  disabled={!selectedDataset}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:text-blue-800 disabled:text-slate-300"
                >
                  <Download className="h-3 w-3" />
                  Download template
                </button>
              ) : null}
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
              value={matchingCount}
              tone="amber"
            />
            <Metric label="Invalid rows" value={preview.invalid_count} tone={preview.invalid_count ? "rose" : "slate"} />
            <Metric label="Removed on replace" value={preview.replace_delete_count} tone={preview.replace_delete_count ? "rose" : "slate"} />
          </div>

          {preview.pipeline_quality ? (
            <section
              id="upload-data-quality"
              aria-labelledby="upload-data-quality-heading"
              className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <h3 id="upload-data-quality-heading" className="text-xs font-semibold text-slate-900">
                    Data quality in this workbook
                  </h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    Measured from the uploaded rows before import. Blank cells are reported here;
                    optional blanks do not block an import.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric
                  label="Rows reviewed"
                  value={preview.pipeline_quality.inspected_rows}
                  tone="blue"
                />
                <Metric
                  label="Valid rows"
                  value={preview.pipeline_quality.valid_rows}
                  tone="blue"
                />
                <Metric
                  label="Invalid rows"
                  value={preview.pipeline_quality.invalid_rows}
                  tone={preview.pipeline_quality.invalid_rows ? "rose" : "slate"}
                />
                <Metric
                  label="Fields with blanks"
                  value={preview.pipeline_quality.fields_with_missing_values}
                  tone={preview.pipeline_quality.fields_with_missing_values ? "amber" : "slate"}
                />
              </div>
              {missingQualityFields.length ? (
                <>
                  <FieldQualityTable fields={missingQualityFields.slice(0, 8)} />
                  {preview.pipeline_quality.field_completeness.length > 8 ? (
                    <details className="text-[10px] text-slate-600">
                      <summary className="cursor-pointer font-medium text-blue-700">
                        Show all {preview.pipeline_quality.field_completeness.length} workbook fields
                      </summary>
                      <div className="mt-2">
                        <FieldQualityTable fields={preview.pipeline_quality.field_completeness} />
                      </div>
                    </details>
                  ) : null}
                </>
              ) : (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-[10px] text-emerald-800">
                  All workbook fields are populated.
                </p>
              )}
            </section>
          ) : null}

          {preview.pipeline_effects ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Pipeline section</th>
                    <th className="px-3 py-2">Current</th>
                    <th className="px-3 py-2">Will add</th>
                    <th className="px-3 py-2">Will update</th>
                    <th className="px-3 py-2">Will skip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.pipeline_effects.map((effect) => (
                    <tr key={effect.dataset_name}>
                      <td className="px-3 py-2 font-medium capitalize text-slate-700">
                        {DATASET_LABELS[effect.dataset_name] ?? effect.dataset_name.replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">{effect.current_count.toLocaleString()}</td>
                      <td className="px-3 py-2 tabular-nums text-blue-700">{effect.insert_count.toLocaleString()}</td>
                      <td className="px-3 py-2 tabular-nums text-amber-700">{effect.update_count.toLocaleString()}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-500">{effect.skip_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

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
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Product · Campaign · Lead status</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.preview_rows.map((row) => (
                  <tr key={row.row}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{row.row}</td>
                    <td className="max-w-40 truncate px-3 py-2 font-mono text-[11px] text-slate-600">
                      {row.key ?? "—"}
                    </td>
                    <td className="max-w-80 truncate px-3 py-2 text-slate-600">
                      {row.details
                        ? `${row.details.product ?? ""} · ${row.details.campaign ?? ""} · ${row.details.lead_status ?? ""}`
                        : "—"}
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

          <div className={`grid gap-2 ${preview.pipeline_effects ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <ModeButton
              selected={mode === "merge"}
              title="Merge"
              description={`${mergeDescription ?? "Add new and update matching"}; blank optional fields preserve existing values.`}
              onClick={() => void selectMode("merge")}
              disabled={isPreviewing}
            />
            <ModeButton
              selected={mode === "append"}
              title="Append"
              description="Add new records only; skip rows with a matching key."
              onClick={() => void selectMode("append")}
              disabled={isPreviewing}
            />
            {!preview.pipeline_effects ? (
              <ModeButton
                selected={mode === "replace"}
                title="Replace"
                description={`Make this dataset match the file; ${preview.replace_delete_count} unlisted record(s) will be removed.`}
                onClick={() => setMode("replace")}
                disabled={preview.replace_blocked_count > 0}
              />
            ) : null}
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

function FieldQualityTable({
  fields,
}: {
  fields: PipelineWorkbookQuality["field_completeness"];
}) {
  return (
    <div className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full min-w-[420px] text-left text-[10px]">
        <thead className="sticky top-0 bg-slate-100 uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-2.5 py-2">Workbook field</th>
            <th className="px-2.5 py-2 text-right">Populated</th>
            <th className="px-2.5 py-2 text-right">Missing</th>
            <th className="px-2.5 py-2 text-right">Complete</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fields.map((field) => (
            <tr key={field.field}>
              <td className="px-2.5 py-1.5 font-mono text-slate-700">{field.field}</td>
              <td className="px-2.5 py-1.5 text-right tabular-nums text-slate-600">
                {field.populated_count.toLocaleString()}
              </td>
              <td className="px-2.5 py-1.5 text-right tabular-nums text-amber-700">
                {field.missing_count.toLocaleString()}
              </td>
              <td className="px-2.5 py-1.5 text-right tabular-nums text-slate-600">
                {Math.round(field.completeness * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
