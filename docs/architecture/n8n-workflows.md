# Hub3ps Ads Ops — Workflow n8n (ETL BigQuery → Supabase)

**Gerado em:** 2026-02-20 | **Verificado:** JSON do workflow exportado direto do n8n
**Trigger:** Manual (`When clicking 'Execute workflow'`)
**Branches paralelos:** 13 (todas as branches disparam simultaneamente)
**Total de nodes:** ~53

---

## 1. Credenciais

| Nome | Tipo | ID | Uso |
|---|---|---|---|
| Google Service Account - BigQuery | Service Account | `uIQgJYp6KcQ8LuzA` | Todas as queries BigQuery |
| Postgres - hub3ps-ads-ops | PostgreSQL | `Gte89jJAAdXlmybZ` | Todas as escritas Supabase |

---

## 2. Visão Geral do Pipeline

```
Manual Trigger
├── canon_campaign_daily          → fact_campaign_daily          (UPSERT bulk)
├── canon_adgroup_daily           → fact_adgroup_daily           (UPSERT bulk)
├── canon_conversions_by_action   → fact_conversions_by_action   (UPSERT bulk + QA)
├── canon_search_terms_window     → fact_search_terms_window     (DELETE+INSERT + QA)
├── canon_auction_insights_window → fact_auction_insights_window (UPSERT bulk + QA)
├── extrair_inventory_campanhas   → campaign_inventory           (UPSERT bulk)
├── extrair_adgroup_inventory     → adgroup_inventory            (UPSERT bulk)
├── canon_keyword_inventory       → keyword_inventory            (UPSERT per-row)
├── canon_keyword_daily           → fact_keyword_daily           (UPSERT per-row)
├── canon_geo_performance_window  → fact_geo_performance_window  (DELETE+INSERT)
├── canon_ad_copy_inventory       → ad_copy_inventory            (UPSERT per-row)
├── canon_hourly_campaign_window  → fact_hourly_campaign_window  (DELETE+INSERT)
└── canon_negatives_inventory  → negatives_inventory           (DELETE+INSERT)
```

### Padrões de Ingestão

| Padrão | Branches | Descrição |
|---|---|---|
| **UPSERT bulk** | campaign_daily, adgroup_daily, conversions, auction_insights, campaign_inventory, adgroup_inventory | `executeOnce=true` + `jsonb_array_elements($1::jsonb)` + `ON CONFLICT DO UPDATE` |
| **UPSERT per-row** | keyword_inventory, keyword_daily, ad_copy_inventory | `executeOnce=false` + parâmetros posicionais ($1..$n) + `ON CONFLICT DO UPDATE` |
| **DELETE+INSERT** | search_terms, geo_performance, hourly_campaign, negatives_inventory | DELETE por (external_customer_id, window_label) → INSERT full (evita orphans e duplicatas entre date ranges) *(FIX v3.2)* |

### Pipeline QA (3 branches)

Apenas `search_terms_window`, `conversions_by_action_window` e `auction_insights_window` têm QA:

```
BQ → pack_payload → gate (>0?) → INSERT/DELETE → Merge ← pack_payload
                                                    ↓
                                              qa_bounds (count expected)
                                                    ↓
                                              qa_db_counts (count actual in Supabase)
                                                    ↓
                                              qa_decide (expected == actual?)
                                                    ↓
                                              if_failed → log_failures (→ analysis_runs)
```

---

## 3. Detalhamento por Branch (com SQLs completos)

---

### 3.1 `campaign_daily`

**Estratégia:** UPSERT bulk | **QA:** Não | **executeOnce:** true

#### BQ Read — `canon_campaign_daily`

```sql
WITH maxd AS (
  SELECT MAX(date) AS max_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_campaign_daily`
)
SELECT *
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_campaign_daily`, maxd
WHERE date BETWEEN DATE_SUB(max_date, INTERVAL 6 DAY) AND max_date;
```

#### PG Write — `fact_campaign_daily`

**queryReplacement:** `{{ JSON.stringify($items("canon_campaign_daily").map(i => i.json)) }}`

```sql
INSERT INTO ads.fact_campaign_daily (
  external_customer_id,
  date,
  campaign_id,
  impressions,
  clicks,
  cost_micros,
  conversions,
  all_conversions,
  invalid_clicks,
  search_impr_share,
  search_lost_is_budget,
  search_lost_is_rank,
  search_top_is,
  search_abs_top_is
)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'date')::date,
  (r->>'campaign_id')::bigint,
  NULLIF(r->>'impressions','')::bigint,
  NULLIF(r->>'clicks','')::bigint,
  NULLIF(r->>'cost_micros','')::bigint,
  NULLIF(r->>'conversions','')::numeric,
  NULLIF(r->>'all_conversions','')::numeric,
  NULLIF(r->>'invalid_clicks','')::bigint,
  NULLIF(r->>'search_impr_share','')::numeric,
  NULLIF(r->>'search_lost_is_budget','')::numeric,
  NULLIF(r->>'search_lost_is_rank','')::numeric,
  NULLIF(r->>'search_top_is','')::numeric,
  NULLIF(r->>'search_abs_top_is','')::numeric
FROM jsonb_array_elements($1::jsonb) AS r
ON CONFLICT (external_customer_id, date, campaign_id)
DO UPDATE SET
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  cost_micros = EXCLUDED.cost_micros,
  conversions = EXCLUDED.conversions,
  all_conversions = EXCLUDED.all_conversions,
  invalid_clicks = EXCLUDED.invalid_clicks,
  search_impr_share = EXCLUDED.search_impr_share,
  search_lost_is_budget = EXCLUDED.search_lost_is_budget,
  search_lost_is_rank = EXCLUDED.search_lost_is_rank,
  search_top_is = EXCLUDED.search_top_is,
  search_abs_top_is = EXCLUDED.search_abs_top_is;
```

---

### 3.2 `adgroup_daily`

**Estratégia:** UPSERT bulk | **QA:** Não | **executeOnce:** true

#### BQ Read — `canon_adgroup_daily`

```sql
WITH maxd AS (
  SELECT MAX(date) AS max_date
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_adgroup_daily`
)
SELECT
  external_customer_id,
  date,
  campaign_id,
  ad_group_id,
  impressions,
  clicks,
  cost_micros,
  conversions
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_adgroup_daily`, maxd
WHERE date BETWEEN DATE_SUB(max_date, INTERVAL 6 DAY) AND max_date;
```

