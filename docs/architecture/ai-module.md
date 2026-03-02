# Módulo de IA — Análise e Recomendações

O módulo de IA opera via Claude Project com payload JSON gerado por uma stored function no Supabase.

---

## Arquitetura

| Etapa | Descrição |
|---|---|
| 1. Coleta | Function `ads.build_analysis_payload(external_customer_id)` agrega todos os dados |
| 2. Montagem | JSON estruturado com documentos, inventário, métricas, keywords, ad copy, geo, hourly, search terms, IS, conversions, negativas |
| 3. Chamada | Payload colado manualmente no Claude Project com prompt v8 |
| 4. Análise | IA retorna: Executive Summary, Dashboard, Governance Violations, Checklist de Otimizações |
| 5. Execução | Guilherme revisa e executa no Google Ads |
| 6. Registro | Otimizações no optimization_log → fecha feedback loop |

---

## Payload Function: ads.build_analysis_payload() — v8

Function SQL STABLE que retorna JSONB. Usa filtro ENABLED cascade em todos os blocos.

### Regra de Âncora Temporal
Blocos de métricas diárias usam `MAX(date)` da `fact_campaign_daily` como âncora via CTE `anchor`, não `CURRENT_DATE`. Alinhado com as canon views do BQ.

### Regra de Filtro
Só envia dados de entidades em veiculação real (ENABLED cascade). Negativas sem filtro.

### Blocos do Payload

| Bloco | Fonte | Descrição |
|---|---|---|
| account | gads_accounts + clients | Nome, ID, currency, timezone |
| documents | documents (conta + MCC group_reorganization) | playbook, config_inventory, data_contract, history_ops, group_reorganization |
| conversion_contract | conversion_actions_contract | Ações de conversão, primárias/secundárias |
| campaigns | campaign_inventory (ENABLED) | Inventário de campanhas ativas |
| ad_groups | adgroup_inventory (ENABLED cascade) | Inventário de ad groups ativos |
| keywords | keyword_inventory (ENABLED cascade) | Keywords ativas com QS e CPC estimates |
| ad_copy | ad_copy_inventory (ENABLED cascade) | RSAs ativas com headlines, descriptions, ad_strength *(v3)* |
| metrics_campaigns_7d / 30d | fact_campaign_daily (ENABLED) | Métricas agregadas por campanha |
| metrics_adgroups_7d / 30d | fact_adgroup_daily (ENABLED cascade) | Métricas agregadas por ad group |
| metrics_keywords_7d | fact_keyword_daily + keyword_inventory (ENABLED cascade) | Métricas 7 dias com texto e match_type |
| geo_performance_30d | fact_geo_performance_window (ENABLED, top 30 by cost) | Performance por localidade *(v3)* |
| hourly_performance_7d | fact_hourly_campaign_window (ENABLED) | Métricas por hora+dia da semana *(v3)* |
| auction_insights | fact_auction_insights_window (ENABLED) | IS, lost budget, lost rank |
| conversions_by_action | fact_conversions_by_action_window (ENABLED) | Conversões por action name, 7d e 30d |
| search_terms_top50_cost | fact_search_terms_window (ENABLED, LAST_30D) | Top 50 por custo + matched_keyword |
| search_terms_top30_conversions | fact_search_terms_window (ENABLED, LAST_30D) | Top 30 por conversões |
| search_terms_wasted_spend | fact_search_terms_window (ENABLED, LAST_30D) | Custo > NZD 5, zero conversões |
| negative_keywords | negatives_sets + negatives_items (sem filtro) | Todas negativas: scope, applied_to, keywords |

### Métricas Calculadas na Function
- CPA = cost / conversions
- CTR = clicks / impressions × 100
- Conv rate = conversions / clicks × 100

### Métricas que NÃO são Calculadas (vêm prontas)
- Impression Share, Lost IS, Top IS, Abs Top IS
- Quality Score e componentes
- Attribution fracionada de conversões

### Fixes v3.2
- `ad_copy.final_urls` convertido para JSONB via `::jsonb`
- `ad_copy.path1/path2` tratamento `NULLIF(x, 'null')`
- `conversions_by_action.cost_nzd` removido do payload (sempre NULL)
- `search_terms_top30_conversions`: adicionado campo `window_label`

---

## Prompt do Claude Project — v8

O prompt define:

- **Papel:** Analista sênior de Google Ads especializado em clínicas odontológicas NZ
- **Contexto do grupo:** Clínicas do mesmo dono com papéis exclusivos (reorganização estratégica)
- **Sistema de fases:** Fase 1 (Reorganização), Fase 2 (Estabilização), Fase 3 (Manutenção) — cada fase LIMITA o que a IA pode recomendar
- **Processo de análise:** 10 passos incluindo Diagnóstico IS, Performance campanha/adgroup, Keywords/QS, Ad Copy/RSA, Geo, Ad Schedule, Conversões, Search Terms, Governança, Alinhamento com reorganização
- **Regras de output:** Dashboard com tabelas, Governance Violations, Checklist numerado com impacto em NZD, projeção de CPA, critério de sucesso com prazo. 17 restrições obrigatórias
- **Regras críticas:** NUNCA recomendar negativa que já existe; NUNCA recomendar keyword existente; NUNCA pausar keyword inexistente; preventivos marcados com tag [PREVENTIVO]

> O texto completo do prompt está em `prompts/claude-project-system-v8.md`

---

## Ciclo de Vida das Recomendações

| Status | Significado |
|---|---|
| PROPOSED | Gerada pela IA, aguardando revisão |
| APPROVED | Aprovado para execução |
| IMPLEMENTED | Executada → change_log + optimization_log |
| REJECTED | Descartada com justificativa |

---

## Feedback Loop

O `optimization_log` alimenta os campos `recent_optimizations` e `skipped_actions` do payload da próxima análise, fechando o loop:

```
Análise IA → Otimizações → optimization_log → Próximo payload → Próxima análise
```
