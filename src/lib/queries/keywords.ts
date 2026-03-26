export interface KeywordRow {
  keyword_id: number;
  keyword_text: string;
  match_type: string;
  quality_score: number | null;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  spend: number;
  cpa: number | null;
  ctr: number;
}

export interface AdGroupKeywords {
  ad_group_id: number;
  ad_group_name: string;
  keywords: KeywordRow[];
  total_spend: number;
  total_clicks: number;
  total_conversions: number;
}

export interface CampaignKeywords {
  campaign_id: number;
  campaign_name: string;
  adGroups: AdGroupKeywords[];
}

export async function getKeywords(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  dateStart: string,
  dateEnd?: string,
): Promise<CampaignKeywords[]> {
  const end = dateEnd ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .schema("ads")
    .from("v_keyword_metrics")
    .select("*")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart)
    .lte("date", end);

  if (error) console.error("getKeywords:", error);

  type ViewRow = {
    keyword_id: unknown;
    keyword_text: string;
    match_type: string;
    quality_score: number | null;
    keyword_status?: string;
    campaign_id: unknown;
    campaign_name: string;
    ad_group_id: unknown;
    ad_group_name: string;
    impressions: unknown;
    clicks: unknown;
    cost_micros: unknown;
    conversions: unknown;
  };

  // ── Aggregate by (keyword_id + campaign_id + ad_group_id) ────────────

  type AggEntry = {
    keyword_id: string;
    keyword_text: string;
    match_type: string;
    quality_score: number | null;
    campaign_id: string;
    campaign_name: string;
    ad_group_id: string;
    ad_group_name: string;
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
  };

  const aggregated = new Map<string, AggEntry>();

  (data ?? []).forEach((row: ViewRow) => {
    const key = `${String(row.keyword_id)}_${String(row.campaign_id)}_${String(row.ad_group_id)}`;
    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, {
        keyword_id: String(row.keyword_id),
        keyword_text: row.keyword_text,
        match_type: row.match_type,
        quality_score: row.quality_score,
        campaign_id: String(row.campaign_id),
        campaign_name: row.campaign_name,
        ad_group_id: String(row.ad_group_id),
        ad_group_name: row.ad_group_name,
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
        cost_micros: Number(row.cost_micros),
        conversions: Number(row.conversions),
      });
    } else {
      existing.impressions += Number(row.impressions);
      existing.clicks += Number(row.clicks);
      existing.cost_micros += Number(row.cost_micros);
      existing.conversions += Number(row.conversions);
    }
  });

  // ── Build Campaign → Ad Group → Keywords hierarchy ────────────────────

  const hierarchy = new Map<string, Map<string, KeywordRow[]>>();
  const campaignMeta = new Map<string, { campaign_name: string }>();
  const adGroupMeta = new Map<string, { ad_group_name: string }>();

  aggregated.forEach((row) => {
    const spend = row.cost_micros / 1_000_000;
    const kw: KeywordRow = {
      keyword_id: Number(row.keyword_id),
      keyword_text: row.keyword_text,
      match_type: row.match_type,
      quality_score: row.quality_score,
      impressions: row.impressions,
      clicks: row.clicks,
      cost_micros: row.cost_micros,
      conversions: row.conversions,
      spend,
      cpa: row.conversions > 0 ? spend / row.conversions : null,
      ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0,
    };

    campaignMeta.set(row.campaign_id, { campaign_name: row.campaign_name });
    adGroupMeta.set(`${row.ad_group_id}_${row.campaign_id}`, { ad_group_name: row.ad_group_name });

    if (!hierarchy.has(row.campaign_id)) hierarchy.set(row.campaign_id, new Map());
    const agMap = hierarchy.get(row.campaign_id)!;
    if (!agMap.has(row.ad_group_id)) agMap.set(row.ad_group_id, []);
    agMap.get(row.ad_group_id)!.push(kw);
  });

  // Sort keywords by clicks desc within each ad group
  hierarchy.forEach((agMap) => {
    agMap.forEach((kws) => kws.sort((a, b) => b.clicks - a.clicks));
  });

  return Array.from(hierarchy.entries()).map(([campaignId, agMap]) => ({
    campaign_id: Number(campaignId),
    campaign_name: campaignMeta.get(campaignId)?.campaign_name ?? `Campaign ${campaignId}`,
    adGroups: Array.from(agMap.entries()).map(([adGroupId, keywords]) => ({
      ad_group_id: Number(adGroupId),
      ad_group_name: adGroupMeta.get(`${adGroupId}_${campaignId}`)?.ad_group_name ?? `Ad Group ${adGroupId}`,
      keywords,
      total_spend: keywords.reduce((s, k) => s + k.spend, 0),
      total_clicks: keywords.reduce((s, k) => s + k.clicks, 0),
      total_conversions: keywords.reduce((s, k) => s + k.conversions, 0),
    })),
  }));
}