#### PG Write — `fact_adgroup_daily`

**queryReplacement:** `{{ JSON.stringify($items("canon_adgroup_daily").map(i => i.json)) }}`

```sql
INSERT INTO ads.fact_adgroup_daily (
  external_customer_id,
  date,
  campaign_id,
  ad_group_id,
  impressions,
  clicks,
  cost_micros,
  conversions,
  all_conversions,
  invalid_clicks,
  updated_at
)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'date')::date,
  (r->>'campaign_id')::bigint,
  (r->>'ad_group_id')::bigint,
  NULLIF(r->>'impressions','')::bigint,
  NULLIF(r->>'clicks','')::bigint,
  NULLIF(r->>'cost_micros','')::bigint,
  NULLIF(r->>'conversions','')::numeric,
  NULLIF(r->>'all_conversions','')::numeric,
  NULLIF(r->>'invalid_clicks','')::bigint,
  now()
FROM jsonb_array_elements($1::jsonb) AS r
ON CONFLICT (external_customer_id, date, ad_group_id)
DO UPDATE SET
  campaign_id   = EXCLUDED.campaign_id,
  impressions   = EXCLUDED.impressions,
  clicks        = EXCLUDED.clicks,
  cost_micros   = EXCLUDED.cost_micros,
  conversions   = EXCLUDED.conversions,
  all_conversions = EXCLUDED.all_conversions,
  invalid_clicks  = EXCLUDED.invalid_clicks,
  updated_at    = now();
```

---

### 3.3 `conversions_by_action_window` (com QA)

**Estratégia:** UPSERT bulk | **QA:** Sim | **executeOnce:** true

#### BQ Read — `canon_conversions_by_action_window`

```sql
SELECT *
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_conversions_by_action_window`;
```

#### Code — `pack_caw_payload`

```javascript
const payload = $input.all().map(i => i.json);

return [{
  json: {
    payload,
    payload_count: payload.length
  }
}];
```

#### Gate — `gate_payload_count_caw`

Condição: `$json.payload_count > 0` → prossegue. Senão → branch vazio.

#### PG Write — `fact_conversions_by_action_window`

**queryReplacement:** `{{ JSON.stringify($items("canon_conversions_by_action_window").map(i => i.json)) }}`

```sql
INSERT INTO ads.fact_conversions_by_action_window (
  external_customer_id,
  window_label,
  date_start,
  date_end,
  campaign_id,
  ad_group_id,
  action_name,
  conversions,
  conversions_value,
  cost_micros
)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  COALESCE(NULLIF(r->>'campaign_id','')::bigint, 0),
  NULLIF(r->>'ad_group_id','')::bigint,
  (r->>'action_name')::text,
  NULLIF(r->>'conversions','')::numeric,
  NULLIF(r->>'conversions_value','')::numeric,
  NULLIF(r->>'cost_micros','')::bigint
FROM jsonb_array_elements($1::jsonb) AS r
ON CONFLICT ON CONSTRAINT fact_conversions_by_action_window_pkey
DO UPDATE SET
  ad_group_id        = EXCLUDED.ad_group_id,
  conversions        = EXCLUDED.conversions,
  conversions_value  = EXCLUDED.conversions_value,
  cost_micros        = EXCLUDED.cost_micros;
```

#### QA — `qa_bounds_caw`

```javascript
const all = $input.all().map(i => i.json);
const rows = all.find(x => Array.isArray(x.payload))?.payload ?? [];

const map = new Map();

for (const r of rows) {
  const key = [r.external_customer_id, r.window_label, r.date_start, r.date_end].join('|');

  if (!map.has(key)) {
    map.set(key, {
      external_customer_id: String(r.external_customer_id),
      window_label: r.window_label,
      date_start: r.date_start,
      date_end: r.date_end,
      expected_count: 0,
    });
  }
  map.get(key).expected_count += 1;
}

return [{ json: { bounds: [...map.values()] } }];
```

#### QA — `qa_db_counts_caw`

**queryReplacement:** `{{ JSON.stringify($items("qa_bounds_caw")[0].json.bounds) }}`

```sql
WITH b AS (
  SELECT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label,
    (r->>'date_start')::date            AS date_start,
    (r->>'date_end')::date              AS date_end,
    (r->>'expected_count')::int         AS expected_count
  FROM jsonb_array_elements($1::jsonb) r
)
SELECT
  b.*,
  (
    SELECT COUNT(*)
    FROM ads.fact_conversions_by_action_window t
    WHERE t.external_customer_id = b.external_customer_id
      AND t.window_label = b.window_label
      AND t.date_start = b.date_start
      AND t.date_end   = b.date_end
  ) AS actual_count
FROM b
ORDER BY external_customer_id, window_label, date_start, date_end;
```

#### QA — `qa_decide_caw`

```javascript
let rows = $input.all().map(i => i.json);

if (rows.length === 1 && Array.isArray(rows[0].rows)) rows = rows[0].rows;
if (rows.length === 1 && Array.isArray(rows[0].data)) rows = rows[0].data;

const fails = rows
  .filter(r => Number(r.actual_count) !== Number(r.expected_count) || Number(r.actual_count) === 0)
  .map(r => ({
    external_customer_id: r.external_customer_id,
    window_label: r.window_label,
    date_start: r.date_start,
    date_end: r.date_end,
    notes: JSON.stringify({
      table: "ads.fact_conversions_by_action_window",
      expected_count: Number(r.expected_count),
      actual_count: Number(r.actual_count),
      reason: Number(r.actual_count) === 0 ? "zero_rows" : "count_mismatch",
    }),
  }))
  .filter(f => f.external_customer_id && f.window_label && f.date_start && f.date_end);

return [{ json: { ok: fails.length === 0, fails } }];
```

#### QA — `log_failures_caw`

**queryReplacement:** `{{ JSON.stringify($json.fails) }}`

```sql
INSERT INTO ads.analysis_runs
(external_customer_id, window_label, date_start, date_end, notes)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'notes')::text
FROM jsonb_array_elements($1::jsonb) r
WHERE (r->>'external_customer_id') IS NOT NULL;
```

---

### 3.4 `search_terms_window` (com QA)

**Estratégia:** DELETE+INSERT | **QA:** Sim | **executeOnce:** true | **alwaysOutputData:** true

#### BQ Read — `canon_search_terms_window`

```sql
SELECT *
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_search_terms_window`;
```

