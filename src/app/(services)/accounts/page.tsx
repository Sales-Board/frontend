import React from "react";
import { Package, Megaphone } from "lucide-react";
import { getAccountsView } from "@/dal/accounts";
import { EmptyState, IssueBanner, TableEmptyRow } from "@/components/states";
import { formatNumber, formatRelative, orDash } from "@/lib/format";

/**
 * Accounts — customers with the size and state of their lead book, plus the
 * product and campaign catalogues.
 *
 * GET /api/customers, /api/leads, /api/products, /api/campaigns. The backend
 * has no customer-with-leads route, so the join happens in the loader.
 *
 * Customers are anonymized in the source dataset: a Customer_ID and banded
 * demographics, with no names, contact details or monetary values.
 */
export default async function AccountsPage() {
  const data = await getAccountsView();

  return (
    <div className="animate-in space-y-6 duration-200 fade-in">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div>
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Accounts
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Customers & Catalogue
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(data.accounts.length)} customers ·{" "}
            {formatNumber(data.products.length)} products ·{" "}
            {formatNumber(data.campaigns.length)} campaigns
          </p>
        </div>
      </header>

      <IssueBanner issues={data.issues} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xs">
        <h3 className="pb-4 text-sm font-semibold text-slate-900">Customers</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-4">Customer_ID</th>
                <th className="px-4 pb-3">Age band</th>
                <th className="px-4 pb-3">Income band</th>
                <th className="px-4 pb-3">Occupation</th>
                <th className="px-4 pb-3">Leads</th>
                <th className="px-4 pb-3">Converted</th>
                <th className="px-4 pb-3">Best score</th>
                <th className="pb-3 pl-4 text-right">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {data.accounts.length === 0 ? (
                <TableEmptyRow
                  colSpan={8}
                  message="No customers in the database yet. Run the backend's sample-data preload to populate it."
                />
              ) : (
                data.accounts.slice(0, 200).map((account) => (
                  <tr
                    key={account.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {account.customerRef}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{account.ageBand}</td>
                    <td className="px-4 py-3 text-slate-600">{account.incomeBand}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600">
                      {account.occupation}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                      {formatNumber(account.leadCount)}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-emerald-700">
                      {formatNumber(account.convertedLeads)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {account.bestScore === null
                        ? "—"
                        : account.bestScore.toFixed(0)}
                    </td>
                    <td className="py-3 pl-4 text-right text-slate-500">
                      {account.lastActivityAt
                        ? formatRelative(account.lastActivityAt)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.accounts.length > 200 ? (
          <p className="pt-3 text-[11px] text-slate-500">
            Showing the 200 customers with the largest lead books.
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Products</h3>
          </div>
          {data.products.length === 0 ? (
            <EmptyState title="No products" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {data.products.map((product) => (
                <li key={product.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate font-medium text-slate-900">
                    {product.name}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {product.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Megaphone className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Campaigns</h3>
          </div>
          {data.campaigns.length === 0 ? (
            <EmptyState title="No campaigns" />
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {data.campaigns.map((campaign) => (
                <li key={campaign.id} className="flex justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {campaign.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {orDash(campaign.channel)} · {campaign.status}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {campaign.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
