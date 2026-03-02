# Hub3ps Ads Ops — Schema BigQuery

**Gerado em:** 2026-02-20 | **Verificado:** SQL extraído direto do INFORMATION_SCHEMA.VIEWS + TABLES
**Projeto GCP:** `gothic-well-487118-r1` (Project Number: `615589107578`)
**Dataset:** `Importacao_MCC_Producao`
**Região:** `southamerica-east1` (São Paulo)
**MCC ID:** 2135330960
**Contagem:** 10 canon views + 88 views auto-geradas + ~100 tabelas base `p_ads_*` + 1 tabela referência

---

## 1. Infraestrutura

### 1.1 Transferências de Dados (Data Transfer Service)

| Nome | Origem | Destino | Frequência | Status |
|---|---|---|---|---|
| `Importacao_MCC_AuctionInsights_GAQL_Diaria` | Google Ads (GAQL customizado) | `Importacao_MCC_Producao` | Every 24h | ✅ Ativo |
| `Importacao_MCC_Producao` | Google Ads (padrão) | `Importacao_MCC_Producao` | Every 24h | ✅ Ativo |
| `Importacao_Diaria_GoogleAds` | Google Ads | `google_ads_raw` | Every 24h | ⛔ Inativo (legado) |

### 1.2 Datasets

| Dataset | Região | Uso |
|---|---|---|
| `Importacao_MCC_Producao` | southamerica-east1 | **Produção** — tabelas brutas + views canon |
| `google_ads_raw` | southamerica-east1 | Legado (transferência desativada) |

### 1.3 Convenção de Nomes

| Padrão | Tipo | Exemplo |
|---|---|---|
| `p_ads_{Report}_{MCC_ID}` | Tabela base (particionada por `_PARTITIONTIME`) | `p_ads_CampaignBasicStats_2135330960` |
| `ads_{Report}_{MCC_ID}` | View auto-gerada (adiciona `_LATEST_DATE` e `_DATA_DATE`) | `ads_CampaignBasicStats_2135330960` |
| `canon_{nome}` | View customizada (nosso código) | `canon_campaign_daily` |
| `ref_{nome}` | Tabela de referência (upload manual) | `ref_geo_target_constants` |
| `p_ads_gaql_{nome}_{MCC_ID}` | Tabela GAQL customizada (via Data Transfer) | `p_ads_gaql_campaign_is_daily_2135330960` |

### 1.4 Padrão das Views Auto-Geradas

Todas as ~100 views `ads_*` seguem o mesmo template:

```sql
SELECT *, 
  DATE('2026-02-18') AS _LATEST_DATE, 
  DATE(_PARTITIONTIME) AS _DATA_DATE 
FROM `615589107578.Importacao_MCC_Producao.p_ads_{Report}_2135330960`
```

- `_LATEST_DATE`: data da partição mais recente (atualizada automaticamente pelo Data Transfer)
- `_DATA_DATE`: data da partição de cada registro
- `615589107578` é o project number interno do GCP (equivale a `gothic-well-487118-r1`)

---

## 2. Canon Views (Customizadas)

Estas são as views que o n8n consulta para alimentar o Supabase. Todas seguem a **regra de âncora temporal**: usam `MAX(date)` da própria tabela fonte em vez de `CURRENT_DATE()`.

### 2.1 `canon_campaign_daily`

**Fonte:** `ads_CampaignBasicStats_2135330960`
**Destino Supabase:** `fact_campaign_daily`

