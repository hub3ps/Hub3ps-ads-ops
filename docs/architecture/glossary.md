# Glossário Técnico

| Termo | Definição |
|---|---|
| MCC | Manager Customer Center — conta gerenciadora do Google Ads com múltiplas contas filhas |
| external_customer_id | ID numérico da conta Google Ads filha (bigint). Chave de negócio em todo o schema ads. |
| cost_micros | Custo em micro-unidades (1 NZD = 1.000.000 micros). Dividir por 1.000.000 para valor real. |
| IS (Impression Share) | Percentual de impressões recebidas em relação ao total elegível. |
| LAST_7D / LAST_30D | Labels das janelas temporais fixas (ontem - 6 dias e ontem - 29 dias) |
| window_label | Coluna que identifica a janela temporal nas fact tables de janela |
| canon_* | Prefixo das views customizadas no BigQuery criadas por Guilherme |
| p_ads_* | Prefixo das tabelas particionadas reais no BigQuery (Data Transfer Service) |
| UPSERT | INSERT … ON CONFLICT DO UPDATE — idempotente |
| DELETE+INSERT | Estratégia que remove todos os registros de um (external_customer_id, window_label) e insere novamente. Garante snapshot mais recente. |
| QA nodes | Conjunto de nodes no n8n que validam contagem de rows inseridos vs esperados |
| GAQL | Google Ads Query Language — usada para exports customizados |
| Weighted Average IS | Média de IS ponderada pelas impressões diárias da campanha |
| ENABLED cascade | Filtro que só inclui entidades ativas: campanha ENABLED → ad group ENABLED → keyword ENABLED |
| Quality Score (QS) | Métrica do Google (1-10) que avalia relevância da keyword. 0 = sem dados suficientes. Componentes: ad_relevance, landing_page_experience, expected_ctr |
| shared_list (negative keywords) | Lista de palavras-chave negativas criada no nível da conta Google Ads e aplicada a múltiplas campanhas. Exportada via GAQL customizado (Data Transfer não cobre nativamente). |
| source_type | Coluna da negatives_inventory que indica a origem da negativa: AD_GROUP, CAMPAIGN ou SHARED_LIST. |
| matched_keyword | Keyword que disparou o match com um search term. Obtido via criterion_id no resource name do SearchQueryStats. |
| negatives_inventory | Tabela denormalizada no Supabase com todas as keywords negativas ativas. 3 source_types: AD_GROUP (negativas de ad group), CAMPAIGN (negativas de campanha), SHARED_LIST (negativas de listas compartilhadas, expandidas por campanha vinculada). Pipeline: DELETE+INSERT diário. |
| keyword_criterion_id | ID numérico da keyword (ad_group_criterion_criterion_id). Extraído do segments_keyword_ad_group_criterion via regex. |
| geo_id | ID numérico do geo target (criteria_id). Extraído via REGEXP do resource name. Resolve via ref_geo_target_constants. |
| ad_strength | Métrica do Google para RSAs (POOR/AVERAGE/GOOD/EXCELLENT). Baseada em diversidade de headlines/descriptions. |
| assetPerformanceLabel | Performance individual de headline/description: LEARNING, PENDING, LOW, GOOD, BEST. |
