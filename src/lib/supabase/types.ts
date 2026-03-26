// Generated types placeholder — regenerate via: npx supabase gen types typescript
// supabase gen types typescript --project-id jxhtzkzmhbxxnlaiywew > src/lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  ads: {
    Tables: {
      fact_campaign_daily: {
        Row: {
          external_customer_id: number;
          date: string;
          campaign_id: number;
          impressions: number;
          clicks: number;
          cost_micros: number;
          conversions: number;
        };
      };
      fact_adgroup_daily: {
        Row: {
          external_customer_id: number;
          date: string;
          campaign_id: number;
          ad_group_id: number;
          impressions: number;
          clicks: number;
          cost_micros: number;
          conversions: number;
        };
      };
      fact_keyword_daily: {
        Row: {
          external_customer_id: number;
          date: string;
          campaign_id: number;
          ad_group_id: number;
          keyword_id: number;
          impressions: number;
          clicks: number;
          cost_micros: number;
          conversions: number;
        };
      };
      fact_hourly_campaign_window: {
        Row: {
          external_customer_id: number;
          window_label: string;
          campaign_id: number;
          hour_of_day: number;
          day_of_week: number;
          impressions: number;
          clicks: number;
          cost_micros: number;
          conversions: number;
        };
      };
      fact_geo_performance_window: {
        Row: {
          external_customer_id: number;
          window_label: string;
          campaign_id: number;
          geo_id: number;
          impressions: number;
          clicks: number;
          cost_micros: number;
          conversions: number;
        };
      };
      fact_auction_insights_window: {
        Row: {
          external_customer_id: number;
          window_label: string;
          campaign_id: number;
          impression_share: number | null;
          overlap_rate: number | null;
          outranking_share: number | null;
          domain: string | null;
        };
      };
      campaign_inventory: {
        Row: {
          id: string;
          external_customer_id: number;
          campaign_id: number;
          campaign_name: string;
          status: string;
          bidding_strategy: string | null;
          budget_amount: number | null;
        };
      };
      adgroup_inventory: {
        Row: {
          id: string;
          external_customer_id: number;
          campaign_id: number;
          ad_group_id: number;
          ad_group_name: string;
          status: string;
        };
      };
      keyword_inventory: {
        Row: {
          external_customer_id: number;
          campaign_id: number;
          ad_group_id: number;
          keyword_id: number;
          keyword_text: string;
          match_type: string;
          quality_score: number | null;
          status: string;
        };
      };
      optimization_log: {
        Row: {
          id: number;
          external_customer_id: number;
          category: string;
          description: string;
          status: string;
          executed_at: string;
          campaign_id: number | null;
          notes: string | null;
        };
      };
    };
  };
}
