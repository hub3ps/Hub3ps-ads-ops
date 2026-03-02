# HUB3PS ADS OPS

Sistema de análise automatizada de Google Ads com IA para clínicas odontológicas na Nova Zelândia.

## Arquitetura (3 camadas)

```
Google Ads → BigQuery (canon views) → n8n (ETL) → Supabase (schema ads) → Claude Project (análise IA)
```

- **BigQuery**: Projeto `gothic-well-487118-r1`, dataset `Importacao_MCC_Producao`. 10 canon views customizadas + GAQL para Impression Share.
- **n8n**: 12 branches paralelos, trigger manual. Estratégias: UPSERT (maioria) e DELETE+INSERT (search terms, geo, hourly).
- **Supabase**: Schema `ads`. Chave de negócio: `external_customer_id` (bigint). Pivô central: `gads_accounts`.
- **Claude Project**: Recebe payload JSON da function `ads.build_analysis_payload()`. Prompt v8, análise em 10 passos.

## Clientes

Todas as contas são clínicas odontológicas NZ do mesmo dono, sob MCC 2135330960. Moeda: NZD. Timezone: Pacific/Auckland.

## Regras Críticas

- **Âncora temporal**: Todas as views e a payload function usam `MAX(date)` da tabela fonte, nunca `CURRENT_DATE()`.
- **Filtro ENABLED cascade**: Só entidades ativas (campanha → ad group → keyword/ad ENABLED). Negativas sem filtro.
- **Impression Share**: Vem do GAQL customizado (`p_ads_gaql_*`), não do export padrão. Média ponderada por impressões.
- **cost_micros**: Dividir por 1.000.000 para NZD.

## Estrutura deste Repositório

```
CLAUDE.md                          ← Você está aqui (overview para IA)
docs/
  architecture/
    overview.md                    ← Visão geral detalhada do sistema
    bigquery-schema.md             ← Views canon, tabelas base, SQL completo
    supabase-schema.md             ← Todas as tabelas do schema ads
    n8n-workflows.md               ← 12 branches do ETL, QA, estratégias de load
    ai-module.md                   ← Payload function, prompt, ciclo de recomendações
    glossary.md                    ← Termos técnicos do projeto
  operations/
    project-knowledge-v2.md        ← Guia operacional: IDs, mapeamentos, fluxos, formatos, restrições
  decisions/                       ← ADRs (Architecture Decision Records)
    _TEMPLATE.md                   ← Template para novas decisões
  runbooks/                        ← Procedimentos operacionais
  backlog.md                       ← Pendências e próximos passos
  changelog.md                     ← Histórico de mudanças por versão
prompts/
  claude-project-system-v8.md      ← System prompt do Claude Project (Ads Ops)
templates/
  template-docbase-v3.md           ← Template para criar docs base de novos clientes
  report-template-reference.html   ← Template HTML para relatórios de otimização
schemas/
  supabase-ddl.sql                 ← DDL do banco (quando disponível)
```

## Como usar este repo com IA

**Princípio: envie apenas o CLAUDE.md + o módulo relevante para a tarefa.**

| Tarefa | Arquivos necessários |
|---|---|
| Ajustar view no BigQuery | CLAUDE.md + `bigquery-schema.md` |
| Alterar tabela no Supabase | CLAUDE.md + `supabase-schema.md` |
| Modificar fluxo n8n | CLAUDE.md + `n8n-workflows.md` |
| Melhorar prompt/payload da IA | CLAUDE.md + `ai-module.md` + `project-knowledge-v2.md` |
| Configurar Claude Project | CLAUDE.md + `prompts/claude-project-system-v8.md` + `project-knowledge-v2.md` |
| Gerar relatório de otimização | `project-knowledge-v2.md` + `templates/report-template-reference.html` |
| Criar doc base de novo cliente | CLAUDE.md + `templates/template-docbase-v3.md` |
| Revisar pendências | CLAUDE.md + `backlog.md` |
| Entender uma decisão passada | CLAUDE.md + ADR relevante em `decisions/` |

## Sobre os documentos de schema

- **supabase-schema.md**: Extraído direto do `INFORMATION_SCHEMA`. Inclui tipos, nullability, defaults, unique constraints e indexes.
- **bigquery-schema.md**: SQL extraído direto do `INFORMATION_SCHEMA.VIEWS` + `TABLES`. Inclui SQLs completos das 10 canon views.
- **n8n-workflows.md**: Extraído do JSON exportado do n8n. Inclui SQLs completos de leitura (BQ) e escrita (PG) de todos os 12 branches.

## Sobre o Claude Project (IA de análise)

O Claude Project usa 3 arquivos para operar:

1. **`prompts/claude-project-system-v8.md`** — System prompt (regras fundamentais, fluxo resumido, restrições)
2. **`docs/operations/project-knowledge-v2.md`** — Guia operacional completo (IDs de clientes/ClickUp, mapeamento Supabase↔ClickUp, formato de tarefas, pipeline de sync, template de relatório, revisão de docs)
3. **`templates/report-template-reference.html`** — Template visual HTML para relatórios de otimização

O `ai-module.md` documenta a arquitetura interna (payload function, blocos de dados, feedback loop). O `project-knowledge-v2.md` documenta como o Claude Project **opera** no dia a dia.

## Versionamento

- Versão atual da documentação: **v3.2** (Fevereiro 2026)
- Ao fazer mudanças estruturais, atualizar o módulo correspondente + `changelog.md`
- Para decisões arquiteturais, criar ADR em `decisions/`