#### Code — `pack_stw_payload`

```javascript
const payload = $input.all().map(i => i.json);

return [{
  json: {
    payload,
    payload_count: payload.length
  }
}];
```

#### Gate — `gate_payload_count`

Condição: `$json.payload_count > 0`

#### PG Write — `fact_search_terms_window`

**queryReplacement:** `{{ [JSON.stringify($json.payload)] }}`

```sql
-- 1) DELETE (limpa todo o window_label da conta, evita duplicatas entre date ranges — FIX v3.2)
WITH bounds AS (
  SELECT DISTINCT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label
  FROM jsonb_array_elements($1::jsonb) r
)
DELETE FROM ads.fact_search_terms_window t
USING bounds b
WHERE t.external_customer_id = b.external_customer_id
  AND t.window_label = b.window_label;
-- 2) INSERT (recarrega "fresh")
INSERT INTO ads.fact_search_terms_window (
  window_label, date_start, date_end,
  external_customer_id, campaign_id, ad_group_id,
  search_term, match_type,
  keyword_criterion_id, matched_keyword,
  impressions, clicks, cost_micros, conversions
)
SELECT
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'external_customer_id')::bigint,
  NULLIF(r->>'campaign_id','')::bigint,
  NULLIF(r->>'ad_group_id','')::bigint,
  (r->>'search_term')::text,
  (r->>'match_type')::text,
  NULLIF(r->>'keyword_criterion_id','')::bigint,
  NULLIF(r->>'matched_keyword','')::text,
  NULLIF(r->>'impressions','')::bigint,
  NULLIF(r->>'clicks','')::bigint,
  NULLIF(r->>'cost_micros','')::bigint,
  NULLIF(r->>'conversions','')::numeric
FROM jsonb_array_elements($1::jsonb) r;
```

#### QA — `qa_bounds_stw`

```javascript
const all = $input.all().map(i => i.json);
const rows = all.find(x => Array.isArray(x.payload))?.payload ?? [];

const map = new Map();

for (const r of rows) {
  const key = [r.external_customer_id, r.window_label, r.date_start, r.date_end].join('|');

  if (!map.has(key)) {
    map.set(key, {
      external_customer_id: String(r.external_customer_id),
      window_label: r.window_label,
      date_start: r.date_start,
      date_end: r.date_end,
      expected_count: 0,
    });
  }
  map.get(key).expected_count += 1;
}

return [{ json: { bounds: [...map.values()] } }];
```

#### QA — `qa_db_counts_stw`

**queryReplacement:** `{{ JSON.stringify($items("qa_bounds_stw")[0].json.bounds) }}`

```sql
WITH b AS (
  SELECT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label,
    (r->>'date_start')::date            AS date_start,
    (r->>'date_end')::date              AS date_end,
    (r->>'expected_count')::int         AS expected_count
  FROM jsonb_array_elements($1::jsonb) r
)
SELECT
  b.*,
  (
    SELECT COUNT(*)
    FROM ads.fact_search_terms_window t
    WHERE t.external_customer_id = b.external_customer_id
      AND t.window_label = b.window_label
      AND t.date_start = b.date_start
      AND t.date_end   = b.date_end
  ) AS actual_count
FROM b
ORDER BY external_customer_id, window_label, date_start, date_end;
```

#### QA — `qa_decide_stw`

```javascript
let rows = $input.all().map(i => i.json);

if (rows.length === 1 && Array.isArray(rows[0].rows)) rows = rows[0].rows;
if (rows.length === 1 && Array.isArray(rows[0].data)) rows = rows[0].data;

const fails = rows
  .filter(r => Number(r.actual_count) !== Number(r.expected_count) || Number(r.actual_count) === 0)
  .map(r => ({
    external_customer_id: r.external_customer_id,
    window_label: r.window_label,
    date_start: r.date_start,
    date_end: r.date_end,
    notes: JSON.stringify({
      table: "ads.fact_search_terms_window",
      expected_count: Number(r.expected_count),
      actual_count: Number(r.actual_count),
      reason: Number(r.actual_count) === 0 ? "zero_rows" : "count_mismatch",
    }),
  }))
  .filter(f => f.external_customer_id && f.window_label && f.date_start && f.date_end);

return [{ json: { ok: fails.length === 0, fails } }];
```

#### QA — `log_failures_stw`

**queryReplacement:** `{{ JSON.stringify($json.fails) }}`

```sql
INSERT INTO ads.analysis_runs
(external_customer_id, window_label, date_start, date_end, notes)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'notes')::text
FROM jsonb_array_elements($1::jsonb) r
WHERE (r->>'external_customer_id') IS NOT NULL
  AND (r->>'window_label') IS NOT NULL
  AND (r->>'date_start') IS NOT NULL
  AND (r->>'date_end') IS NOT NULL;
```

---

### 3.5 `auction_insights_window` (com QA)

**Estratégia:** UPSERT bulk | **QA:** Sim | **executeOnce:** true

#### BQ Read — `canon_auction_insights_window`

```sql
SELECT *
FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_auction_insights_window`;
```

#### Code — `pack_aiw_payload`

```javascript
const payload = $input.all().map(i => i.json);

