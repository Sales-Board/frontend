import React from "react";
import { getDeals } from "@/dal/sales-dal";
import { DealsTable } from "@/components/deals-table";
import { Plus } from "lucide-react";

export default async function DealsPage() {
  const deals = await getDeals();
  const totalValue = deals.reduce((sum, d) => sum + d.rawPremium, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 block mb-1">
            Accounts
          </span>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Deals & Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {deals.length} active deals • ₹{(totalValue / 10000000).toFixed(2)} Cr total pipeline value
          </p>
        </div>

        <button className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-all cursor-pointer">
          <Plus className="h-3.5 w-3.5" />
          <span>New Deal</span>
        </button>
      </div>

      <DealsTable deals={deals} />
    </div>
  );
}
