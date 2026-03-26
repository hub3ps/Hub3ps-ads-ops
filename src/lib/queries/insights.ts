export async function getHourlyData(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  windowLabel: string = "last_30d",
) {
  const { data, error } = await supabase
    .schema("ads")
    .from("fact_hourly_campaign_window")
    .select("hour_of_day, day_of_week, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .eq("window_label", windowLabel);

  if (error) console.error("getHourlyData:", error);
  return data ?? [];
}

export async function getGeoData(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  windowLabel: string = "last_30d",
) {
  const { data, error } = await supabase
    .schema("ads")
    .from("fact_geo_performance_window")
    .select("geo_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .eq("window_label", windowLabel);

  if (error) console.error("getGeoData:", error);
  return data ?? [];
}

export async function getAuctionInsights(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
  windowLabel: string = "last_30d",
) {
  const { data, error } = await supabase
    .schema("ads")
    .from("fact_auction_insights_window")
    .select("campaign_id, impression_share, overlap_rate, outranking_share, domain")
    .eq("external_customer_id", accountId)
    .eq("window_label", windowLabel);

  if (error) console.error("getAuctionInsights:", error);
  return data ?? [];
}
