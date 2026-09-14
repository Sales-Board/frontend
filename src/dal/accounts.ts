import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import { toCampaignRow, toCustomerRow, toProductRow } from "@/lib/api/adapters";
import { MAX_PAGE_SIZE, collectIssues, toIssue } from "./shared";
import type {
  CampaignRow,
  CustomerRow,
  LoadIssue,
  ProductRow,
} from "./types";

/** A customer joined with the size and state of their lead book. */
export interface AccountRow extends CustomerRow {
  leadCount: number;
  convertedLeads: number;
  /** Highest lead score across this customer's leads. */
  bestScore: number | null;
  lastActivityAt: string | null;
}

export interface AccountsView {
  accounts: AccountRow[];
  products: ProductRow[];
  campaigns: CampaignRow[];
  issues: LoadIssue[];
}

/**
 * Accounts screen — customers with their lead book, plus reference catalogues.
 *
 * GET /api/customers  the accounts themselves
 * GET /api/leads      joined in memory; the backend has no customer-with-leads route
 * GET /api/products   product catalogue
 * GET /api/campaigns  campaign catalogue
 */
export async function getAccountsView(): Promise<AccountsView> {
  const [customers, leads, products, campaigns] = await Promise.all([
    tolerate(api.listCustomers({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listLeads({ limit: MAX_PAGE_SIZE }), []),
    tolerate(api.listProducts({ limit: 200 }), []),
    tolerate(api.listCampaigns({ limit: 200 }), []),
  ]);

  const byCustomer = new Map<
    number,
    { leadCount: number; converted: number; bestScore: number | null; last: string | null }
  >();

  for (const lead of leads.data) {
    const entry = byCustomer.get(lead.customer_id) ?? {
      leadCount: 0,
      converted: 0,
      bestScore: null,
      last: null,
    };
    entry.leadCount += 1;
    if (lead.Label_Source_Lead_Status?.toLowerCase() === "converted") {
      entry.converted += 1;
    }
    if (lead.lead_score !== null) {
      entry.bestScore =
        entry.bestScore === null
          ? lead.lead_score
          : Math.max(entry.bestScore, lead.lead_score);
    }
    if (!entry.last || lead.updated_at > entry.last) entry.last = lead.updated_at;
    byCustomer.set(lead.customer_id, entry);
  }

  const accounts: AccountRow[] = customers.data
    .map((customer) => {
      const stats = byCustomer.get(customer.id);
      return {
        ...toCustomerRow(customer),
        leadCount: stats?.leadCount ?? 0,
        convertedLeads: stats?.converted ?? 0,
        bestScore: stats?.bestScore ?? null,
        lastActivityAt: stats?.last ?? null,
      };
    })
    .sort((a, b) => b.leadCount - a.leadCount);

  return {
    accounts,
    products: products.data.map(toProductRow),
    campaigns: campaigns.data.map(toCampaignRow),
    issues: collectIssues(
      toIssue("customers", customers.error),
      toIssue("leads", leads.error),
      toIssue("products", products.error),
      toIssue("campaigns", campaigns.error),
    ),
  };
}