return [{
  json: {
    payload,
    payload_count: payload.length
  }
}];
```

#### Gate — `gate_payload_count1`

Condição: `$json.payload_count > 0`

#### PG Write — `fact_auction_insights_window`

**queryReplacement:** `{{ JSON.stringify($items("canon_auction_insights_window").map(i => i.json)) }}`

```sql
WITH payload AS (
  SELECT $1::jsonb AS j
),
rows AS (
  SELECT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label,
    (r->>'date_start')::date            AS date_start,
    (r->>'date_end')::date              AS date_end,
    NULLIF(r->>'campaign_id','')::bigint AS campaign_id,

    NULLIF(r->>'search_impr_share','')::numeric      AS search_impr_share,
    NULLIF(r->>'search_lost_is_budget','')::numeric  AS search_lost_is_budget,
    NULLIF(r->>'search_lost_is_rank','')::numeric    AS search_lost_is_rank,
    NULLIF(r->>'search_top_is','')::numeric          AS search_top_is,
    NULLIF(r->>'search_abs_top_is','')::numeric      AS search_abs_top_is,

    NULLIF(r->>'search_exact_match_is','')::numeric       AS search_exact_match_is,
    NULLIF(r->>'search_budget_lost_top_is','')::numeric   AS search_budget_lost_top_is,
    NULLIF(r->>'search_budget_lost_abs_top_is','')::numeric AS search_budget_lost_abs_top_is,
    NULLIF(r->>'search_rank_lost_top_is','')::numeric     AS search_rank_lost_top_is,
    NULLIF(r->>'search_rank_lost_abs_top_is','')::numeric AS search_rank_lost_abs_top_is
  FROM payload, jsonb_array_elements(j) r
)
INSERT INTO ads.fact_auction_insights_window (
  external_customer_id, window_label, date_start, date_end, campaign_id,
  search_impr_share, search_lost_is_budget, search_lost_is_rank, search_top_is, search_abs_top_is,
  search_exact_match_is, search_budget_lost_top_is, search_budget_lost_abs_top_is,
  search_rank_lost_top_is, search_rank_lost_abs_top_is
)
SELECT
  external_customer_id, window_label, date_start, date_end, campaign_id,
  search_impr_share, search_lost_is_budget, search_lost_is_rank, search_top_is, search_abs_top_is,
  search_exact_match_is, search_budget_lost_top_is, search_budget_lost_abs_top_is,
  search_rank_lost_top_is, search_rank_lost_abs_top_is
FROM rows
ON CONFLICT (external_customer_id, window_label, date_start, date_end, campaign_id)
DO UPDATE SET
  search_impr_share = EXCLUDED.search_impr_share,
  search_lost_is_budget = EXCLUDED.search_lost_is_budget,
  search_lost_is_rank = EXCLUDED.search_lost_is_rank,
  search_top_is = EXCLUDED.search_top_is,
  search_abs_top_is = EXCLUDED.search_abs_top_is,
  search_exact_match_is = EXCLUDED.search_exact_match_is,
  search_budget_lost_top_is = EXCLUDED.search_budget_lost_top_is,
  search_budget_lost_abs_top_is = EXCLUDED.search_budget_lost_abs_top_is,
  search_rank_lost_top_is = EXCLUDED.search_rank_lost_top_is,
  search_rank_lost_abs_top_is = EXCLUDED.search_rank_lost_abs_top_is,
  updated_at = now();
```

#### QA — `qa_bounds_aiw`

```javascript
const all = $input.all().map(i => i.json);
const rows = all.find(x => Array.isArray(x.payload))?.payload ?? [];

const map = new Map();

for (const r of rows) {
  const key = [r.external_customer_id, r.window_label, r.date_start, r.date_end].join('|');

  if (!map.has(key)) {
    map.set(key, {
      external_customer_id: String(r.external_customer_id),
      window_label: r.window_label,
      date_start: r.date_start,
      date_end: r.date_end,
      expected_count: 0,
    });
  }
  map.get(key).expected_count += 1;
}

return [{ json: { bounds: [...map.values()] } }];
```

#### QA — `qa_db_counts_aiw`

**queryReplacement:** `{{ JSON.stringify($items("qa_bounds_aiw")[0].json.bounds) }}`

```sql
WITH b AS (
  SELECT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label,
    (r->>'date_start')::date            AS date_start,
    (r->>'date_end')::date              AS date_end,
    (r->>'expected_count')::int         AS expected_count
  FROM jsonb_array_elements($1::jsonb) r
)
SELECT
  b.*,
  (
    SELECT COUNT(*)
    FROM ads.fact_auction_insights_window t
    WHERE t.external_customer_id = b.external_customer_id
      AND t.window_label = b.window_label
      AND t.date_start = b.date_start
      AND t.date_end   = b.date_end
  ) AS actual_count
FROM b
ORDER BY external_customer_id, window_label, date_start, date_end;
```

#### QA — `qa_decide_aiw`

```javascript
let rows = $input.all().map(i => i.json);

if (rows.length === 1 && Array.isArray(rows[0].rows)) rows = rows[0].rows;
if (rows.length === 1 && Array.isArray(rows[0].data)) rows = rows[0].data;

const fails = rows
  .filter(r => Number(r.actual_count) !== Number(r.expected_count) || Number(r.actual_count) === 0)
  .map(r => ({
    external_customer_id: r.external_customer_id,
    window_label: r.window_label,
    date_start: r.date_start,
    date_end: r.date_end,
    notes: JSON.stringify({
      table: "ads.fact_auction_insights_window",
      expected_count: Number(r.expected_count),
      actual_count: Number(r.actual_count),
      reason: Number(r.actual_count) === 0 ? "zero_rows" : "count_mismatch",
    }),
  }))
  .filter(f => f.external_customer_id && f.window_label && f.date_start && f.date_end);

return [{ json: { ok: fails.length === 0, fails } }];
```

#### QA — `log_failures_aiw`

**queryReplacement:** `{{ JSON.stringify($json.fails) }}`

```sql
INSERT INTO ads.analysis_runs
(external_customer_id, window_label, date_start, date_end, notes)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'notes')::text
FROM jsonb_array_elements($1::jsonb) r
WHERE (r->>'external_customer_id') IS NOT NULL
  AND (r->>'window_label') IS NOT NULL
  AND (r->>'date_start') IS NOT NULL
  AND (r->>'date_end') IS NOT NULL;
```

---

### 3.6 `campaign_inventory`

**Estratégia:** UPSERT bulk | **QA:** Não | **executeOnce:** true

#### BQ Read — `extrair_inventory_campanhas` (SQL customizado)

```sql
-- BigQuery (STANDARD SQL) — INVENTORY de campanhas (corrigido)
-- external_customer_id = customer_id (conta filha). _TABLE_SUFFIX no seu caso está vindo como MCC.

WITH campaign_raw AS (
  SELECT
    SAFE_CAST(_TABLE_SUFFIX AS INT64) AS table_suffix_id,
    TO_JSON_STRING(t)                AS j
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.p_ads_Campaign_*` t
),

budget_raw AS (
  SELECT
    SAFE_CAST(_TABLE_SUFFIX AS INT64) AS table_suffix_id,
    TO_JSON_STRING(t)                AS j
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.p_ads_Budget_*` t
),

