import type { SupabaseClient } from "@supabase/supabase-js";

export interface PortfolioCampaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  cpa: number | null;
}

export interface PortfolioClinic {
  client_id: string;
  account_name: string;
  external_customer_id: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  cpa: number | null;
  campaigns: PortfolioCampaign[];
}

export async function getPortfolioData(
  supabase: SupabaseClient,
  accountIds: number[],
  dateStart: string,
  dateEnd: string,
): Promise<PortfolioClinic[]> {
  if (!accountIds.length) return [];

  // Fetch daily metrics for all accounts in range
  const { data: rows } = await supabase
    .schema("ads")
    .from("fact_campaign_daily")
    .select(
      "external_customer_id, campaign_id, impressions, clicks, cost_micros, conversions",
    )
    .in("external_customer_id", accountIds)
    .gte("date", dateStart)
    .lte("date", dateEnd);

  // Fetch campaign names from inventory
  const { data: inventory } = await supabase
    .schema("ads")
    .from("campaign_inventory")
    .select("external_customer_id, campaign_id, campaign_name, status")
    .in("external_customer_id", accountIds);

  // Fetch account names
  const { data: accounts } = await supabase
    .schema("ads")
    .from("gads_accounts")
    .select("external_customer_id, account_name, client_id")
    .in("external_customer_id", accountIds);

  if (!rows || !accounts) return [];

  // Build lookup maps
  const campaignMap = new Map<string, { name: string; status: string }>();
  for (const inv of inventory ?? []) {
    const key = `${inv.external_customer_id}__${inv.campaign_id}`;
    campaignMap.set(key, { name: inv.campaign_name ?? "Unknown", status: inv.status ?? "" });
  }

  const accountMap = new Map<
    number,
    { account_name: string; client_id: string }
  >();
  for (const acc of accounts) {
    accountMap.set(Number(acc.external_customer_id), {
      account_name: acc.account_name ?? String(acc.external_customer_id),
      client_id: acc.client_id,
    });
  }

  // Aggregate: clinic → campaign
  type CampaignAgg = {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
  };
  type ClinicAgg = {
    campaigns: Map<string, CampaignAgg & { name: string; status: string }>;
  };

  const clinicAgg = new Map<number, ClinicAgg>();

  for (const row of rows) {
    const accId = Number(row.external_customer_id);
    const campKey = `${row.external_customer_id}__${row.campaign_id}`;
    const campInfo = campaignMap.get(campKey) ?? { name: "Unknown", status: "" };

    if (!clinicAgg.has(accId)) {
      clinicAgg.set(accId, { campaigns: new Map() });
    }
    const clinic = clinicAgg.get(accId)!;

    if (!clinic.campaigns.has(campKey)) {
      clinic.campaigns.set(campKey, {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        name: campInfo.name,
        status: campInfo.status,
      });
    }
    const camp = clinic.campaigns.get(campKey)!;
    camp.impressions += Number(row.impressions ?? 0);
    camp.clicks += Number(row.clicks ?? 0);
    camp.cost += Number(row.cost_micros ?? 0) / 1_000_000;
    camp.conversions += Number(row.conversions ?? 0);
  }

  // Build result array
  const result: PortfolioClinic[] = [];

  for (const [accId, clinic] of clinicAgg) {
    const accInfo = accountMap.get(accId);
    if (!accInfo) continue;

    const campaigns: PortfolioCampaign[] = [];
    let totalImp = 0, totalClicks = 0, totalCost = 0, totalConv = 0;

    for (const [campKey, camp] of clinic.campaigns) {
      const campaignId = campKey.split("__")[1];
      totalImp += camp.impressions;
      totalClicks += camp.clicks;
      totalCost += camp.cost;
      totalConv += camp.conversions;

      campaigns.push({
        campaign_id: campaignId,
        campaign_name: camp.name,
        status: camp.status,
        impressions: camp.impressions,
        clicks: camp.clicks,
        cost: camp.cost,
        conversions: camp.conversions,
        cpa: camp.conversions > 0 ? camp.cost / camp.conversions : null,
      });
    }

    // Sort campaigns by spend desc
    campaigns.sort((a, b) => b.cost - a.cost);

    result.push({
      client_id: accInfo.client_id,
      account_name: accInfo.account_name,
      external_customer_id: accId,
      impressions: totalImp,
      clicks: totalClicks,
      cost: totalCost,
      conversions: totalConv,
      cpa: totalConv > 0 ? totalCost / totalConv : null,
      campaigns,
    });
  }

  // Sort clinics by spend desc
  result.sort((a, b) => b.cost - a.cost);

  return result;
}