```sql
SELECT
  CAST(customer_id AS INT64) AS external_customer_id,
  segments_date              AS date,
  campaign_id                AS campaign_id,
  SUM(metrics_impressions)   AS impressions,
  SUM(metrics_clicks)        AS clicks,
  SUM(metrics_cost_micros)   AS cost_micros,
  SUM(metrics_conversions)   AS conversions,
  CAST(NULL AS NUMERIC) AS all_conversions,
  CAST(NULL AS INT64)   AS invalid_clicks,
  CAST(NULL AS NUMERIC) AS search_impr_share,
  CAST(NULL AS NUMERIC) AS search_lost_is_budget,
  CAST(NULL AS NUMERIC) AS search_lost_is_rank,
  CAST(NULL AS NUMERIC) AS search_top_is,
  CAST(NULL AS NUMERIC) AS search_abs_top_is
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_CampaignBasicStats_2135330960`
GROUP BY external_customer_id, date, campaign_id
```

**Nota:** Campos IS (search_impr_share etc.) são NULL aqui — vêm via `canon_auction_insights_window` do GAQL customizado.

---

### 2.2 `canon_adgroup_daily`

**Fonte:** `ads_AdGroupBasicStats_2135330960`
**Destino Supabase:** `fact_adgroup_daily`

```sql
SELECT
  CAST(customer_id AS INT64) AS external_customer_id,
  segments_date              AS date,
  campaign_id                AS campaign_id,
  ad_group_id                AS ad_group_id,
  SUM(metrics_impressions)   AS impressions,
  SUM(metrics_clicks)        AS clicks,
  SUM(metrics_cost_micros)   AS cost_micros,
  SUM(metrics_conversions)   AS conversions
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_AdGroupBasicStats_2135330960`
GROUP BY external_customer_id, date, campaign_id, ad_group_id
```

---

### 2.3 `canon_keyword_daily`

**Fonte:** `ads_KeywordBasicStats_2135330960`
**Destino Supabase:** `fact_keyword_daily`

```sql
SELECT
  k.customer_id AS external_customer_id,
  k.segments_date AS date,
  k.campaign_id,
  k.ad_group_id,
  k.ad_group_criterion_criterion_id AS keyword_id,
  SUM(k.metrics_impressions) AS impressions,
  SUM(k.metrics_clicks) AS clicks,
  SUM(k.metrics_cost_micros) AS cost_micros,
  SUM(k.metrics_conversions) AS conversions
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_KeywordBasicStats_2135330960` k
WHERE k.segments_date >= DATE_SUB(k._LATEST_DATE, INTERVAL 30 DAY)
GROUP BY k.customer_id, k.segments_date, k.campaign_id, k.ad_group_id,
         k.ad_group_criterion_criterion_id
```

**Nota:** Filtro `INTERVAL 30 DAY` limita dados a últimos 30 dias para performance.

---

### 2.4 `canon_keyword_inventory`

**Fonte:** `ads_Keyword_2135330960`
**Destino Supabase:** `keyword_inventory`

```sql
SELECT
  k.customer_id AS external_customer_id,
  k.campaign_id,
  k.ad_group_id,
  k.ad_group_criterion_criterion_id AS keyword_id,
  k.ad_group_criterion_keyword_text AS keyword_text,
  k.ad_group_criterion_keyword_match_type AS match_type,
  k.ad_group_criterion_status AS status,
  k.ad_group_criterion_effective_cpc_bid_micros AS effective_cpc_bid_micros,
  k.ad_group_criterion_quality_info_quality_score AS quality_score,
  k.ad_group_criterion_quality_info_creative_quality_score AS ad_relevance,
  k.ad_group_criterion_quality_info_post_click_quality_score AS landing_page_experience,
  k.ad_group_criterion_quality_info_search_predicted_ctr AS expected_ctr,
  k.ad_group_criterion_position_estimates_first_page_cpc_micros AS first_page_cpc_micros,
  k.ad_group_criterion_position_estimates_top_of_page_cpc_micros AS top_of_page_cpc_micros,
  k.ad_group_criterion_position_estimates_first_position_cpc_micros AS first_position_cpc_micros,
  k._DATA_DATE AS snapshot_date
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_Keyword_2135330960` k
WHERE k._DATA_DATE = k._LATEST_DATE
  AND k.ad_group_criterion_negative = FALSE
```

**Nota:** Filtra `negative = FALSE` (keywords positivas apenas). Negativas são tratadas pelo n8n via Google Ads Scripts.

---

### 2.5 `canon_ad_copy_inventory`

**Fonte:** `ads_Ad_2135330960`
**Destino Supabase:** `ad_copy_inventory`

