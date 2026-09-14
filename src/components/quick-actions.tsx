"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Download,
  CalendarClock,
  Brain,
  AlertCircle,
} from "lucide-react";
import {
  createFollowupAction,
  createTaskAction,
  exportResourceAction,
  trainModelAction,
} from "@/dal/actions";

type ActionId = "task" | "followup" | "export" | "train";

const ACTIONS: {
  id: ActionId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "task",
    label: "Create Task",
    desc: "POST /api/tasks",
    icon: ClipboardList,
  },
  {
    id: "followup",
    label: "Schedule Follow-up",
    desc: "POST /api/followups",
    icon: CalendarClock,
  },
  {
    id: "export",
    label: "Export Data",
    desc: "POST /api/data/export",
    icon: Download,
  },
  {
    id: "train",
    label: "Train Model",
    desc: "POST /api/ml/train",
    icon: Brain,
  },
];

const EXPORT_RESOURCES = [
  "leads",
  "customers",
  "campaigns",
  "products",
  "calls",
  "tasks",
  "followups",
];

/**
 * Quick actions that hit the backend for real.
 *
 * Each one posts through a Server Action and reports what the API returned,
 * including 422 validation text, rather than showing a success toast
 * unconditionally.
 */
export function QuickActions() {
  const [active, setActive] = useState<ActionId | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const close = () => {
    setActive(null);
    setResult(null);
  };

  const submit = (formData: FormData) => {
    setResult(null);
    startTransition(async () => {
      let response: { ok: boolean; error?: string; data?: unknown };
      let success = "Done.";

      switch (active) {
        case "task": {
          const leadId = String(formData.get("lead_id") ?? "").trim();
          response = await createTaskAction({
            Label_Source_Disposition: String(formData.get("title") ?? "").trim(),
            description: String(formData.get("description") ?? "").trim() || undefined,
            priority: String(formData.get("priority") ?? "medium"),
            lead_id: leadId ? Number(leadId) : undefined,
          });
          success = "Task created.";
          break;
        }
        case "followup": {
          const leadId = String(formData.get("lead_id") ?? "").trim();
          const scheduled = String(formData.get("scheduled_at") ?? "").trim();
          response = await createFollowupAction({
            channel: String(formData.get("channel") ?? "call"),
            lead_id: leadId ? Number(leadId) : undefined,
            // datetime-local yields no timezone; send as-is and let the backend parse.
            scheduled_at: scheduled || undefined,
            Label_Basis: String(formData.get("notes") ?? "").trim() || undefined,
          });
          success = "Follow-up scheduled.";
          break;
        }
        case "export": {
          const exportResult = await exportResourceAction(
            String(formData.get("resource") ?? "leads"),
            String(formData.get("file_format") ?? "json"),
          );
          response = exportResult;
          success = exportResult.ok
            ? `Exported ${exportResult.data.row_count} rows to ${exportResult.data.file_path}`
            : "";
          break;
        }
        case "train": {
          const trainResult = await trainModelAction(
            String(formData.get("model_name") ?? "").trim() || undefined,
          );
          response = trainResult;
          success = trainResult.ok
            ? `Training job #${trainResult.data.id} is ${trainResult.data.status}.`
            : "";
          break;
        }
        default:
          return;
      }

      setResult(
        response.ok
          ? { ok: true, message: success }
          : { ok: false, message: response.error ?? "Request failed." },
      );
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => {
                setActive(action.id);
                setResult(null);
              }}
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all duration-150 hover:border-blue-400 hover:shadow-xs"
            >
              <Icon className="mb-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-600" />
              <h4 className="text-xs font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                {action.label}
              </h4>
              <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                {action.desc}
              </p>
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <form
            action={submit}
            className="w-full max-w-sm animate-in space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {ACTIONS.find((a) => a.id === active)?.label}
              </h3>
              <button
                type="button"
                onClick={close}
                className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {active === "task" ? <TaskFields /> : null}
              {active === "followup" ? <FollowupFields /> : null}
              {active === "export" ? <ExportFields /> : null}
              {active === "train" ? <TrainFields /> : null}
            </div>

            {result ? (
              <div
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] ${
                  result.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <span className="break-all">{result.message}</span>
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {pending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

const labelClass =
  "mb-1 block text-[10px] font-semibold uppercase text-slate-500";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none";

function TaskFields() {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="title">
          Title (required)
        </label>
        <input id="title" name="title" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea id="description" name="description" rows={2} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="priority">
            Priority
          </label>
          <select id="priority" name="priority" className={inputClass} defaultValue="medium">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="lead_id">
            Lead ID (optional)
          </label>
          <input id="lead_id" name="lead_id" type="number" min={1} className={inputClass} />
        </div>
      </div>
    </>
  );
}

function FollowupFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="channel">
            Channel
          </label>
          <select id="channel" name="channel" className={inputClass} defaultValue="call">
            <option value="call">call</option>
            <option value="whatsapp">whatsapp</option>
            <option value="email">email</option>
            <option value="rcs">rcs</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="lead_id">
            Lead ID
          </label>
          <input id="lead_id" name="lead_id" type="number" min={1} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="scheduled_at">
          Scheduled at
        </label>
        <input
          id="scheduled_at"
          name="scheduled_at"
          type="datetime-local"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <input id="notes" name="notes" className={inputClass} />
      </div>
    </>
  );
}

function ExportFields() {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="resource">
          Resource
        </label>
        <select id="resource" name="resource" className={inputClass} defaultValue="leads">
          {EXPORT_RESOURCES.map((resource) => (
            <option key={resource} value={resource}>
              {resource}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="file_format">
          Format
        </label>
        <select id="file_format" name="file_format" className={inputClass} defaultValue="json">
          <option value="json">json</option>
          <option value="csv">csv</option>
        </select>
      </div>
      <p className="text-[11px] text-slate-500">
        The backend writes the file on the server and returns its path. There is
        no download route to link to.
      </p>
    </>
  );
}

function TrainFields() {
  return (
    <>
      <div>
        <label className={labelClass} htmlFor="model_name">
          Model name
        </label>
        <input
          id="model_name"
          name="model_name"
          placeholder="lead_conversion_baseline"
          className={inputClass}
        />
      </div>
      <p className="text-[11px] text-slate-500">
        Leave blank to train the backend&apos;s default model.
      </p>
    </>
  );
}
