"use client";

import React, { useState } from "react";
import { Sparkles, Send, ArrowRight } from "lucide-react";

export default function AIAssistantPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; content: string; time: string }[]>([
    {
      role: "ai",
      content:
        "Hello Rajesh. I monitor your corporate underwriting pipelines, lead scores, and cross-sell triggers in real time. How can I assist your sales team today?",
      time: "10:00 AM",
    },
  ]);

  const samplePrompts = [
    "Which accounts have highest closing probability this week?",
    "Generate outreach message for TCS Corporate Group Health",
    "Calculate risk margin for ₹1.2 Cr Commercial Fleet financing",
    "Summarize compliance checklist for HNI PMS accounts",
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text, time: "Just now" }]);
    setQuery("");

    setTimeout(() => {
      let reply = "Based on our active pipeline model: TCS Corporate Health (₹48.5L) and Infosys Superannuation (₹72L) have an 88%+ win probability. I recommend scheduling final contract review meetings before Friday.";

      if (text.toLowerCase().includes("pitch") || text.toLowerCase().includes("outreach") || text.toLowerCase().includes("message")) {
        reply = `*AI Proposition for TCS Leadership Team:*\n\n"Dear TCS Benefits Desk, our Comprehensive Corporate Group Health Shield provides 100% cashless coverage across 14,000+ pan-India network hospitals with 0% co-pay on day-care procedures. Premium estimated at ₹48.5L annually. Would you like to review the terms today?"`;
      }

      setMessages((prev) => [...prev, { role: "ai", content: reply, time: "Just now" }]);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Intelligence
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            AI Sales & Underwriting Copilot
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time natural language queries, client outreach generation, and margin calculations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-xl text-left text-xs text-slate-600 hover:text-slate-900 transition-all flex items-center justify-between group cursor-pointer"
          >
            <span className="truncate font-medium">{p}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
          </button>
        ))}
      </div>

      <div className="border border-slate-200 bg-white p-5 rounded-xl flex flex-col h-[440px] shadow-xs">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "ai" && (
                <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 text-xs font-bold shadow-2xs">
                  AI
                </div>
              )}
              <div
                className={`p-3.5 rounded-xl max-w-lg whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-blue-600 text-white font-medium shadow-xs"
                    : "bg-slate-50 text-slate-900 border border-slate-200/80"
                }`}
              >
                <p>{m.content}</p>
                <span className={`block text-[10px] mt-1 text-right ${m.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about sales targets, deals, quotes, or lead scores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button
            onClick={() => handleSend(query)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