```sql
SELECT
  CAST(customer_id AS INT64) AS external_customer_id,
  campaign_id,
  ad_group_id,
  ad_group_ad_ad_id AS ad_id,
  ad_group_ad_ad_type AS ad_type,
  ad_group_ad_status AS status,
  ad_group_ad_ad_strength AS ad_strength,
  ad_group_ad_ad_responsive_search_ad_headlines AS headlines_raw,
  ad_group_ad_ad_responsive_search_ad_descriptions AS descriptions_raw,
  ad_group_ad_ad_responsive_search_ad_path1 AS path1,
  ad_group_ad_ad_responsive_search_ad_path2 AS path2,
  ad_group_ad_ad_final_urls AS final_urls,
  _DATA_DATE AS snapshot_date
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_Ad_2135330960`
WHERE _DATA_DATE = _LATEST_DATE
  AND ad_group_ad_ad_type = 'RESPONSIVE_SEARCH_AD'
```

---

### 2.6 `canon_search_terms_window`

**Fontes:** `ads_SearchQueryStats_2135330960` + `ads_SearchQueryConversionStats_2135330960` + `ads_Keyword_2135330960`
**Destino Supabase:** `fact_search_terms_window`

```sql
WITH anchor AS (
  SELECT MAX(segments_date) AS last_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_SearchQueryStats_2135330960`
),
stats AS (
  SELECT
    CAST(customer_id AS INT64) AS external_customer_id,
    campaign_id,
    ad_group_id,
    search_term_view_search_term AS search_term,
    COALESCE(segments_search_term_match_type, 'UNKNOWN') AS match_type,
    SAFE_CAST(REGEXP_EXTRACT(segments_keyword_ad_group_criterion, r'~(\d+)$') AS INT64) AS keyword_criterion_id,
    segments_date AS date,
    SUM(metrics_impressions) AS impressions,
    SUM(metrics_clicks) AS clicks,
    SUM(metrics_cost_micros) AS cost_micros
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_SearchQueryStats_2135330960`
  GROUP BY external_customer_id, campaign_id, ad_group_id, search_term,
           match_type, keyword_criterion_id, date
),
conv AS (
  SELECT
    CAST(customer_id AS INT64) AS external_customer_id,
    campaign_id,
    ad_group_id,
    search_term_view_search_term AS search_term,
    COALESCE(segments_search_term_match_type, 'UNKNOWN') AS match_type,
    segments_date AS date,
    SUM(metrics_conversions) AS conversions
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_SearchQueryConversionStats_2135330960`
  GROUP BY external_customer_id, campaign_id, ad_group_id, search_term, match_type, date
),
base AS (
  SELECT
    s.external_customer_id, s.campaign_id, s.ad_group_id,
    s.search_term, s.match_type, s.keyword_criterion_id, s.date,
    s.impressions, s.clicks, s.cost_micros,
    COALESCE(c.conversions, 0) AS conversions
  FROM stats s
  LEFT JOIN conv c
    USING (external_customer_id, campaign_id, ad_group_id, search_term, match_type, date)
),
w AS (
  SELECT 'LAST_7D'  AS window_label, DATE_SUB(a.last_date, INTERVAL 6 DAY)  AS date_start, a.last_date AS date_end FROM anchor a
  UNION ALL
  SELECT 'LAST_30D' AS window_label, DATE_SUB(a.last_date, INTERVAL 29 DAY) AS date_start, a.last_date AS date_end FROM anchor a
)
SELECT
  w.window_label, w.date_start, w.date_end,
  b.external_customer_id, b.campaign_id, b.ad_group_id,
  b.search_term, b.match_type, b.keyword_criterion_id,
  k.ad_group_criterion_keyword_text AS matched_keyword,
  SUM(b.impressions) AS impressions,
  SUM(b.clicks) AS clicks,
  SUM(b.cost_micros) AS cost_micros,
  SUM(b.conversions) AS conversions
FROM base b
JOIN w ON b.date BETWEEN w.date_start AND w.date_end
LEFT JOIN `gothic-well-487118-r1.Importacao_MCC_Producao.ads_Keyword_2135330960` k
  ON k.ad_group_criterion_criterion_id = b.keyword_criterion_id
  AND k.ad_group_id = b.ad_group_id
  AND k._DATA_DATE = k._LATEST_DATE
GROUP BY
  w.window_label, w.date_start, w.date_end,
  b.external_customer_id, b.campaign_id, b.ad_group_id, b.search_term, b.match_type,
  b.keyword_criterion_id, k.ad_group_criterion_keyword_text
```

**Notas:**
- JOIN em `SearchQueryStats` (clicks/cost) + LEFT JOIN `SearchQueryConversionStats` (conversions)
- LEFT JOIN `ads_Keyword` para resolver `keyword_criterion_id` → `matched_keyword`
- Gera LAST_7D e LAST_30D numa única view
- Âncora: `MAX(segments_date)` de SearchQueryStats

---

### 2.7 `canon_auction_insights_window`

**Fontes:** `p_ads_gaql_campaign_is_daily_2135330960` (GAQL customizado) + `canon_campaign_daily` (pesos)
**Destino Supabase:** `fact_auction_insights_window`

```sql
WITH anchor AS (
  SELECT MAX(CAST(segments_date AS DATE)) AS last_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.p_ads_gaql_campaign_is_daily_2135330960`
),
base AS (
  SELECT
    CAST(customer_id AS INT64) AS external_customer_id,
    CAST(campaign_id AS INT64) AS campaign_id,
    CAST(segments_date AS DATE) AS date,
    AVG(metrics_search_impression_share) AS search_impr_share,
    AVG(metrics_search_budget_lost_impression_share) AS search_lost_is_budget,
    AVG(metrics_search_rank_lost_impression_share) AS search_lost_is_rank,
    AVG(metrics_search_top_impression_share) AS search_top_is,
    AVG(metrics_search_absolute_top_impression_share) AS search_abs_top_is,
    AVG(metrics_search_exact_match_impression_share) AS search_exact_match_is,
    AVG(metrics_search_budget_lost_top_impression_share) AS search_budget_lost_top_is,
    AVG(metrics_search_budget_lost_absolute_top_impression_share) AS search_budget_lost_abs_top_is,
    AVG(metrics_search_rank_lost_top_impression_share) AS search_rank_lost_top_is,
    AVG(metrics_search_rank_lost_absolute_top_impression_share) AS search_rank_lost_abs_top_is
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.p_ads_gaql_campaign_is_daily_2135330960`
  GROUP BY 1,2,3
),
weights AS (
  SELECT
    CAST(external_customer_id AS INT64) AS external_customer_id,
    CAST(campaign_id AS INT64) AS campaign_id,
    CAST(date AS DATE) AS date,
    CAST(impressions AS INT64) AS impressions
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_campaign_daily`
),
joined AS (
  SELECT b.*, COALESCE(w.impressions, 0) AS w
  FROM base b
  LEFT JOIN weights w
    ON w.external_customer_id = b.external_customer_id
   AND w.campaign_id = b.campaign_id
   AND w.date = b.date
),
-- LAST_7D e LAST_30D com média ponderada por impressions
w7 AS (
  SELECT 'LAST_7D' AS window_label,
    DATE_SUB(a.last_date, INTERVAL 6 DAY) AS date_start,
    a.last_date AS date_end,
    j.external_customer_id, j.campaign_id,
    COALESCE(SAFE_DIVIDE(SUM(j.search_impr_share * j.w), NULLIF(SUM(j.w),0)),
             AVG(j.search_impr_share)) AS search_impr_share,
    -- ... (mesma fórmula para todos os 10 campos IS)
    ...
  FROM joined j CROSS JOIN anchor a
  WHERE j.date BETWEEN DATE_SUB(a.last_date, INTERVAL 6 DAY) AND a.last_date
  GROUP BY 1,2,3,4,5
),
w30 AS ( /* mesma estrutura com INTERVAL 29 DAY */ )
SELECT * FROM w7 UNION ALL SELECT * FROM w30
```

**Notas:**
- **Média ponderada** por impressions (não simples) — evita que dias com poucas impressões distorçam IS
- Fallback para AVG simples quando impressions = 0
- Fonte é o GAQL customizado (`p_ads_gaql_*`), não o Data Transfer padrão
- 10 métricas de Impression Share cobertas

---

### 2.8 `canon_conversions_by_action_window`

**Fonte:** `ads_CampaignConversionStats_2135330960`
**Destino Supabase:** `fact_conversions_by_action_window`

```sql
WITH anchor AS (
  SELECT MAX(segments_date) AS last_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_CampaignConversionStats_2135330960`
),
base AS (
  SELECT
    CAST(customer_id AS INT64) AS external_customer_id,
    segments_conversion_action_name AS action_name,
    campaign_id,
    CAST(NULL AS INT64) AS ad_group_id,
    segments_date AS date,
    SUM(metrics_conversions) AS conversions,
    SUM(metrics_conversions_value) AS conversions_value
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_CampaignConversionStats_2135330960`
  GROUP BY external_customer_id, action_name, campaign_id, ad_group_id, date
),
w AS (
  SELECT 'LAST_7D'  AS window_label, DATE_SUB(a.last_date, INTERVAL 6 DAY)  AS date_start, a.last_date AS date_end FROM anchor a
  UNION ALL
  SELECT 'LAST_30D' AS window_label, DATE_SUB(a.last_date, INTERVAL 29 DAY) AS date_start, a.last_date AS date_end FROM anchor a
)
SELECT
  w.window_label, w.date_start, w.date_end,
  b.external_customer_id, b.action_name, b.campaign_id, b.ad_group_id,
  SUM(b.conversions) AS conversions,
  SUM(b.conversions_value) AS conversions_value
