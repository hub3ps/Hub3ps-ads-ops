export async function getOverviewData(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  dateStart: string,
  dateEnd: string,
) {
  const { data: daily, error: dailyError } = await supabase
    .schema("ads")
    .from("fact_campaign_daily")
    .select("date, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart)
    .lte("date", dateEnd)
    .order("date", { ascending: true });

  const { data: optimizations, error: optError } = await supabase
    .schema("ads")
    .from("optimization_log")
    .select("id, category, action_summary, client_title, client_impact, scope_detail, status, executed_at, details")
    .eq("external_customer_id", accountId)
    .in("status", ["DONE", "MONITORING"])
    .gte("executed_at", dateStart)
    .lte("executed_at", dateEnd + "T23:59:59")
    .order("executed_at", { ascending: false })
    .limit(10);

  if (dailyError) console.error("getOverviewData daily:", dailyError);
  if (optError) console.error("getOverviewData optimizations:", optError);

  return { daily: daily ?? [], optimizations: optimizations ?? [] };
}

export async function getCampaignBreakdown(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  dateStart: string,
  dateEnd?: string,
) {
  const { data: inventory } = await supabase
    .schema("ads")
    .from("campaign_inventory")
    .select("campaign_id, campaign_name, status, bidding_strategy, budget_amount")
    .eq("external_customer_id", accountId)
    .eq("status", "ENABLED");

  let metricsQuery = supabase
    .schema("ads")
    .from("fact_campaign_daily")
    .select("campaign_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart);

  if (dateEnd) metricsQuery = metricsQuery.lte("date", dateEnd);

  const { data: metrics } = await metricsQuery;

  const campaignMap = new Map(
    (inventory ?? []).map((c: { campaign_id: unknown; [key: string]: unknown }) => [String(c.campaign_id), c]),
  );
  const aggregated = new Map<string, {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
  }>();

  (metrics ?? []).forEach((m: { campaign_id: unknown; impressions: number; clicks: number; cost_micros: number; conversions: number }) => {
    const key = String(m.campaign_id);
    const existing = aggregated.get(key) ?? {
      impressions: 0,
      clicks: 0,
      cost_micros: 0,
      conversions: 0,
    };
    existing.impressions += Number(m.impressions);
    existing.clicks += Number(m.clicks);
    existing.cost_micros += Number(m.cost_micros);
    existing.conversions += Number(m.conversions);
    aggregated.set(key, existing);
  });

  return Array.from(aggregated.entries()).map(([id, m]) => ({
    ...campaignMap.get(id),
    ...m,
    spend: m.cost_micros / 1_000_000,
    cpa: m.conversions > 0 ? m.cost_micros / 1_000_000 / m.conversions : null,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  }));
}
