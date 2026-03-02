# Hub3ps Ads Ops — Schema Supabase (schema `ads`)

**Gerado em:** 2026-02-20
**Total:** 25 tabelas | 291 colunas | 391 constraints | 55 indexes | 2 functions

---

## Sumário

### Cadastro / Configuração
- `clients` (7 colunas)
- `gads_accounts` (10 colunas)
- `documents` (7 colunas)
- `conversion_actions_contract` (11 colunas)
- `intent_routing` (9 colunas)
- `negatives_sets` (9 colunas)
- `negatives_items` (5 colunas)
- `policy_issues` (10 colunas)
- `saved_queries` (8 colunas)

### Inventário (Espelho Google Ads)
- `campaign_inventory` (16 colunas)
- `adgroup_inventory` (11 colunas)
- `keyword_inventory` (18 colunas)
- `ad_copy_inventory` (14 colunas)

### Métricas (Fact Tables)
- `fact_campaign_daily` (15 colunas)
- `fact_adgroup_daily` (12 colunas)
- `fact_keyword_daily` (11 colunas)
- `fact_search_terms_window` (15 colunas)
- `fact_conversions_by_action_window` (12 colunas)
- `fact_auction_insights_window` (17 colunas)
- `fact_geo_performance_window` (15 colunas)
- `fact_hourly_campaign_window` (12 colunas)

### IA / Histórico
- `analysis_runs` (7 colunas)
- `recommendations` (14 colunas)
- `change_log` (13 colunas)
- `optimization_log` (13 colunas)

---

## Cadastro / Configuração

### `clients`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `name` | text | NO |  |  |
| 3 | `country` | text | YES |  |  |
| 4 | `timezone` | text | NO | 'Pacific/Auckland'::text |  |
| 5 | `currency` | text | NO | 'NZD'::text |  |
| 6 | `created_at` | timestamp with time zone | NO | now() |  |
| 7 | `updated_at` | timestamp with time zone | NO | now() |  |

---

### `gads_accounts`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `client_id` | uuid | NO |  | FK → `clients.id` |
| 3 | `external_customer_id` | bigint | NO |  | UNIQUE |
| 4 | `customer_id_formatted` | text | YES |  |  |
| 5 | `account_name` | text | YES |  |  |
| 6 | `timezone` | text | NO | 'Pacific/Auckland'::text |  |
| 7 | `currency` | text | NO | 'NZD'::text |  |
| 8 | `is_active` | boolean | NO | true |  |
| 9 | `created_at` | timestamp with time zone | NO | now() |  |
| 10 | `updated_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_gads_accounts_client`: `CREATE INDEX idx_gads_accounts_client ON ads.gads_accounts USING btree (client_id)`

---

### `documents`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `client_id` | uuid | NO |  | FK → `clients.id` |
| 3 | `doc_key` | text | NO |  |  |
| 4 | `version` | text | NO | 'v1'::text |  |
| 5 | `content_md` | text | NO |  |  |
| 6 | `created_at` | timestamp with time zone | NO | now() |  |
| 7 | `updated_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(version, client_id, doc_key)`

**Indexes adicionais:**
- `idx_documents_client_key`: `CREATE INDEX idx_documents_client_key ON ads.documents USING btree (client_id, doc_key)`

---

### `conversion_actions_contract`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `action_name` | text | NO |  |  |
| 4 | `is_primary` | boolean | NO | true |  |
| 5 | `include_in_conversions` | boolean | NO | true |  |
| 6 | `counting` | text | YES |  |  |
| 7 | `attribution_model` | text | YES |  |  |
| 8 | `lookback_window_days` | integer | YES |  |  |
| 9 | `notes` | text | YES |  |  |
| 10 | `created_at` | timestamp with time zone | NO | now() |  |
| 11 | `updated_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(external_customer_id, action_name)`