budget AS (
  SELECT
    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.customer_id'),
        JSON_VALUE(j, '$.customer.id'),
        JSON_VALUE(j, '$.customerId'),
        CAST(table_suffix_id AS STRING)
      ) AS INT64
    ) AS external_customer_id,

    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.budget_id'),
        JSON_VALUE(j, '$.campaign_budget_id'),
        JSON_VALUE(j, '$.id'),
        REGEXP_EXTRACT(JSON_VALUE(j, '$.campaign_budget'), r'(\d+)$'),
        REGEXP_EXTRACT(JSON_VALUE(j, '$.campaignBudget'), r'(\d+)$')
      ) AS INT64
    ) AS budget_id,

    SAFE_DIVIDE(
      SAFE_CAST(
        COALESCE(
          JSON_VALUE(j, '$.amount_micros'),
          JSON_VALUE(j, '$.budget_amount_micros'),
          JSON_VALUE(j, '$.campaign_budget_amount_micros')
        ) AS INT64
      ),
      1000000
    ) AS budget_amount
  FROM budget_raw
),

base AS (
  SELECT
    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.customer_id'),
        JSON_VALUE(j, '$.customer.id'),
        JSON_VALUE(j, '$.customerId'),
        CAST(table_suffix_id AS STRING)
      ) AS INT64
    ) AS external_customer_id,

    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.campaign_id'),
        JSON_VALUE(j, '$.id'),
        JSON_VALUE(j, '$.campaign.id')
      ) AS INT64
    ) AS campaign_id,

    COALESCE(
      JSON_VALUE(j, '$.campaign_name'),
      JSON_VALUE(j, '$.name'),
      JSON_VALUE(j, '$.campaign.name')
    ) AS campaign_name,

    COALESCE(
      JSON_VALUE(j, '$.campaign_advertising_channel_type'),
      JSON_VALUE(j, '$.advertising_channel_type'),
      JSON_VALUE(j, '$.campaign_type'),
      JSON_VALUE(j, '$.campaign.advertising_channel_type'),
      JSON_VALUE(j, '$.campaign.advertisingChannelType')
    ) AS campaign_type,

    COALESCE(
      JSON_VALUE(j, '$.campaign_status'),
      JSON_VALUE(j, '$.status'),
      JSON_VALUE(j, '$.campaign.status')
    ) AS status,

    COALESCE(
      JSON_VALUE(j, '$.campaign_bidding_strategy_type'),
      JSON_VALUE(j, '$.bidding_strategy_type'),
      JSON_VALUE(j, '$.bidding_strategy'),
      JSON_VALUE(j, '$.campaign.bidding_strategy_type'),
      JSON_VALUE(j, '$.campaign.biddingStrategyType')
    ) AS bidding_strategy,

    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.campaign_budget_id'),
        JSON_VALUE(j, '$.campaign_budget'),
        JSON_VALUE(j, '$.budget_id'),
        REGEXP_EXTRACT(JSON_VALUE(j, '$.campaign_campaign_budget'), r'(\d+)$'),
        REGEXP_EXTRACT(JSON_VALUE(j, '$.campaign_campaignBudget'), r'(\d+)$')
      ) AS INT64
    ) AS budget_id,

    SAFE_CAST(COALESCE(JSON_VALUE(j, '$.target_google_search'), JSON_VALUE(j, '$.has_search')) AS BOOL) AS has_search,
    SAFE_CAST(COALESCE(JSON_VALUE(j, '$.target_partner_search_network'), JSON_VALUE(j, '$.has_search_partners')) AS BOOL) AS has_search_partners,
    SAFE_CAST(COALESCE(JSON_VALUE(j, '$.target_content_network'), JSON_VALUE(j, '$.has_display')) AS BOOL) AS has_display,

    COALESCE(JSON_VALUE(j, '$.positive_geo_target_type'), JSON_VALUE(j, '$.geo_mode')) AS geo_mode,

    NULL AS ad_schedule,
    j    AS settings
  FROM campaign_raw
)

SELECT
  b.external_customer_id,
  b.campaign_id,
  b.campaign_name,
  b.campaign_type,
  b.status,
  b.bidding_strategy,
  bud.budget_amount,
  b.has_search,
  b.has_search_partners,
  b.has_display,
  b.geo_mode,
  b.ad_schedule,
  b.settings
FROM base b
LEFT JOIN budget bud
  ON bud.external_customer_id = b.external_customer_id
 AND bud.budget_id = b.budget_id
WHERE b.campaign_id IS NOT NULL
  AND b.external_customer_id IS NOT NULL
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY b.external_customer_id, b.campaign_id
  ORDER BY b.campaign_name DESC
) = 1;
```

#### PG Write — `ads.campaign_inventory`

**queryReplacement:** `{{ JSON.stringify($items("extrair_inventory_campanhas").map(i => i.json)) }}`

```sql
INSERT INTO ads.campaign_inventory (
  external_customer_id,
  campaign_id,
  campaign_name,
  campaign_type,
  status,
  bidding_strategy,
  budget_amount,
  has_search,
  has_search_partners,
  has_display,
  geo_mode,
  ad_schedule,
  settings,
  updated_at
)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'campaign_id')::bigint,
  (r->>'campaign_name')::text,
  NULLIF(r->>'campaign_type','')::text,
  NULLIF(r->>'status','')::text,
  NULLIF(r->>'bidding_strategy','')::text,
  NULLIF(r->>'budget_amount','')::numeric,
  NULLIF(r->>'has_search','')::boolean,
  NULLIF(r->>'has_search_partners','')::boolean,
  NULLIF(r->>'has_display','')::boolean,
  NULLIF(r->>'geo_mode','')::text,
  NULLIF(r->>'ad_schedule','')::jsonb,
  NULLIF(r->>'settings','')::jsonb,
  now()
FROM jsonb_array_elements($1::jsonb) AS r
ON CONFLICT (external_customer_id, campaign_id)
DO UPDATE SET
  campaign_name        = EXCLUDED.campaign_name,
  campaign_type        = EXCLUDED.campaign_type,
  status               = EXCLUDED.status,
  bidding_strategy     = EXCLUDED.bidding_strategy,
  budget_amount        = EXCLUDED.budget_amount,
  has_search           = EXCLUDED.has_search,
  has_search_partners  = EXCLUDED.has_search_partners,
  has_display          = EXCLUDED.has_display,
  geo_mode             = EXCLUDED.geo_mode,
  ad_schedule          = EXCLUDED.ad_schedule,
  settings             = EXCLUDED.settings,
  updated_at           = now();
