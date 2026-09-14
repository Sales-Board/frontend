import React from "react";
import { getLeadsView } from "@/dal/leads";
import { LeadTable } from "@/components/lead-table";
import { IssueBanner } from "@/components/states";
import { formatNumber } from "@/lib/format";

/**
 * Lead queue — GET /api/leads, joined with GET /api/customers so each row can
 * show its anonymized Customer_ID.
 *
 * `?page=` drives the backend's skip/limit paging.
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageSize = 100;
  const pageNumber = Math.max(1, Number(page ?? "1") || 1);

  const data = await getLeadsView({
    skip: (pageNumber - 1) * pageSize,
    limit: pageSize,
  });

  const hasNextPage = data.leads.length === pageSize;

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Lead Queue
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Leads & Triage
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Showing {formatNumber(data.leads.length)} lead
            {data.leads.length === 1 ? "" : "s"} on page {pageNumber}. Source
            data is anonymized — customers are identified by Customer_ID.
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <LeadTable
        leads={data.leads}
        statuses={data.statuses}
        title="Lead queue"
        emptyMessage={
          pageNumber > 1
            ? "No leads on this page."
            : "No leads in the database yet. Run the backend's sample-data preload to populate it."
        }
      />

      <nav className="flex items-center justify-between text-xs">
        <PageLink
          href={`/leads?page=${pageNumber - 1}`}
          disabled={pageNumber <= 1}
          label="← Previous"
        />
        <span className="text-slate-500">Page {pageNumber}</span>
        <PageLink
          href={`/leads?page=${pageNumber + 1}`}
          disabled={!hasNextPage}
          label="Next →"
        />
      </nav>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  const base = "rounded-lg border px-3 py-1.5 font-medium transition-colors";
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`${base} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300`}
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={`${base} border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600`}
    >
      {label}
    </a>
  );
}