**Indexes adicionais:**
- `idx_conv_contract_account`: `CREATE INDEX idx_conv_contract_account ON ads.conversion_actions_contract USING btree (external_customer_id)`
- `ux_conversion_actions_contract`: `CREATE UNIQUE INDEX ux_conversion_actions_contract ON ads.conversion_actions_contract USING btree (external_customer_id, action_name)`

---

### `intent_routing`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `campaign_id` | bigint | YES |  |  |
| 4 | `ad_group_id` | bigint | YES |  |  |
| 5 | `intent_label` | text | NO |  |  |
| 6 | `landing_url` | text | NO |  |  |
| 7 | `notes` | text | YES |  |  |
| 8 | `created_at` | timestamp with time zone | NO | now() |  |
| 9 | `updated_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_intent_routing_lookup`: `CREATE INDEX idx_intent_routing_lookup ON ads.intent_routing USING btree (external_customer_id, campaign_id, ad_group_id)`

---

### `negatives_sets`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `scope` | text | NO |  |  |
| 4 | `scope_id` | bigint | YES |  |  |
| 5 | `version` | text | NO |  |  |
| 6 | `source_ref` | text | YES |  |  |
| 7 | `total_entries` | integer | YES |  |  |
| 8 | `summary` | jsonb | YES |  |  |
| 9 | `created_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(external_customer_id, scope, scope_id, version)`

**Indexes adicionais:**
- `idx_neg_sets_account`: `CREATE INDEX idx_neg_sets_account ON ads.negatives_sets USING btree (external_customer_id)`

---

### `negatives_items`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `negatives_set_id` | uuid | NO |  | FK → `negatives_sets.id` |
| 3 | `negative_text` | text | NO |  |  |
| 4 | `match_type` | text | YES |  |  |
| 5 | `created_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_neg_items_set`: `CREATE INDEX idx_neg_items_set ON ads.negatives_items USING btree (negatives_set_id)`

---

### `policy_issues`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `entity_level` | text | NO |  |  |
| 4 | `entity_id` | text | NO |  |  |
| 5 | `reason` | text | YES |  |  |
| 6 | `policy_status` | text | YES |  |  |
| 7 | `first_seen` | date | YES |  |  |
| 8 | `last_seen` | date | YES |  |  |
| 9 | `created_at` | timestamp with time zone | NO | now() |  |
| 10 | `updated_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(entity_level, reason, external_customer_id, entity_id)`

**Indexes adicionais:**
- `idx_policy_account`: `CREATE INDEX idx_policy_account ON ads.policy_issues USING btree (external_customer_id)`

---

### `saved_queries`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `name` | text | NO |  | UNIQUE |
| 3 | `description` | text | YES |  |  |
| 4 | `query_sql` | text | NO |  |  |
| 5 | `default_window` | text | YES |  |  |
| 6 | `is_active` | boolean | NO | true |  |
| 7 | `created_at` | timestamp with time zone | NO | now() |  |
| 8 | `updated_at` | timestamp with time zone | NO | now() |  |

---

## Inventário (Espelho Google Ads)

### `campaign_inventory`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `campaign_id` | bigint | NO |  |  |
| 4 | `campaign_name` | text | NO |  |  |
| 5 | `campaign_type` | text | YES |  |  |
| 6 | `status` | text | YES |  |  |
| 7 | `bidding_strategy` | text | YES |  |  |
| 8 | `budget_amount` | numeric | YES |  |  |
| 9 | `has_search` | boolean | YES |  |  |
| 10 | `has_search_partners` | boolean | YES |  |  |
| 11 | `has_display` | boolean | YES |  |  |
| 12 | `geo_mode` | text | YES |  |  |
| 13 | `ad_schedule` | jsonb | YES |  |  |
| 14 | `settings` | jsonb | YES |  |  |
| 15 | `created_at` | timestamp with time zone | NO | now() |  |
| 16 | `updated_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(external_customer_id, campaign_id)`