```

---

### 3.7 `adgroup_inventory`

**Estratégia:** UPSERT | **QA:** Não | **executeOnce:** false (per-batch)

#### BQ Read — `extrair_adgroup_inventory` (SQL customizado)

```sql
-- BigQuery (STANDARD SQL) — INVENTORY de Ad Groups (robusto a variações de schema)

WITH adgroup_raw AS (
  SELECT
    TO_JSON_STRING(t) AS j,
    SAFE_CAST(_TABLE_SUFFIX AS INT64) AS table_suffix
  FROM `gothic-well-487118-r1.Importacao_MCC_Producao.p_ads_AdGroup_*` t
),

base AS (
  SELECT
    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.customer_id'),
        JSON_VALUE(j, '$.customer.id'),
        JSON_VALUE(j, '$.customerId'),
        JSON_VALUE(j, '$.external_customer_id'),
        CAST(table_suffix AS STRING)
      ) AS INT64
    ) AS external_customer_id,

    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.campaign_id'),
        JSON_VALUE(j, '$.campaign.id'),
        JSON_VALUE(j, '$.campaignId')
      ) AS INT64
    ) AS campaign_id,

    SAFE_CAST(
      COALESCE(
        JSON_VALUE(j, '$.ad_group_id'),
        JSON_VALUE(j, '$.adgroup_id'),
        JSON_VALUE(j, '$.ad_group.id'),
        JSON_VALUE(j, '$.adGroup.id'),
        JSON_VALUE(j, '$.id')
      ) AS INT64
    ) AS ad_group_id,

    COALESCE(
      JSON_VALUE(j, '$.ad_group_name'),
      JSON_VALUE(j, '$.ad_group.name'),
      JSON_VALUE(j, '$.adGroup.name'),
      JSON_VALUE(j, '$.name')
    ) AS ad_group_name,

    COALESCE(
      JSON_VALUE(j, '$.ad_group_status'),
      JSON_VALUE(j, '$.ad_group.status'),
      JSON_VALUE(j, '$.adGroup.status'),
      JSON_VALUE(j, '$.status')
    ) AS status,

    NULL AS cpa_target_desired,
    NULL AS final_url,
    j AS settings
  FROM adgroup_raw
)

SELECT
  external_customer_id,
  campaign_id,
  ad_group_id,
  ad_group_name,
  status,
  cpa_target_desired,
  final_url,
  settings
FROM base
WHERE external_customer_id IS NOT NULL
  AND campaign_id IS NOT NULL
  AND ad_group_id IS NOT NULL
  AND ad_group_name IS NOT NULL
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY external_customer_id, ad_group_id
  ORDER BY ad_group_name DESC
) = 1;
```

#### PG Write — `ads.adgroup_inventory`

**queryReplacement:** `{{ JSON.stringify($input.all().map(i => i.json)) }}`

```sql
INSERT INTO ads.adgroup_inventory (
  external_customer_id,
  campaign_id,
  ad_group_id,
  ad_group_name,
  status,
  cpa_target_desired,
  final_url,
  settings,
  updated_at
)
SELECT
  (r->>'external_customer_id')::bigint,
  (r->>'campaign_id')::bigint,
  (r->>'ad_group_id')::bigint,
  (r->>'ad_group_name')::text,
  NULLIF(r->>'status','')::text,
  NULLIF(r->>'cpa_target_desired','')::numeric,
  NULLIF(r->>'final_url','')::text,
  NULLIF(r->>'settings','')::jsonb,
  now()
FROM jsonb_array_elements($1::jsonb) AS r
ON CONFLICT (external_customer_id, ad_group_id)
DO UPDATE SET
  campaign_id        = EXCLUDED.campaign_id,
  ad_group_name      = EXCLUDED.ad_group_name,
  status             = EXCLUDED.status,
  cpa_target_desired = EXCLUDED.cpa_target_desired,
  final_url          = EXCLUDED.final_url,
  settings           = EXCLUDED.settings,
  updated_at         = now();
```

---

### 3.8 `keyword_inventory`

**Estratégia:** UPSERT per-row | **QA:** Não | **executeOnce:** false

#### BQ Read — `canon_keyword_inventory`

```sql
SELECT * FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_keyword_inventory`
```

#### PG Write — `ads.keyword_inventory`

**queryReplacement:** `{{ [$json.external_customer_id, $json.campaign_id, $json.ad_group_id, $json.keyword_id, $json.keyword_text, $json.match_type, $json.status, $json.effective_cpc_bid_micros, $json.quality_score, $json.ad_relevance, $json.landing_page_experience, $json.expected_ctr, $json.first_page_cpc_micros, $json.top_of_page_cpc_micros, $json.first_position_cpc_micros, $json.snapshot_date] }}`

```sql
INSERT INTO ads.keyword_inventory (
  external_customer_id, campaign_id, ad_group_id, keyword_id,
  keyword_text, match_type, status, effective_cpc_bid_micros,
  quality_score, ad_relevance, landing_page_experience, expected_ctr,
  first_page_cpc_micros, top_of_page_cpc_micros, first_position_cpc_micros,
  snapshot_date
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
ON CONFLICT (external_customer_id, ad_group_id, keyword_id)
DO UPDATE SET
  keyword_text = EXCLUDED.keyword_text,
  match_type = EXCLUDED.match_type,
  status = EXCLUDED.status,
  effective_cpc_bid_micros = EXCLUDED.effective_cpc_bid_micros,
  quality_score = EXCLUDED.quality_score,
  ad_relevance = EXCLUDED.ad_relevance,
  landing_page_experience = EXCLUDED.landing_page_experience,
  expected_ctr = EXCLUDED.expected_ctr,
  first_page_cpc_micros = EXCLUDED.first_page_cpc_micros,
  top_of_page_cpc_micros = EXCLUDED.top_of_page_cpc_micros,
  first_position_cpc_micros = EXCLUDED.first_position_cpc_micros,
  snapshot_date = EXCLUDED.snapshot_date,
  updated_at = now();
```

