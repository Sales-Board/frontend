import React from "react";
import { AIAgentChat } from "@/components/ai-agent-chat";

export default function AIAgentPage() {
  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Intelligence
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            AI Copilot
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ask questions about your leads and sales data.
          </p>
        </div>
      </header>
      <AIAgentChat />
    </div>
  );
}