**Indexes adicionais:**
- `idx_campaign_inventory_account`: `CREATE INDEX idx_campaign_inventory_account ON ads.campaign_inventory USING btree (external_customer_id)`

---

### `adgroup_inventory`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `campaign_id` | bigint | NO |  |  |
| 4 | `ad_group_id` | bigint | NO |  |  |
| 5 | `ad_group_name` | text | NO |  |  |
| 6 | `status` | text | YES |  |  |
| 7 | `cpa_target_desired` | numeric | YES |  |  |
| 8 | `final_url` | text | YES |  |  |
| 9 | `settings` | jsonb | YES |  |  |
| 10 | `created_at` | timestamp with time zone | NO | now() |  |
| 11 | `updated_at` | timestamp with time zone | NO | now() |  |

**Unique compostos:**
- `(ad_group_id, external_customer_id)`

**Indexes adicionais:**
- `idx_adgroup_inventory_account`: `CREATE INDEX idx_adgroup_inventory_account ON ads.adgroup_inventory USING btree (external_customer_id)`
- `idx_adgroup_inventory_campaign`: `CREATE INDEX idx_adgroup_inventory_campaign ON ads.adgroup_inventory USING btree (external_customer_id, campaign_id)`

---

### `keyword_inventory`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 2 | `campaign_id` | bigint | NO |  |  |
| 3 | `ad_group_id` | bigint | NO |  |  |
| 4 | `keyword_id` | bigint | NO |  |  |
| 5 | `keyword_text` | text | NO |  |  |
| 6 | `match_type` | text | NO |  |  |
| 7 | `status` | text | NO |  |  |
| 8 | `effective_cpc_bid_micros` | bigint | YES |  |  |
| 9 | `quality_score` | integer | YES |  |  |
| 10 | `ad_relevance` | text | YES |  |  |
| 11 | `landing_page_experience` | text | YES |  |  |
| 12 | `expected_ctr` | text | YES |  |  |
| 13 | `first_page_cpc_micros` | bigint | YES |  |  |
| 14 | `top_of_page_cpc_micros` | bigint | YES |  |  |
| 15 | `first_position_cpc_micros` | bigint | YES |  |  |
| 16 | `snapshot_date` | date | NO |  |  |
| 17 | `created_at` | timestamp with time zone | YES | now() |  |
| 18 | `updated_at` | timestamp with time zone | YES | now() |  |

**Unique compostos:**
- `(external_customer_id, ad_group_id, keyword_id)`

---

### `ad_copy_inventory`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 2 | `campaign_id` | bigint | NO |  |  |
| 3 | `ad_group_id` | bigint | NO |  |  |
| 4 | `ad_id` | bigint | NO |  |  |
| 5 | `ad_type` | text | NO |  |  |
| 6 | `status` | text | NO |  |  |
| 7 | `ad_strength` | text | YES |  |  |
| 8 | `headlines_raw` | text | YES |  |  |
| 9 | `descriptions_raw` | text | YES |  |  |
| 10 | `path1` | text | YES |  |  |
| 11 | `path2` | text | YES |  |  |
| 12 | `final_urls` | text | YES |  |  |
| 13 | `snapshot_date` | date | NO |  |  |
| 14 | `created_at` | timestamp with time zone | YES | now() |  |

**Unique compostos:**
- `(external_customer_id, ad_group_id, ad_id)`

---

## Métricas (Fact Tables)

