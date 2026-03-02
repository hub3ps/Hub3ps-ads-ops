# Changelog

Histórico de mudanças no projeto hub3ps-ads-ops.

---

## v3.2 — Fevereiro 2026

### Fixes
- `ad_copy.final_urls` convertido para JSONB via `::jsonb` (era string JSON escapada)
- `ad_copy.path1/path2` tratamento `NULLIF(x, 'null')` para converter string literal "null" em NULL real
- `conversions_by_action.cost_nzd` removido do payload (campo perpetuamente NULL — API não exporta custo por ação)
- `search_terms_top30_conversions`: adicionado campo `window_label` que estava ausente
- DELETE+INSERT corrigido em geo_performance, hourly_campaign e search_terms: removido date_start/date_end do DELETE para evitar duplicatas entre date ranges

### Documentação
- Repositório modular criado (esta estrutura)
- Schema BigQuery documentado com SQL completo extraído do INFORMATION_SCHEMA

## v3.0 — Fevereiro 2026

### Novos Datasets
- Geo Performance (`canon_geo_performance_window` → `fact_geo_performance_window`)
- Hourly Campaign (`canon_hourly_campaign_window` → `fact_hourly_campaign_window`)
- Ad Copy Inventory (`canon_ad_copy_inventory` → `ad_copy_inventory`)

### Novos Branches n8n
- Branch 10: Geo Performance (DELETE+INSERT)
- Branch 11: Hourly Campaign (DELETE+INSERT)
- Branch 12: Ad Copy Inventory (UPSERT)

### Tabela de Referência
- `ref_geo_target_constants` adicionada (upload manual do CSV Google)

### Payload Function
- Novos blocos: ad_copy, geo_performance_30d, hourly_performance_7d
- Prompt atualizado para 10 passos de análise (adicionou Geo, Ad Schedule, Ad Copy)

### Supabase
- `optimization_log` criado para feedback loop pós-análise

## v2.0

### Novos Datasets
- Keyword Inventory (`canon_keyword_inventory` → `keyword_inventory`)
- Keyword Daily (`canon_keyword_daily` → `fact_keyword_daily`)
- Search Terms com `matched_keyword` e `keyword_criterion_id`

### Branches n8n
- Branch 8: Keyword Inventory (UPSERT)
- Branch 9: Keyword Daily (UPSERT)

### Payload Function
- Novos blocos: keywords, metrics_keywords_7d
- Search terms com matched_keyword e keyword_criterion_id na PK

## v1.0

### Implementação Inicial
- Pipeline BQ → n8n → Supabase para campanhas e ad groups
- 7 branches n8n (campaign daily, adgroup daily, conversions, search terms, auction insights, campaign inventory, adgroup inventory)
- Claude Project com prompt inicial
- Schema ads criado no Supabase