FROM base b
JOIN w ON b.date BETWEEN w.date_start AND w.date_end
GROUP BY w.window_label, w.date_start, w.date_end,
         b.external_customer_id, b.action_name, b.campaign_id, b.ad_group_id
```

**Nota:** `ad_group_id` é sempre NULL (granularidade = campanha). Pode ser expandido para ad group se necessário.

---

### 2.9 `canon_geo_performance_window`

**Fontes:** `ads_GeoStats_2135330960` + `ref_geo_target_constants`
**Destino Supabase:** `fact_geo_performance_window`

```sql
WITH anchor AS (
  SELECT MAX(segments_date) AS last_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_GeoStats_2135330960`
),
w AS (
  SELECT 'LAST_7D'  AS window_label, DATE_SUB(a.last_date, INTERVAL 6 DAY)  AS date_start, a.last_date AS date_end FROM anchor a
  UNION ALL
  SELECT 'LAST_30D' AS window_label, DATE_SUB(a.last_date, INTERVAL 29 DAY) AS date_start, a.last_date AS date_end FROM anchor a
)
SELECT
  w.window_label, w.date_start, w.date_end,
  CAST(g.customer_id AS INT64) AS external_customer_id,
  g.campaign_id,
  CAST(REGEXP_EXTRACT(g.segments_geo_target_most_specific_location, r'/(\d+)$') AS INT64) AS geo_id,
  ref.name AS location_name,
  ref.canonical_name,
  ref.target_type AS location_type,
  g.geographic_view_location_type AS user_location_type,
  SUM(g.metrics_impressions) AS impressions,
  SUM(g.metrics_clicks) AS clicks,
  SUM(g.metrics_cost_micros) AS cost_micros,
  SUM(g.metrics_conversions) AS conversions
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_GeoStats_2135330960` g
JOIN w ON g.segments_date BETWEEN w.date_start AND w.date_end
LEFT JOIN `gothic-well-487118-r1.Importacao_MCC_Producao.ref_geo_target_constants` ref
  ON ref.criteria_id = CAST(REGEXP_EXTRACT(g.segments_geo_target_most_specific_location, r'/(\d+)$') AS INT64)
GROUP BY
  w.window_label, w.date_start, w.date_end,
  g.customer_id, g.campaign_id,
  geo_id, ref.name, ref.canonical_name, ref.target_type,
  g.geographic_view_location_type
```

**Nota:** REGEX extrai `geo_id` do resource name. JOIN com `ref_geo_target_constants` resolve para nome, canonical_name e target_type (City, Postal Code, Neighborhood, etc.).

---

### 2.10 `canon_hourly_campaign_window`

**Fonte:** `ads_HourlyCampaignStats_2135330960`
**Destino Supabase:** `fact_hourly_campaign_window`

```sql
WITH anchor AS (
  SELECT MAX(segments_date) AS last_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_HourlyCampaignStats_2135330960`
),
w AS (
  SELECT 'LAST_7D'  AS window_label, DATE_SUB(a.last_date, INTERVAL 6 DAY)  AS date_start, a.last_date AS date_end FROM anchor a
  UNION ALL
  SELECT 'LAST_30D' AS window_label, DATE_SUB(a.last_date, INTERVAL 29 DAY) AS date_start, a.last_date AS date_end FROM anchor a
)
SELECT
  w.window_label, w.date_start, w.date_end,
  CAST(h.customer_id AS INT64) AS external_customer_id,
  h.campaign_id,
  h.segments_hour AS hour_of_day,
  h.segments_day_of_week AS day_of_week,
  SUM(h.metrics_impressions) AS impressions,
  SUM(h.metrics_clicks) AS clicks,
  SUM(h.metrics_cost_micros) AS cost_micros,
  SUM(h.metrics_conversions) AS conversions
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.ads_HourlyCampaignStats_2135330960` h
JOIN w ON h.segments_date BETWEEN w.date_start AND w.date_end
GROUP BY
  w.window_label, w.date_start, w.date_end,
  h.customer_id, h.campaign_id,
  h.segments_hour, h.segments_day_of_week
```

**Nota:** Inclui `campaign_id` — a view BQ tem esse campo, mas a payload function pode estar dropando na hora de montar o JSON.

---

## 3. Tabelas de Referência

### 3.1 `ref_geo_target_constants`

Tabela de mapeamento geográfico do Google Ads (upload manual).

| Campo | Tipo | Descrição |
|---|---|---|
| `criteria_id` | INT64 | ID do target geográfico |
| `name` | STRING | Nome curto (ex: "Naenae") |
| `canonical_name` | STRING | Nome completo (ex: "Naenae, Lower Hutt, Wellington, New Zealand") |
| `target_type` | STRING | Tipo (City, Postal Code, Neighborhood, Region, Country) |
| `country_code` | STRING | Código do país (NZ) |
| `status` | STRING | Status (ACTIVE) |

---

## 4. Tabelas Base Usadas pelas Canon Views

Todas as tabelas `p_ads_*` são particionadas por `DATE(_PARTITIONTIME)` e contêm dados brutos do Data Transfer. Abaixo, apenas as tabelas diretamente referenciadas pelas canon views.

### 4.1 `p_ads_CampaignBasicStats_2135330960`

**Usada por:** `canon_campaign_daily`

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_conversions` | FLOAT64 | Conversões (include_in_conversions = true) |
| `metrics_conversions_value` | FLOAT64 | Valor total das conversões |
| `metrics_cost_micros` | INT64 | Custo em micros (÷ 1.000.000 = NZD) |
| `metrics_impressions` | INT64 | Impressões |
| `metrics_interaction_event_types` | STRING | Tipos de interação |
| `metrics_interactions` | INT64 | Interações |
| `metrics_view_through_conversions` | INT64 | Conversões view-through |
| `segments_ad_network_type` | STRING | Rede (SEARCH, CONTENT, etc.) |
| `segments_date` | DATE | Data da métrica |
| `segments_device` | STRING | Dispositivo (DESKTOP, MOBILE, TABLET) |
| `segments_slot` | STRING | Posição do anúncio |

---

### 4.2 `p_ads_AdGroupBasicStats_2135330960`

**Usada por:** `canon_adgroup_daily`

| Campo | Tipo | Descrição |
|---|---|---|
| `ad_group_id` | INT64 | ID do ad group |
| `campaign_id` | INT64 | ID da campanha |
| `customer_id` | INT64 | ID do cliente |
| `ad_group_base_ad_group` | STRING | Resource name do ad group base |
| `campaign_base_campaign` | STRING | Resource name da campanha base |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_conversions_value` | FLOAT64 | Valor das conversões |
| `metrics_cost_micros` | INT64 | Custo em micros |
| `metrics_impressions` | INT64 | Impressões |
| `metrics_interaction_event_types` | STRING | Tipos de interação |
| `metrics_interactions` | INT64 | Interações |
| `metrics_view_through_conversions` | INT64 | Conversões view-through |
| `segments_ad_network_type` | STRING | Rede |
| `segments_date` | DATE | Data |
| `segments_device` | STRING | Dispositivo |
| `segments_slot` | STRING | Posição |

---

### 4.3 `p_ads_KeywordBasicStats_2135330960`

**Usada por:** `canon_keyword_daily`

| Campo | Tipo | Descrição |
|---|---|---|
| `ad_group_criterion_criterion_id` | INT64 | ID do critério (keyword_id) |
| `ad_group_id` | INT64 | ID do ad group |
| `campaign_id` | INT64 | ID da campanha |
| `customer_id` | INT64 | ID do cliente |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_conversions_value` | FLOAT64 | Valor das conversões |
| `metrics_cost_micros` | INT64 | Custo em micros |
| `metrics_impressions` | INT64 | Impressões |
| `segments_ad_network_type` | STRING | Rede |
| `segments_date` | DATE | Data |
| `segments_device` | STRING | Dispositivo |
| `segments_slot` | STRING | Posição |

**Nota:** Campo-chave `ad_group_criterion_criterion_id` é renomeado para `keyword_id` na canon view.

---

### 4.4 `p_ads_SearchQueryStats_2135330960`

**Usada por:** `canon_search_terms_window` (clicks/cost)

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `ad_group_id` | INT64 | ID do ad group |
| `search_term_view_search_term` | STRING | Termo de busca real |
| `segments_keyword_ad_group_criterion` | STRING | Resource name do critério (contém keyword_id via REGEX `~(\d+)$`) |
| `segments_search_term_match_type` | STRING | Tipo de correspondência (EXACT, PHRASE, BROAD) |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_cost_micros` | INT64 | Custo em micros |
| `metrics_impressions` | INT64 | Impressões |
| `segments_date` | DATE | Data |

**Nota:** NÃO contém `metrics_conversions` — conversões vêm da tabela separada abaixo.

---

### 4.5 `p_ads_SearchQueryConversionStats_2135330960`

**Usada por:** `canon_search_terms_window` (conversões via LEFT JOIN)

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `ad_group_id` | INT64 | ID do ad group |
| `search_term_view_search_term` | STRING | Termo de busca |
| `segments_search_term_match_type` | STRING | Tipo de correspondência |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_conversions_value` | FLOAT64 | Valor das conversões |
| `segments_conversion_action_name` | STRING | Nome da ação de conversão |
| `segments_date` | DATE | Data |

---

### 4.6 `p_ads_CampaignConversionStats_2135330960`

**Usada por:** `canon_conversions_by_action_window`

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `segments_conversion_action_name` | STRING | Nome da ação (ex: "Phone Calls", "Book Online") |
| `segments_conversion_action_category` | STRING | Categoria da ação |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_conversions_value` | FLOAT64 | Valor das conversões |
| `segments_date` | DATE | Data |
| `segments_device` | STRING | Dispositivo |

---

### 4.7 `p_ads_GeoStats_2135330960`

**Usada por:** `canon_geo_performance_window`

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `segments_geo_target_most_specific_location` | STRING | Resource name geográfico (ex: `geoTargetConstants/9072138`) |
| `geographic_view_location_type` | STRING | Tipo de localização do usuário |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_cost_micros` | INT64 | Custo em micros |
| `metrics_impressions` | INT64 | Impressões |
| `segments_date` | DATE | Data |

**Nota:** `geo_id` é extraído via REGEX `r'/(\d+)$'` do resource name e resolvido via JOIN com `ref_geo_target_constants`.

---

### 4.8 `p_ads_HourlyCampaignStats_2135330960`

**Usada por:** `canon_hourly_campaign_window`

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `segments_hour` | INT64 | Hora do dia (0-23) |
| `segments_day_of_week` | STRING | Dia da semana (MONDAY, TUESDAY, etc.) |
| `metrics_clicks` | INT64 | Cliques |
| `metrics_conversions` | FLOAT64 | Conversões |
| `metrics_cost_micros` | INT64 | Custo em micros |
| `metrics_impressions` | INT64 | Impressões |
| `segments_date` | DATE | Data |

---

### 4.9 `p_ads_gaql_campaign_is_daily_2135330960`

**Usada por:** `canon_auction_insights_window`
**Origem:** GAQL customizado via Data Transfer `Importacao_MCC_AuctionInsights_GAQL_Diaria`

| Campo | Tipo | Descrição |
|---|---|---|
| `customer_id` | INT64 | ID do cliente |
| `campaign_id` | INT64 | ID da campanha |
| `segments_date` | STRING | Data (requer CAST para DATE) |
| `metrics_search_impression_share` | FLOAT64 | IS geral (0.1–1.0, abaixo = 0.0999) |
| `metrics_search_budget_lost_impression_share` | FLOAT64 | IS perdido por orçamento (0–0.9, acima = 0.9001) |
| `metrics_search_rank_lost_impression_share` | FLOAT64 | IS perdido por Ad Rank |
| `metrics_search_top_impression_share` | FLOAT64 | IS posição top |
| `metrics_search_absolute_top_impression_share` | FLOAT64 | IS posição absolute top |
| `metrics_search_exact_match_impression_share` | FLOAT64 | IS exact match |
| `metrics_search_budget_lost_top_impression_share` | FLOAT64 | IS top perdido por orçamento |
| `metrics_search_budget_lost_absolute_top_impression_share` | FLOAT64 | IS abs top perdido por orçamento |
| `metrics_search_rank_lost_top_impression_share` | FLOAT64 | IS top perdido por rank |
| `metrics_search_rank_lost_absolute_top_impression_share` | FLOAT64 | IS abs top perdido por rank |

**Nota:** `segments_date` é STRING nesta tabela (diferente das outras que são DATE) — por isso a canon view faz `CAST(segments_date AS DATE)`.

---

### 4.10 Mapa: Tabela Base → Canon View → Supabase

| Tabela Base | Canon View que a Usa | Campos-chave |
|---|---|---|
| `p_ads_CampaignBasicStats_2135330960` | `canon_campaign_daily` | customer_id, campaign_id, segments_date, metrics_* |
| `p_ads_AdGroupBasicStats_2135330960` | `canon_adgroup_daily` | customer_id, campaign_id, ad_group_id, segments_date, metrics_* |
| `p_ads_KeywordBasicStats_2135330960` | `canon_keyword_daily` | customer_id, campaign_id, ad_group_id, keyword_criterion_id, metrics_* |
| `p_ads_gaql_campaign_is_daily_2135330960` | `canon_auction_insights_window` | customer_id, campaign_id, segments_date, metrics_search_*_impression_share |
| `p_ads_SearchQueryStats_2135330960` | `canon_search_terms_window` | customer_id, campaign_id, ad_group_id, search_term, metrics_clicks/cost |
| `p_ads_SearchQueryConversionStats_2135330960` | `canon_search_terms_window` | (conv) metrics_conversions |
| `p_ads_CampaignConversionStats_2135330960` | `canon_conversions_by_action_window` | segments_conversion_action_name, metrics_conversions |
| `p_ads_GeoStats_2135330960` | `canon_geo_performance_window` | segments_geo_target_most_specific_location, geographic_view_location_type |
| `p_ads_HourlyCampaignStats_2135330960` | `canon_hourly_campaign_window` | segments_hour, segments_day_of_week |

---

## 5. Views Auto-Geradas (Inventário Completo)

88 views `ads_*_2135330960` + 1 view `ads_gaql_*` geradas automaticamente pelo Data Transfer. Todas seguem o mesmo template:

```sql
SELECT *, 
  DATE('2026-02-18') AS _LATEST_DATE,      -- atualizado automaticamente
  DATE(_PARTITIONTIME) AS _DATA_DATE 
FROM `615589107578.Importacao_MCC_Producao.p_ads_{Report}_2135330960`
```

As principais usadas pelo projeto:

| Categoria | Views |
|---|---|
| Account | AccountBasicStats, AccountConversionStats, AccountNonClickStats, AccountStats |
| Campaign | Campaign, CampaignBasicStats, CampaignConversionStats, CampaignStats, CampaignCriterion, CampaignLocationTargetStats |
| Ad Group | AdGroup, AdGroupBasicStats, AdGroupConversionStats, AdGroupStats, AdGroupCriterion |
| Ad | Ad, AdBasicStats, AdConversionStats, AdStats |
| Keyword | Keyword, KeywordBasicStats, KeywordConversionStats, KeywordStats |
| Search Query | SearchQueryStats, SearchQueryConversionStats |
| Geo | GeoStats, GeoConversionStats, LocationsUserLocationsStats |
| Hourly | HourlyCampaignStats, HourlyCampaignConversionStats, HourlyAccountStats |
| Demographics | AgeRange*, Gender*, ParentalStatus* |
| Audience | AdGroupAudience*, CampaignAudience* |
| Budget | Budget, BudgetStats, BidGoal* |
| Other | Asset*, Video*, Shopping*, LandingPageStats, Placement* |

---

*hub3ps-ads-ops • Schema BigQuery • Fevereiro 2026*