### `fact_campaign_daily`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 2 | `date` | date | NO |  | 🔑 PK |
| 3 | `campaign_id` | bigint | NO |  | 🔑 PK |
| 4 | `impressions` | bigint | YES |  |  |
| 5 | `clicks` | bigint | YES |  |  |
| 6 | `cost_micros` | bigint | YES |  |  |
| 7 | `conversions` | numeric | YES |  |  |
| 8 | `all_conversions` | numeric | YES |  |  |
| 9 | `invalid_clicks` | bigint | YES |  |  |
| 10 | `search_impr_share` | numeric | YES |  |  |
| 11 | `search_lost_is_budget` | numeric | YES |  |  |
| 12 | `search_lost_is_rank` | numeric | YES |  |  |
| 13 | `search_top_is` | numeric | YES |  |  |
| 14 | `search_abs_top_is` | numeric | YES |  |  |
| 15 | `created_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_fact_campaign_daily_date`: `CREATE INDEX idx_fact_campaign_daily_date ON ads.fact_campaign_daily USING btree (date)`

---

### `fact_adgroup_daily`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 2 | `date` | date | NO |  | 🔑 PK |
| 3 | `campaign_id` | bigint | NO |  |  |
| 4 | `ad_group_id` | bigint | NO |  | 🔑 PK |
| 5 | `impressions` | bigint | YES |  |  |
| 6 | `clicks` | bigint | YES |  |  |
| 7 | `cost_micros` | bigint | YES |  |  |
| 8 | `conversions` | numeric | YES |  |  |
| 9 | `all_conversions` | numeric | YES |  |  |
| 10 | `invalid_clicks` | bigint | YES |  |  |
| 11 | `created_at` | timestamp with time zone | NO | now() |  |
| 12 | `updated_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_fact_adgroup_daily_campaign`: `CREATE INDEX idx_fact_adgroup_daily_campaign ON ads.fact_adgroup_daily USING btree (external_customer_id, campaign_id)`
- `idx_fact_adgroup_daily_date`: `CREATE INDEX idx_fact_adgroup_daily_date ON ads.fact_adgroup_daily USING btree (date)`

---

### `fact_keyword_daily`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 2 | `date` | date | NO |  |  |
| 3 | `campaign_id` | bigint | NO |  |  |
| 4 | `ad_group_id` | bigint | NO |  |  |
| 5 | `keyword_id` | bigint | NO |  |  |
| 6 | `impressions` | bigint | YES |  |  |
| 7 | `clicks` | bigint | YES |  |  |
| 8 | `cost_micros` | bigint | YES |  |  |
| 9 | `conversions` | numeric | YES |  |  |
| 10 | `created_at` | timestamp with time zone | YES | now() |  |
| 11 | `updated_at` | timestamp with time zone | YES | now() |  |

**Unique compostos:**
- `(external_customer_id, date, keyword_id)`

---

### `fact_search_terms_window`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 2 | `window_label` | text | NO |  | 🔑 PK |
| 3 | `date_start` | date | NO |  | 🔑 PK |
| 4 | `date_end` | date | NO |  | 🔑 PK |
| 5 | `campaign_id` | bigint | NO | 0 | 🔑 PK |
| 6 | `ad_group_id` | bigint | NO | 0 | 🔑 PK |
| 7 | `search_term` | text | NO |  | 🔑 PK |
| 8 | `matched_keyword` | text | YES |  |  |
| 9 | `impressions` | bigint | YES |  |  |
| 10 | `clicks` | bigint | YES |  |  |
| 11 | `cost_micros` | bigint | YES |  |  |
| 12 | `conversions` | numeric | YES |  |  |
| 13 | `created_at` | timestamp with time zone | NO | now() |  |
| 14 | `match_type` | text | NO |  | 🔑 PK |
| 15 | `keyword_criterion_id` | bigint | NO |  | 🔑 PK |

**Indexes adicionais:**
- `idx_stw_lookup`: `CREATE INDEX idx_stw_lookup ON ads.fact_search_terms_window USING btree (external_customer_id, window_label, date_start, date_end)`

---

