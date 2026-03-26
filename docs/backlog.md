# Backlog — Pendências e Próximos Passos

---

## Pipeline de Dados — Gaps

| # | Dataset | BQ disponível | Prioridade | Status |
|---|---|---|---|---|
| 1 | ~~AdGroup metrics~~ | — | — | ✅ Implementado |
| 2 | ~~Keywords + QS~~ | — | — | ✅ Implementado |
| 3 | Landing Pages | ads_LandingPageStats_* | BAIXA | ⏸ Adiado (sem conversões, valor limitado) |
| 4 | ~~Locations~~ | — | — | ✅ Implementado v3 |
| 5 | Search Terms diário | ads_SearchQueryStats_* | MÉDIA | ⚠ Temos janelas 7d/30d, sem granularidade diária |
| 6 | ~~Auction Insights concorrentes~~ | — | — | ❌ Descartado (indisponível no BQ export) |
| 7 | ~~Ad Schedule~~ | — | — | ✅ Implementado v3 |
| 8 | ~~Ad Copy (RSA)~~ | — | — | ✅ Implementado v3 |
| 9 | Assets | ads_Asset + ads_CampaignAssetStats | BAIXA | ⏸ Dados limitados |
| 10 | ~~Negativas (pipeline automatizado)~~ | — | — | ✅ Implementado v3.3 (BQ GAQL + canon view + Supabase flat + n8n branch 13) |

## Operacional

| # | Ação | Prioridade | Status |
|---|---|---|---|
| 1 | ~~Configurar Schedule Trigger no n8n~~ | — | ✅ Configurado (21:00 UTC diário) |
| 2 | Adicionar QA nos branches 1 e 2 | MÉDIA | Pendente |
| 3 | Limpar schema public | BAIXA | Pendente |
| 4 | Interface para revisar recomendações | MÉDIA | Pendente |
| 5 | Template de report quinzenal/mensal | MÉDIA | Pendente |
| 6 | QA check pós-pipeline: verificar datas mais recentes em cada fact table e alertar defasagem | MÉDIA | Pendente |
| 7 | Bloco _metadata no payload com datas efetivas por fonte para auditoria temporal | BAIXA | Pendente |

## Melhorias no Repositório

| # | Ação | Prioridade | Status |
|---|---|---|---|
| 1 | Adicionar DDL completo do Supabase em `schemas/supabase-ddl.sql` | MÉDIA | Pendente |
| 2 | ~~Adicionar prompt v8 em `prompts/claude-project-system-v8.md`~~ | — | ✅ Adicionado |
| 3 | Documentar runbooks operacionais (análise semanal, sync, reports) | MÉDIA | Pendente |
| 4 | Criar ADRs para decisões históricas mais relevantes | BAIXA | Pendente |
| 5 | ~~Schema Supabase com INFORMATION_SCHEMA~~ | — | ✅ Adicionado |
| 6 | ~~Schema BigQuery com SQL completo~~ | — | ✅ Adicionado |
| 7 | ~~Workflow n8n com SQLs completos~~ | — | ✅ Adicionado |
| 8 | ~~Template docbase para novos clientes~~ | — | ✅ Adicionado |
| 9 | ~~Project Knowledge v2 (guia operacional)~~ | — | ✅ Adicionado |
| 10 | ~~Report template HTML~~ | — | ✅ Adicionado |
| 11 | ~~System prompt do Claude Project~~ | — | ✅ Adicionado |
