"use client";

export interface ChatModel {
  provider: string;
  model_id: string;
  name: string;
  configured: boolean;
}

export const CHAT_MODEL_OPTIONS: ChatModel[] = [
  { provider: "groq", model_id: "openai/gpt-oss-20b", name: "GPT OSS 20B", configured: false },
  { provider: "groq", model_id: "openai/gpt-oss-120b", name: "GPT OSS 120B", configured: false },
  { provider: "groq", model_id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B", configured: false },
  { provider: "google", model_id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", configured: false },
  { provider: "google", model_id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", configured: false },
  { provider: "google", model_id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite", configured: false },
];

export function AIChatModelPicker({
  models,
  modelId,
  onChange,
}: {
  models: ChatModel[];
  modelId: string;
  onChange: (modelId: string) => void;
}) {
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-500 md:inline">
        Model
      </span>
      <select
        value={modelId}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select AI model"
        className="max-w-[180px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-700 outline-none focus:border-blue-500 sm:max-w-[230px]"
      >
        <optgroup label="Groq">
          {models
            .filter((model) => model.provider === "groq")
            .map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Google Gemini">
          {models
            .filter((model) => model.provider === "google")
            .map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name}
              </option>
            ))}
        </optgroup>
      </select>
    </label>
  );
}