### `fact_conversions_by_action_window`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 2 | `window_label` | text | NO |  | 🔑 PK |
| 3 | `date_start` | date | NO |  | 🔑 PK |
| 4 | `date_end` | date | NO |  | 🔑 PK |
| 5 | `campaign_id` | bigint | NO | 0 | 🔑 PK |
| 6 | `ad_group_id` | bigint | YES | 0 |  |
| 7 | `action_name` | text | NO |  | 🔑 PK |
| 8 | `conversions` | numeric | YES |  |  |
| 9 | `cost_micros` | bigint | YES |  |  |
| 10 | `created_at` | timestamp with time zone | NO | now() |  |
| 11 | `conversions_value` | numeric | YES |  |  |
| 12 | `ad_group_id_norm` | bigint | NO |  | 🔑 PK |

**Indexes adicionais:**
- `idx_caw_lookup`: `CREATE INDEX idx_caw_lookup ON ads.fact_conversions_by_action_window USING btree (external_customer_id, window_label, date_start, date_end)`

---

### `fact_auction_insights_window`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 2 | `window_label` | text | NO |  | 🔑 PK |
| 3 | `date_start` | date | NO |  | 🔑 PK |
| 4 | `date_end` | date | NO |  | 🔑 PK |
| 5 | `campaign_id` | bigint | NO |  | 🔑 PK |
| 12 | `created_at` | timestamp with time zone | NO | now() |  |
| 13 | `search_exact_match_is` | numeric | YES |  |  |
| 14 | `search_budget_lost_top_is` | numeric | YES |  |  |
| 15 | `search_budget_lost_abs_top_is` | numeric | YES |  |  |
| 16 | `search_rank_lost_top_is` | numeric | YES |  |  |
| 17 | `search_rank_lost_abs_top_is` | numeric | YES |  |  |
| 18 | `updated_at` | timestamp with time zone | YES | now() |  |
| 19 | `search_impr_share` | numeric | YES |  |  |
| 20 | `search_lost_is_budget` | numeric | YES |  |  |
| 21 | `search_lost_is_rank` | numeric | YES |  |  |
| 22 | `search_top_is` | numeric | YES |  |  |
| 23 | `search_abs_top_is` | numeric | YES |  |  |

**Indexes adicionais:**
- `idx_aiw_lookup`: `CREATE INDEX idx_aiw_lookup ON ads.fact_auction_insights_window USING btree (external_customer_id, window_label, date_start, date_end)`

---

### `fact_geo_performance_window`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `window_label` | text | NO |  | 🔑 PK |
| 2 | `date_start` | date | NO |  | 🔑 PK |
| 3 | `date_end` | date | NO |  | 🔑 PK |
| 4 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 5 | `campaign_id` | bigint | NO |  | 🔑 PK |
| 6 | `geo_id` | bigint | NO |  | 🔑 PK |
| 7 | `location_name` | text | YES |  |  |
| 8 | `canonical_name` | text | YES |  |  |
| 9 | `location_type` | text | YES |  |  |
| 10 | `user_location_type` | text | NO |  | 🔑 PK |
| 11 | `impressions` | bigint | YES |  |  |
| 12 | `clicks` | bigint | YES |  |  |
| 13 | `cost_micros` | bigint | YES |  |  |
| 14 | `conversions` | numeric | YES |  |  |
| 15 | `created_at` | timestamp with time zone | YES | now() |  |

---

### `fact_hourly_campaign_window`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `window_label` | text | NO |  | 🔑 PK |
| 2 | `date_start` | date | NO |  | 🔑 PK |
| 3 | `date_end` | date | NO |  | 🔑 PK |
| 4 | `external_customer_id` | bigint | NO |  | 🔑 PK, FK → `gads_accounts.external_customer_id` |
| 5 | `campaign_id` | bigint | NO |  | 🔑 PK |
| 6 | `hour_of_day` | integer | NO |  | 🔑 PK |
| 7 | `day_of_week` | text | NO |  | 🔑 PK |
| 8 | `impressions` | bigint | YES |  |  |
| 9 | `clicks` | bigint | YES |  |  |
| 10 | `cost_micros` | bigint | YES |  |  |
| 11 | `conversions` | numeric | YES |  |  |
| 12 | `created_at` | timestamp with time zone | YES | now() |  |

