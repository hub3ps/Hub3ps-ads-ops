# hub3ps-ads-ops

Sistema de Análise Automatizada de Google Ads com IA para clínicas odontológicas na Nova Zelândia.

## Stack

- **BigQuery** — Fonte de dados (Data Transfer + GAQL customizado)
- **n8n** — Orquestração ETL (12 branches paralelos)
- **Supabase** — Banco operacional (PostgreSQL, schema `ads`)
- **Claude Project** — Análise IA e geração de recomendações

## Documentação

Toda a documentação vive em `docs/` e é modular — cada arquivo cobre um aspecto específico do sistema.

| Documento | Conteúdo |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Overview conciso para contexto de IA |
| [docs/architecture/overview.md](docs/architecture/overview.md) | Visão geral detalhada |
| [docs/architecture/bigquery-schema.md](docs/architecture/bigquery-schema.md) | Views canon, tabelas base, SQL completo |
| [docs/architecture/supabase-schema.md](docs/architecture/supabase-schema.md) | Schema ads completo |
| [docs/architecture/n8n-workflows.md](docs/architecture/n8n-workflows.md) | ETL por branch |
| [docs/architecture/ai-module.md](docs/architecture/ai-module.md) | Payload function, prompt, recomendações |
| [docs/architecture/glossary.md](docs/architecture/glossary.md) | Termos técnicos |
| [docs/backlog.md](docs/backlog.md) | Pendências e próximos passos |
| [docs/changelog.md](docs/changelog.md) | Histórico de versões |
| [docs/decisions/](docs/decisions/) | Architecture Decision Records |
| [templates/template-docbase-v3.md](templates/template-docbase-v3.md) | Template para docs base de novos clientes |
| [templates/report-template-reference.html](templates/report-template-reference.html) | Template HTML para relatórios de otimização |
| [docs/operations/project-knowledge-v2.md](docs/operations/project-knowledge-v2.md) | Guia operacional do Claude Project |
| [prompts/claude-project-system-v8.md](prompts/claude-project-system-v8.md) | System prompt do Claude Project |

## Como usar com IA

Ver [CLAUDE.md](CLAUDE.md) para instruções de qual arquivo enviar dependendo da tarefa.
