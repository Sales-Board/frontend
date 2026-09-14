import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import { toChannelStats } from "@/lib/api/adapters";
import type { AnalyticsFunnel, AnalyticsOverview } from "@/lib/api/schema";
import { collectIssues, toIssue } from "./shared";
import type {
  CampaignPerformanceRow,
  ChannelStat,
  LoadIssue,
} from "./types";

const EMPTY_OVERVIEW: AnalyticsOverview = {
  total_customers: 0,
  total_leads: 0,
  total_campaigns: 0,
  total_calls: 0,
  open_tasks: 0,
  pending_followups: 0,
  converted_leads: 0,
  conversion_rate: 0,
};

const EMPTY_FUNNEL: AnalyticsFunnel = {
  new_leads: 0,
  qualified_leads: 0,
  converted_leads: 0,
  lost_leads: 0,
  total_leads: 0,
  conversion_rate: 0,
};

export interface EngagementChannelTotals {
  channel: string;
  events: number;
  metricSum: number;
}

export interface AnalyticsView {
  overview: AnalyticsOverview;
  funnel: AnalyticsFunnel;
  channels: ChannelStat[];
  campaigns: CampaignPerformanceRow[];
  engagement: EngagementChannelTotals[];
  issues: LoadIssue[];
}

/**
 * Analytics screen.
 *
 * GET /api/analytics/overview            module totals
 * GET /api/analytics/funnel              status buckets
 * GET /api/analytics/channels            leads and engagement per channel
 * GET /api/reports/campaign-performance  per-campaign conversion (enveloped)
 * GET /api/campaigns                     campaign codes and channels to join on
 * GET /api/engagement/{whatsapp,rcs,email,website}
 *     one call per channel — the backend exposes no combined engagement route.
 */
export async function getAnalyticsView(): Promise<AnalyticsView> {
  const [
    overview,
    funnel,
    channels,
    campaignReport,
    campaigns,
    whatsapp,
    rcs,
    email,
    website,
  ] = await Promise.all([
    tolerate(api.getAnalyticsOverview(), EMPTY_OVERVIEW),
    tolerate(api.getAnalyticsFunnel(), EMPTY_FUNNEL),
    tolerate(api.getAnalyticsChannels(), { items: [] }),
    tolerate(api.getCampaignPerformanceReport(), { items: [] }),
    tolerate(api.listCampaigns({ limit: 200 }), []),
    tolerate(api.listWhatsappEvents({ limit: 500 }), []),
    tolerate(api.listRcsEvents({ limit: 500 }), []),
    tolerate(api.listEmailEvents({ limit: 500 }), []),
    tolerate(api.listWebsiteEngagementEvents({ limit: 500 }), []),
  ]);

  const campaignById = new Map(campaigns.data.map((c) => [c.id, c]));

  const campaignRows: CampaignPerformanceRow[] = campaignReport.data.items
    .map((item) => {
      const campaign = campaignById.get(item.campaign_id);
      return {
        id: item.campaign_id,
        code: item.campaign_code,
        name: item.campaign_name,
        channel: campaign?.CRM_UTM_Source ?? "unknown",
        status: campaign?.status ?? "unknown",
        startDate: campaign?.start_date ?? null,
        endDate: campaign?.end_date ?? null,
        leadCount: item.lead_count,
        convertedLeads: item.converted_leads,
        conversionPct: item.conversion_rate * 100,
      };
    })
    .sort((a, b) => b.leadCount - a.leadCount);

  const engagement: EngagementChannelTotals[] = [
    { channel: "whatsapp", rows: whatsapp.data },
    { channel: "rcs", rows: rcs.data },
    { channel: "email", rows: email.data },
    { channel: "website", rows: website.data },
  ].map(({ channel, rows }) => ({
    channel,
    events: rows.length,
    metricSum: rows.reduce((sum, row) => sum + (row.MSG_Engaged ?? 0), 0),
  }));

  return {
    overview: overview.data,
    funnel: funnel.data,
    channels: toChannelStats(channels.data.items),
    campaigns: campaignRows,
    engagement,
    issues: collectIssues(
      toIssue("analytics/overview", overview.error),
      toIssue("analytics/funnel", funnel.error),
      toIssue("analytics/channels", channels.error),
      toIssue("reports/campaign-performance", campaignReport.error),
      toIssue("campaigns", campaigns.error),
      toIssue("engagement/whatsapp", whatsapp.error),
      toIssue("engagement/rcs", rcs.error),
      toIssue("engagement/email", email.error),
      toIssue("engagement/website", website.error),
    ),
  };
}