---

### 3.9 `keyword_daily`

**Estratégia:** UPSERT per-row | **QA:** Não | **executeOnce:** false

#### BQ Read — `canon_keyword_daily`

```sql
SELECT * FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_keyword_daily`
```

#### PG Write — `ads.fact_keyword_daily`

**queryReplacement:** `{{ [$json.external_customer_id, $json.date, $json.campaign_id, $json.ad_group_id, $json.keyword_id, $json.impressions, $json.clicks, $json.cost_micros, $json.conversions] }}`

```sql
INSERT INTO ads.fact_keyword_daily (
  external_customer_id, date, campaign_id, ad_group_id, keyword_id,
  impressions, clicks, cost_micros, conversions
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
ON CONFLICT (external_customer_id, date, keyword_id)
DO UPDATE SET
  campaign_id = EXCLUDED.campaign_id,
  ad_group_id = EXCLUDED.ad_group_id,
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  cost_micros = EXCLUDED.cost_micros,
  conversions = EXCLUDED.conversions,
  updated_at = now();
```

---

### 3.10 `geo_performance_window`

**Estratégia:** DELETE+INSERT | **QA:** Não | **executeOnce:** true

#### BQ Read — `canon_geo_performance_window`

```sql
SELECT * FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_geo_performance_window`
```

#### Code — `pack_gpw_payload`

```javascript
const items = $input.all().map(i => i.json);
return [{ json: { payload: JSON.stringify(items) } }];
```

#### PG Write — `ads.fact_geo_performance_window`

**queryReplacement:** `{{ [$json.payload] }}`

```sql
-- 1) DELETE (limpa todo o window_label da conta — FIX v3.2)
WITH bounds AS (
  SELECT DISTINCT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label
  FROM jsonb_array_elements($1::jsonb) r
)
DELETE FROM ads.fact_geo_performance_window t
USING bounds b
WHERE t.external_customer_id = b.external_customer_id
  AND t.window_label = b.window_label;
-- 2) INSERT
INSERT INTO ads.fact_geo_performance_window (
  window_label, date_start, date_end,
  external_customer_id, campaign_id, geo_id,
  location_name, canonical_name, location_type, user_location_type,
  impressions, clicks, cost_micros, conversions
)
SELECT
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'external_customer_id')::bigint,
  (r->>'campaign_id')::bigint,
  (r->>'geo_id')::bigint,
  NULLIF(r->>'location_name','')::text,
  NULLIF(r->>'canonical_name','')::text,
  NULLIF(r->>'location_type','')::text,
  NULLIF(r->>'user_location_type','')::text,
  NULLIF(r->>'impressions','')::bigint,
  NULLIF(r->>'clicks','')::bigint,
  NULLIF(r->>'cost_micros','')::bigint,
  NULLIF(r->>'conversions','')::numeric
FROM jsonb_array_elements($1::jsonb) r;
```

---

### 3.11 `ad_copy_inventory`

**Estratégia:** UPSERT per-row | **QA:** Não | **executeOnce:** false

#### BQ Read — `canon_ad_copy_inventory`

```sql
SELECT * FROM gothic-well-487118-r1.Importacao_MCC_Producao.canon_ad_copy_inventory
```

#### PG Write — `ads.ad_copy_inventory`

**queryReplacement:** `{{ $json.external_customer_id }},{{ $json.campaign_id }},{{ $json.ad_group_id }},{{ $json.ad_id }},{{ $json.ad_type }},{{ $json.status }},{{ $json.ad_strength }},{{ $json.headlines_raw }},{{ $json.descriptions_raw }},{{ $json.path1 }},{{ $json.path2 }},{{ $json.final_urls }},{{ $json.snapshot_date }}`

```sql
INSERT INTO ads.ad_copy_inventory (
  external_customer_id, campaign_id, ad_group_id, ad_id,
  ad_type, status, ad_strength,
  headlines_raw, descriptions_raw, path1, path2, final_urls,
  snapshot_date
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
ON CONFLICT (external_customer_id, ad_group_id, ad_id) DO UPDATE SET
  status = EXCLUDED.status,
  ad_strength = EXCLUDED.ad_strength,
  headlines_raw = EXCLUDED.headlines_raw,
  descriptions_raw = EXCLUDED.descriptions_raw,
  path1 = EXCLUDED.path1,
  path2 = EXCLUDED.path2,
  final_urls = EXCLUDED.final_urls,
  snapshot_date = EXCLUDED.snapshot_date;
```

---

### 3.12 `hourly_campaign_window`

**Estratégia:** DELETE+INSERT | **QA:** Não | **executeOnce:** true

#### BQ Read — `canon_hourly_campaign_window`

```sql
SELECT * FROM gothic-well-487118-r1.Importacao_MCC_Producao.canon_hourly_campaign_window
```

#### Code — `pack_hpw_payload`

```javascript
const items = $input.all().map(i => i.json);
return [{ json: { payload: JSON.stringify(items) } }];
```

#### PG Write — `ads.fact_hourly_campaign_window`

**queryReplacement:** `{{ [$json.payload] }}`

```sql
-- DELETE (limpa todo o window_label da conta — FIX v3.2)
WITH bounds AS (
  SELECT DISTINCT
    (r->>'external_customer_id')::bigint AS external_customer_id,
    (r->>'window_label')::text          AS window_label
  FROM jsonb_array_elements($1::jsonb) r
)
DELETE FROM ads.fact_hourly_campaign_window t
USING bounds b
WHERE t.external_customer_id = b.external_customer_id
  AND t.window_label = b.window_label;

INSERT INTO ads.fact_hourly_campaign_window (
  window_label, date_start, date_end,
  external_customer_id, campaign_id,
  hour_of_day, day_of_week,
  impressions, clicks, cost_micros, conversions
)
SELECT
  (r->>'window_label')::text,
  (r->>'date_start')::date,
  (r->>'date_end')::date,
  (r->>'external_customer_id')::bigint,
  (r->>'campaign_id')::bigint,
  (r->>'hour_of_day')::integer,
  (r->>'day_of_week')::text,
  NULLIF(r->>'impressions','')::bigint,
  NULLIF(r->>'clicks','')::bigint,
  NULLIF(r->>'cost_micros','')::bigint,
  NULLIF(r->>'conversions','')::numeric
FROM jsonb_array_elements($1::jsonb) r;
```

---

### 3.13 `negatives_inventory`

**Estratégia:** DELETE+INSERT (full refresh) | **QA:** Não | **executeOnce:** true

#### BQ Read — `canon_negatives_inventory`

```sql
SELECT * FROM `gothic-well-487118-r1.Importacao_MCC_Producao.canon_negatives_inventory`
```

#### Code — `pack_neg_payload`

```javascript
const items = $input.all().map(i => i.json);
return [{ json: { payload: JSON.stringify(items) } }];
```

#### PG Write — `ads.negatives_inventory`

**queryReplacement:** `{{ [$json.payload] }}`

```sql
-- DELETE all existing
DELETE FROM ads.negatives_inventory;

-- INSERT new
INSERT INTO ads.negatives_inventory (
  external_customer_id, campaign_id, campaign_name,
  ad_group_id, ad_group_name, source_type,
  shared_set_id, shared_set_name,
  keyword_text, match_type, updated_at
)
SELECT
  (r->>'customer_id')::bigint,
  (r->>'campaign_id')::bigint,
  NULLIF(r->>'campaign_name','')::text,
  NULLIF(r->>'ad_group_id','')::bigint,
  NULLIF(r->>'ad_group_name','')::text,
  (r->>'source_type')::text,
  NULLIF(r->>'shared_set_id','')::bigint,
  NULLIF(r->>'shared_set_name','')::text,
  (r->>'keyword_text')::text,
  (r->>'match_type')::text,
  now()
FROM jsonb_array_elements($1::jsonb) r;
```

**Nota:** Full refresh (DELETE ALL + INSERT ALL) em vez de DELETE por bounds — negativas são um snapshot completo do estado atual, sem window_label.

---

## 4. Padrões Técnicos

### 4.1 Passagem de Parâmetros (BQ → PG)

| Padrão | Exemplo | Usado em |
|---|---|---|
| **Bulk jsonb** | `JSON.stringify($items("node").map(i => i.json))` → `$1::jsonb` | campaign_daily, adgroup_daily, conversions, auction_insights, campaign_inventory |
| **Bulk packed** | `$json.payload` (já stringificado no pack node) | search_terms, geo, hourly |
| **Per-row positional** | `[$json.field1, $json.field2, ...]` ou `{{ $json.field1 }},{{ $json.field2 }}` | keyword_inventory, keyword_daily, ad_copy |

### 4.2 Estratégia de Escrita

| Estratégia | Quando usar | Branches |
|---|---|---|
| **UPSERT (ON CONFLICT)** | Dados que são atualizados mas nunca removidos | Métricas diárias, inventários, auction insights |
| **DELETE+INSERT** | Dados que podem desaparecer entre execuções | Search terms (Google remove baixo volume), geo, hourly |

### 4.3 QA Pipeline

O QA funciona assim para as 3 branches que o implementam:

1. **qa_bounds** — Agrupa payload por `(external_customer_id, window_label, date_start, date_end)`, conta `expected_count`
2. **qa_db_counts** — Consulta Supabase com mesmos bounds, retorna `actual_count`
3. **qa_decide** — Compara: se `expected != actual` ou `actual == 0`, marca como `fail`
4. **if_failed** — Condicional: se há falhas, prossegue para log
5. **log_failures** — Insere em `ads.analysis_runs` com detalhes do erro (table, expected, actual, reason)

---

## 5. Observações e Riscos

### 5.1 Branches sem QA (10 de 13)

As branches campaign_daily, adgroup_daily, inventários, keyword, geo, ad_copy e hourly **não têm verificação pós-escrita**. Se a inserção falhar silenciosamente, o dado fica defasado sem alerta.

### 5.2 Per-row vs Bulk

Keyword_inventory, keyword_daily e ad_copy_inventory usam `executeOnce=false` (uma query por registro). Com ~130 keywords e ~30 dias de dados, isso gera ~3.900 queries por execução para keyword_daily. Considerar migrar para bulk.

### 5.3 Campaign/AdGroup Inventory — SQL não-canônico

Essas duas branches usam SQL customizado com `TO_JSON_STRING` + `JSON_VALUE` em vez de canon views. O motivo é que o Data Transfer usa schemas variáveis e o JSON parsing com múltiplos fallbacks dá robustez. Porém, não há canon view correspondente no BigQuery.

### 5.4 Trigger Manual

O workflow é disparado manualmente. Para produção, considerar Schedule Trigger (ex: `0 8 * * *` para rodar diariamente às 8h NZST).

---

## 6. Grafo de Conexões (JSON)

```
Trigger → [12 branches paralelas]

canon_campaign_daily → fact_campaign_daily
canon_adgroup_daily → fact_adgroup_daily

canon_conversions_by_action_window → pack_caw_payload → gate_payload_count_caw
  → fact_conversions_by_action_window → Merge_caw → qa_bounds_caw → qa_db_counts_caw
  → qa_decide_caw → if_failed_caw → log_failures_caw
  (pack_caw_payload também → Merge_caw input 2)

canon_search_terms_window → pack_stw_payload → gate_payload_count
  → fact_search_terms_window → Merge → qa_bounds_stw → qa_db_counts_stw
  → qa_decide_stw → if_failed → log_failures_stw
  (pack_stw_payload também → Merge input 2)

canon_auction_insights_window → pack_aiw_payload → gate_payload_count1
  → fact_auction_insights_window → Merge_aiw → qa_bounds_aiw → qa_db_counts_aiw
  → qa_decide_aiw → if_failed_aiw → log_failures_aiw
  (pack_aiw_payload também → Merge_aiw input 2)

extrair_inventory_campanhas → ads.campaign_inventory
extrair_adgroup_inventory → ads.adgroup_inventory

canon_keyword_inventory → ads.keyword_inventory
canon_keyword_daily → ads.fact_keyword_daily

canon_geo_performance_window → pack_gpw_payload → ads.fact_geo_performance_window
canon_ad_copy_inventory → ads.ad_copy_inventory
canon_hourly_campaign_window → pack_hpw_payload → ads.fact_hourly_campaign_window

canon_negatives_inventory → pack_neg_payload → ads.negatives_inventory
```

---

*hub3ps-ads-ops • Workflow n8n • Fevereiro 2026*
