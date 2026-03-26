# Visão Geral do Sistema

**hub3ps-ads-ops** — Sistema de Análise Automatizada de Google Ads com IA

Versão 3.2 • Fevereiro 2026

---

## Arquitetura Macro

| Camada | Tecnologia | Função |
|---|---|---|
| Fonte de dados | Google Ads → BigQuery | Export automático nativo MCC + 3 transferências GAQL customizadas (Impression Share, Campaign Negatives, Shared Negatives) |
| Transformação BQ | BigQuery Views (canon_*) | Agrega e normaliza dados em janelas LAST_7D / LAST_30D e snapshots diários |
| Orquestração | n8n (acionado manualmente) | Lê views BQ → grava no schema ads.* do Supabase com UPSERT + QA |
| Banco operacional | Supabase / PostgreSQL (schema ads) | Armazena métricas, inventário, keywords, negativas, recomendações, change log e docs |
| IA / Análise | Claude (via Claude Project) | Recebe payload JSON completo → gera análise + otimizações prontas |
| Output | Report PDF/Word + histórico no DB | Entregável ao cliente e registro de tudo no banco |

## Contexto de Clientes

- Todos os clientes atuais são clínicas odontológicas na Nova Zelândia
- Pertencentes ao mesmo dono — estrutura multi-conta sob um único MCC
- Moeda: NZD | Timezone: Pacific/Auckland | Idioma dos anúncios: inglês
- MCC ID (BigQuery suffix): 2135330960

## Fluxo de Dados Completo

```
[Google Ads MCC]
     │
     ├── Data Transfer Service (diário) ──► p_ads_* tabelas particionadas
     │                                          │
     │                                     canon_* views (agregação + janelas)
     │                                          │
     └── GAQL customizado (IS) ──────────► p_ads_gaql_* ──► canon_auction_insights_window
                                                │
                                           [n8n - 13 branches paralelos]
                                                │
                                           [Supabase schema ads]
                                                │
                                      ads.build_analysis_payload()
                                                │
                                        [Claude Project - Prompt v8]
                                                │
                                     Análise + Checklist de Otimizações
                                                │
                                    [Execução manual no Google Ads]
                                                │
                                      optimization_log + change_log
```

## Regras Fundamentais

### Âncora Temporal
Todas as views canon e a payload function usam `MAX(date)` da tabela fonte como âncora, nunca `CURRENT_DATE()`. Garante que janelas refletem dados reais — evita incluir dias sem ingestão.

### Filtro ENABLED Cascade
Só dados de entidades em veiculação real:
- Campanhas: status = 'ENABLED'
- Ad Groups: campanha ENABLED + ad group ENABLED
- Keywords: campanha ENABLED + ad group ENABLED + keyword ENABLED
- Negativas: Campanha ENABLED + Ad Group ENABLED (para ad group level). Shared lists: vínculo ENABLED + campanha ENABLED.

### Impression Share
Vem exclusivamente do GAQL customizado (`p_ads_gaql_campaign_is_daily_*`), não do export padrão. Calculado como média ponderada por impressões diárias.

### Custo
`cost_micros` = micro-unidades. Dividir por 1.000.000 para NZD.

## Infraestrutura

| Propriedade | Valor |
|---|---|
| Projeto GCP | gothic-well-487118-r1 (alias: Google Ads AI) |
| Dataset BQ | Importacao_MCC_Producao |
| Região BQ | southamerica-east1 (São Paulo) |
| Conta de serviço BQ | Google Service Account - BigQuery (credential ID: uIQgJYp6KcQ8LuzA) |
| Credencial n8n Postgres | Postgres - hub3ps-ads-ops (ID: Gte89jJAAdXlmybZ) |
| Supabase Schema | ads (principal) / public (legado - a ser removido) |

## Documentos Relacionados

- [BigQuery Schema](bigquery-schema.md) — Views canon, tabelas base, SQL completo
- [Supabase Schema](supabase-schema.md) — Todas as tabelas do schema ads
- [n8n Workflows](n8n-workflows.md) — ETL detalhado por branch
- [Módulo IA](ai-module.md) — Payload function, prompt, ciclo de recomendações
- [Glossário](glossary.md) — Termos técnicos do projeto