---

## IA / Histórico

### `analysis_runs`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `window_label` | text | YES |  |  |
| 4 | `date_start` | date | YES |  |  |
| 5 | `date_end` | date | YES |  |  |
| 6 | `notes` | text | YES |  |  |
| 7 | `created_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_runs_account`: `CREATE INDEX idx_runs_account ON ads.analysis_runs USING btree (external_customer_id)`

---

### `recommendations`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `run_id` | uuid | NO |  | FK → `analysis_runs.id` |
| 3 | `entity_level` | text | NO |  |  |
| 4 | `entity_key` | text | YES |  |  |
| 5 | `title` | text | NO |  |  |
| 6 | `rationale` | text | YES |  |  |
| 7 | `action_type` | text | NO |  |  |
| 8 | `proposed_change` | jsonb | NO |  |  |
| 9 | `expected_impact` | text | YES |  |  |
| 10 | `priority` | integer | NO | 3 |  |
| 11 | `status` | text | NO | 'PROPOSED'::text |  |
| 12 | `approved_at` | timestamp with time zone | YES |  |  |
| 13 | `implemented_at` | timestamp with time zone | YES |  |  |
| 14 | `created_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_recos_status`: `CREATE INDEX idx_recos_status ON ads.recommendations USING btree (status)`

---

### `change_log`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | uuid | NO | gen_random_uuid() | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `change_id` | text | YES |  |  |
| 4 | `change_type` | text | YES |  |  |
| 5 | `scope` | text | YES |  |  |
| 6 | `scope_key` | text | YES |  |  |
| 7 | `before_state` | jsonb | YES |  |  |
| 8 | `after_state` | jsonb | YES |  |  |
| 9 | `reason` | text | YES |  |  |
| 10 | `expectation` | text | YES |  |  |
| 11 | `status` | text | YES |  |  |
| 12 | `evidence_ref` | text | YES |  |  |
| 13 | `changed_at` | timestamp with time zone | NO | now() |  |

**Indexes adicionais:**
- `idx_change_log_account_time`: `CREATE INDEX idx_change_log_account_time ON ads.change_log USING btree (external_customer_id, changed_at)`

---

### `optimization_log`

| # | Coluna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|---|
| 1 | `id` | integer | NO | nextval('ads.optimization_log_id_seq'::regclass) | 🔑 PK |
| 2 | `external_customer_id` | bigint | NO |  | FK → `gads_accounts.external_customer_id` |
| 3 | `executed_at` | date | NO | CURRENT_DATE |  |
| 4 | `status` | text | NO | 'DONE'::text |  |
| 5 | `category` | text | NO |  |  |
| 6 | `scope` | text | NO |  |  |
| 7 | `scope_detail` | text | YES |  |  |
| 8 | `action_summary` | text | NO |  |  |
| 9 | `details` | jsonb | YES |  |  |
| 10 | `skip_reason` | text | YES |  |  |
| 11 | `source` | text | NO | 'ai_recommendation'::text |  |
| 12 | `analysis_date` | date | YES |  |  |
| 13 | `created_at` | timestamp with time zone | YES | now() |  |

**Indexes adicionais:**
- `idx_optlog_account_date`: `CREATE INDEX idx_optlog_account_date ON ads.optimization_log USING btree (external_customer_id, executed_at)`
- `idx_optlog_status`: `CREATE INDEX idx_optlog_status ON ads.optimization_log USING btree (external_customer_id, status)`

---

## Functions

### `build_analysis_payload`
- Tipo: FUNCTION
- Retorno: jsonb

### `touch_updated_at`
- Tipo: FUNCTION
- Retorno: trigger

---

*hub3ps-ads-ops • Schema Supabase • Fevereiro 2026*