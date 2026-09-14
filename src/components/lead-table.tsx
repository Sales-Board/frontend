"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { LeadRow, ScoreBand } from "@/dal/types";
import { formatRelative, humanize, orDash } from "@/lib/format";
import { TableEmptyRow } from "./states";

const SCORE_BADGE: Record<ScoreBand, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
  unscored: "bg-slate-50 text-slate-400 border-slate-200",
};

interface LeadTableProps {
  leads: LeadRow[];
  /** Status values to offer as filters; derived from the rows by the caller. */
  statuses?: string[];
  title?: string;
  /** Hides search and filters for compact dashboard use. */
  compact?: boolean;
  emptyMessage?: string;
}

/**
 * Lead queue table. Rows link to the lead workspace, which loads everything
 * else from GET /api/leads/{id}/details.
 *
 * Columns show the fields the dataset actually carries — the anonymized
 * Customer_ID, acquisition channel, status, score and owning handler. There are
 * no names, emails, phone numbers or monetary values in the source data.
 */
export function LeadTable({
  leads,
  statuses = [],
  title = "Leads",
  compact = false,
  emptyMessage = "No leads found.",
}: LeadTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = status === "ALL" || lead.status === status;
      if (!needle) return matchesStatus;
      return (
        matchesStatus &&
        (lead.customerRef.toLowerCase().includes(needle) ||
          lead.channel.toLowerCase().includes(needle) ||
          lead.handler.toLowerCase().includes(needle) ||
          String(lead.id).includes(needle))
      );
    });
  }, [leads, query, status]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
          <span className="ml-2 text-xs font-normal text-slate-500 tabular-nums">
            {filtered.length} of {leads.length}
          </span>
        </h3>

        {!compact ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Customer ID, channel, handler…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {statuses.length > 0 ? (
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All statuses</option>
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="pb-3 pr-4">Lead / Customer</th>
              <th className="px-4 pb-3">Channel</th>
              <th className="px-4 pb-3">Score</th>
              <th className="px-4 pb-3">Status</th>
              <th className="px-4 pb-3">Handler</th>
              <th className="px-4 pb-3">Updated</th>
              <th className="pb-3 pl-4 text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={7} message={emptyMessage} />
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-slate-50/80"
                >
                  <td className="py-3 pr-4">
                    <Link href={`/leads/${lead.id}`} className="flex flex-col">
                      <span className="text-[11px] font-medium text-blue-600">
                        Lead #{lead.id}
                      </span>
                      <span className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                        {lead.customerRef}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {humanize(lead.stage)} · {orDash(lead.section)}
                      </span>
                    </Link>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {humanize(lead.channel)}
                    <span className="block text-[11px] text-slate-400">
                      {humanize(lead.medium)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${SCORE_BADGE[lead.scoreBand]}`}
                    >
                      {lead.score === null ? "Unscored" : lead.score.toFixed(0)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {humanize(lead.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {lead.handler}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatRelative(lead.updatedAt)}
                  </td>

                  <td className="whitespace-nowrap py-3 pl-4 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                    >
                      Open <ChevronRight className="inline h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
