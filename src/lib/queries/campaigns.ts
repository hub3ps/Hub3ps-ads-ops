export async function getAdCopy(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
) {
  const [{ data: ads, error }, { data: campaigns }, { data: adgroups }] =
    await Promise.all([
      supabase
        .schema("ads")
        .from("ad_copy_inventory")
        .select("*")
        .eq("external_customer_id", accountId)
        .eq("status", "ENABLED"),
      supabase
        .schema("ads")
        .from("campaign_inventory")
        .select("campaign_id, campaign_name")
        .eq("external_customer_id", accountId),
      supabase
        .schema("ads")
        .from("adgroup_inventory")
        .select("ad_group_id, ad_group_name")
        .eq("external_customer_id", accountId),
    ]);

  if (error) console.error("getAdCopy:", error);

  const campaignMap = new Map(
    (campaigns ?? []).map((c: { campaign_id: unknown; campaign_name: string }) => [String(c.campaign_id), c.campaign_name]),
  );
  const adGroupMap = new Map(
    (adgroups ?? []).map((ag: { ad_group_id: unknown; ad_group_name: string }) => [String(ag.ad_group_id), ag.ad_group_name]),
  );

  return (ads ?? []).map((ad: Record<string, unknown>) => ({
    ...ad,
    campaign_name: campaignMap.get(String(ad.campaign_id)) ?? `Campaign ${ad.campaign_id}`,
    ad_group_name: adGroupMap.get(String(ad.ad_group_id)) ?? `Ad Group ${ad.ad_group_id}`,
  }));
}

export async function getCampaigns(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  dateStart: string,
) {
  const { data: inventory } = await supabase
    .schema("ads")
    .from("campaign_inventory")
    .select("campaign_id, campaign_name, status, bidding_strategy, budget_amount")
    .eq("external_customer_id", accountId);

  const { data: metrics } = await supabase
    .schema("ads")
    .from("fact_campaign_daily")
    .select("campaign_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart);

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

export async function getAllAdGroups(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  dateStart: string,
  dateEnd?: string,
) {
  const { data: inventory } = await supabase
    .schema("ads")
    .from("adgroup_inventory")
    .select("ad_group_id, ad_group_name, campaign_id, status")
    .eq("external_customer_id", accountId);

  let metricsQuery = supabase
    .schema("ads")
    .from("fact_adgroup_daily")
    .select("ad_group_id, campaign_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart);

  if (dateEnd) metricsQuery = metricsQuery.lte("date", dateEnd);

  const { data: metrics } = await metricsQuery;

  const { data: campInv } = await supabase
    .schema("ads")
    .from("campaign_inventory")
    .select("campaign_id, campaign_name")
    .eq("external_customer_id", accountId);

  const campaignMap = new Map(
    (campInv ?? []).map((c: { campaign_id: unknown; campaign_name: string }) => [String(c.campaign_id), c.campaign_name]),
  );

  const adGroupMap = new Map(
    (inventory ?? []).map((ag: { ad_group_id: unknown; [key: string]: unknown }) => [String(ag.ad_group_id), ag]),
  );

  const aggregated = new Map<string, {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    campaign_id: string;
  }>();

  (metrics ?? []).forEach((m: { ad_group_id: unknown; campaign_id: unknown; impressions: number; clicks: number; cost_micros: number; conversions: number }) => {
    const key = String(m.ad_group_id);
    const existing = aggregated.get(key) ?? {
      impressions: 0,
      clicks: 0,
      cost_micros: 0,
      conversions: 0,
      campaign_id: String(m.campaign_id),
    };
    existing.impressions += Number(m.impressions);
    existing.clicks += Number(m.clicks);
    existing.cost_micros += Number(m.cost_micros);
    existing.conversions += Number(m.conversions);
    aggregated.set(key, existing);
  });

  return Array.from(aggregated.entries()).map(([id, m]) => ({
    ...adGroupMap.get(id),
    ...m,
    campaign_name: campaignMap.get(m.campaign_id) ?? `Campaign ${m.campaign_id}`,
    spend: m.cost_micros / 1_000_000,
    cpa: m.conversions > 0 ? m.cost_micros / 1_000_000 / m.conversions : null,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  }));
}

export async function getAdGroups(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  campaignId: number,
  dateStart: string,
) {
  const { data: inventory } = await supabase
    .schema("ads")
    .from("adgroup_inventory")
    .select("ad_group_id, ad_group_name, status")
    .eq("external_customer_id", accountId)
    .eq("campaign_id", campaignId);

  const { data: metrics } = await supabase
    .schema("ads")
    .from("fact_adgroup_daily")
    .select("ad_group_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .eq("campaign_id", campaignId)
    .gte("date", dateStart);

  const adGroupMap = new Map(
    (inventory ?? []).map((ag: { ad_group_id: unknown; [key: string]: unknown }) => [String(ag.ad_group_id), ag]),
  );
  const aggregated = new Map<string, {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
  }>();

  (metrics ?? []).forEach((m: { ad_group_id: unknown; impressions: number; clicks: number; cost_micros: number; conversions: number }) => {
    const key = String(m.ad_group_id);
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
    ...adGroupMap.get(id),
    ...m,
    spend: m.cost_micros / 1_000_000,
    cpa: m.conversions > 0 ? m.cost_micros / 1_000_000 / m.conversions : null,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  }));
}
