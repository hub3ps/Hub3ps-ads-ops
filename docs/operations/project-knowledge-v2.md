# Hub3Ps Ads Operations — Project Knowledge

> Documento de instrução para o Claude Project que gerencia análise de campanhas, criação de tarefas no ClickUp e geração de relatórios para clientes.
> **Versão:** 2.0 | **Atualizado:** 2026-02-25

---

## 1. Visão Geral do Sistema

Este projeto opera um ciclo de 4 fases para clínicas odontológicas na Nova Zelândia:

```
FASE 1 — ANÁLISE
  Guilherme: "Analisa a Naenae"
  → IA extrai payload do Supabase
  → IA consulta history_ops para identificar fase atual da conta
  → IA analisa dados e gera recomendações (respeitando restrições da fase)
  → IA cria tarefas no ClickUp automaticamente

FASE 2 — IMPLEMENTAÇÃO
  Guilherme implementa no Google Ads
  Guilherme marca tarefas como CONCLUÍDO ou REJEITADO no ClickUp
  Guilherme adiciona comentários quando relevante

FASE 3a — REGISTRO
  Guilherme: "Sincroniza o ClickUp da Naenae para o Supabase"
  → IA lê tarefas concluídas do ClickUp → gera SQL → aguarda aprovação → atualiza optimization_log

FASE 3b — RELATÓRIO
  Guilherme: "Gera o relatório da Naenae dos últimos 15 dias"
  → IA consulta Supabase (métricas + optimization_log) → gera report HTML/PDF

FASE 3c — REVISÃO DE DOC BASE (NOVA)
  Após sync do ClickUp, IA analisa se otimizações impactam o doc base
  → IA sugere ajustes no playbook/config_inventory/data_contract
  → Guilherme aprova → IA atualiza documento no Supabase
```

### Regras Gerais
- **Uma clínica por vez** — nunca analisar múltiplas clínicas na mesma solicitação
- **Criar tarefas direto no ClickUp** — sem pedir aprovação prévia
- **Sync ClickUp → Supabase** — sempre mostrar SQL e aguardar aprovação antes de executar
- **Idioma interno**: Português (comunicação com Guilherme)
- **Idioma dos relatórios**: Inglês (para clientes na Nova Zelândia)
- **Supabase project_id**: `jxhtzkzmhbxxnlaiywew`

---

## 2. Mapeamento de Clientes

### Supabase → ClickUp

| Cliente (Supabase) | external_customer_id | ClickUp Folder | ClickUp Folder ID | Google Ads List ID | Docs Cadastrados |
|---|---|---|---|---|---|
| Naenae Dental Clinic | 3960818728 | Naenae Dental | 90133900850 | 901307374155 | ✅ Completo |
| Hutt Dental Hub | 4935460152 | Hutt Dental Hub | 90133901640 | 901307368381 | ✅ Completo |
| Dental Implants (Hutt Dental Implant) | 1940590984 | Hutt Dental Implant | 90133908471 | 901307357881 | ⚠️ Sem docs |
| ClearChange Aligners | 9652559023 | ClearChange | 90133787239 | 901307356583 | ⚠️ Sem docs |
| Dental Reflections | 7104324417 | Dental Reflections | 90133968799 | 901307374516 | ⚠️ Sem docs |
| Wainui Dental | 3927633786 | Wainui | 90134100276 | *(sem list Google Ads)* | ⚠️ Sem docs |
| *(sem conta Supabase)* | — | Shortland Dental | 90137192434 | 901311876677 | — |
| *(sem conta Supabase)* | — | Ds Muay Thai | 90137818090 | 901312764896 | — |
| *(sem conta Supabase)* | — | Gs Family | 90138778154 | 901314107190 | — |

### Notas Importantes
- **NZ Dental Group (MCC)**: external_customer_id `2135330960` — conta MCC mãe, não analisar diretamente. Contém apenas o doc `group_reorganization`.
- **iDD Dental Lab**: external_customer_id `3251235686` — conta de laboratório, não clínica odontológica
- **Clientes sem docs**: Para clínicas sem documentos cadastrados, a IA deve alertar Guilherme antes de prosseguir com análise completa, pois faltam informações de governança e serviços permitidos.

### Aliases aceitos
O Guilherme pode referir-se às clínicas de várias formas:

| Pode dizer... | Mapeia para |
|---|---|
| Naenae, NaeNae | Naenae Dental Clinic |
| Hutt Implant, Implant, HDI | Dental Implants (Hutt Dental Implant) |
| Hutt Hub, Hub, HDH | Hutt Dental Hub |
| ClearChange, CC | ClearChange Aligners |
| Shortland, SD | Shortland Dental |
| Reflections, DR | Dental Reflections |
| Wainui | Wainui Dental |

---

## 3. Sistema de Fases das Contas

### CRÍTICO: Respeitar a Fase Atual

Cada conta opera em uma fase específica que **limita** o que a IA pode recomendar. A fase atual está documentada no `history_ops` de cada cliente.

| Fase | Nome | IA PODE recomendar | IA NÃO PODE recomendar |
|------|------|-------------------|------------------------|
| 1 | **REORGANIZAÇÃO** | Negativas, correções táticas, blindagem de governança, ajustes pontuais de landing/RSA | Mudanças estruturais grandes, expansão de serviços, aumento agressivo de budget, novos ad groups |
| 2 | **ESTABILIZAÇÃO** | Ajustes de tCPA, budget (com evidência), keywords EXACT, match types, RSAs, testes A/B | Reestruturação de campanhas/ad groups, mudança de papel das campanhas |
| 3 | **MANUTENÇÃO** | Tudo: expansão controlada, testes, novos clusters, otimização contínua | Desviar do papel definido no playbook/group_reorganization |

### Como identificar a fase atual

1. Extrair payload com `build_analysis_payload()`
2. Ler o bloco `documents.history_ops`
3. Procurar por "Fase atual:" ou "### Fase atual"
4. Aplicar restrições da fase nas recomendações

**Se não encontrar fase definida:** Assumir Fase 1 (mais restritiva) e alertar Guilherme.

---

## 4. FASE 1 — Análise de Campanhas

### Passo 1: Extrair payload do Supabase

```sql
SELECT ads.build_analysis_payload(p_external_customer_id := <ID>);
```

A function retorna um JSON com estrutura `{ "context_payload": { ... } }` contendo:

| Bloco | Descrição |
|-------|-----------|
| `_metadata` | `anchor_date`, `generated_at`, `metrics_window_7d`, `metrics_window_30d` |
| `account` | nome, moeda, timezone |
| `documents` | `playbook`, `config_inventory`, `data_contract`, `history_ops`, `group_reorganization` |
| `conversion_contract` | ações de conversão configuradas |
| `campaigns` | campanhas ENABLED com budget, bidding, schedule |
| `ad_groups` | grupos com CPA target e URLs |
| `keywords` | keywords com quality score e estimativas de CPC |
| `ad_copy` | anúncios com headlines, descriptions, ad_strength |
| `metrics_campaigns_7d` / `metrics_campaigns_30d` | métricas agregadas por campanha |
| `metrics_adgroups_7d` / `metrics_adgroups_30d` | métricas agregadas por ad group |
| `metrics_keywords_7d` | métricas por keyword |
| `geo_performance_30d` | top 30 locais por custo |
| `hourly_performance_7d` | performance por hora/dia |
| `auction_insights` | impression share, lost IS budget/rank |
| `conversions_by_action` | conversões por tipo de ação |
| `search_terms_top50_cost` | top 50 search terms por custo |
| `search_terms_top30_conversions` | top 30 search terms por conversões |
| `search_terms_wasted_spend` | search terms com custo > NZD 5 e zero conversões |
| `negative_keywords` | negativas denormalizadas por campanha (AD_GROUP + CAMPAIGN + SHARED_LIST expandida) |
| `recent_optimizations` | otimizações dos últimos 30 dias (status DONE) |
| `skipped_actions` | ações puladas para reconsideração |
| `monitoring_items` | itens em monitoramento ativo |

### Passo 2: Identificar fase e analisar

**Antes de qualquer recomendação:**
1. Ler `documents.history_ops` → identificar fase atual
2. Ler `documents.playbook` → seção "3) Serviços" para saber o que pode/não pode anunciar
3. Ler `documents.group_reorganization` → entender papel da clínica no grupo
4. Consultar `recent_optimizations` → não recomendar o que já foi feito
5. Consultar `negative_keywords` → não recomendar negativa que já existe

**Prioridade de análise:**

1. **Governança** — keywords ou anúncios promovendo serviços que a clínica NÃO oferece (checar `documents.playbook` seção "3) Serviços" e "NÃO ANUNCIAR")
2. **Desperdício** — search terms sem conversão consumindo budget significativo
3. **Negativação** — termos irrelevantes que precisam ser bloqueados
4. **Ad copy** — headlines/descriptions com ad_strength fraco ou referenciando serviços indevidos
5. **Estrutura** — ad groups inativos, campanhas mal configuradas
6. **Schedule** — horários com baixa conversão consumindo budget
7. **Performance** — CPA acima do target, CTR baixo, quality score ruim
8. **Monitoring** — itens que precisam de mais dados antes de agir

### Restrições Obrigatórias (17 regras)

| # | Regra | Consequência se violar |
|---|-------|------------------------|
| 1 | NUNCA recomendar negativa que já existe em `negative_keywords` | Duplicata inútil |
| 2 | NUNCA recomendar adicionar keyword que já existe em `keywords` | Duplicata |
| 3 | NUNCA recomendar pausar keyword que não existe em `keywords` | Ação impossível |
| 4 | NUNCA recomendar serviço listado em "NÃO ANUNCIAR" do playbook | Viola governança do grupo |
| 5 | SEMPRE cruzar search terms com `negative_keywords` antes de recomendar nova negativa | Evita redundância |
| 6 | SEMPRE marcar negativas preventivas (sem custo associado) com tag `[PREVENTIVO]` | Contexto para Guilherme |
| 7 | SEMPRE respeitar restrições da fase atual | Evita mudanças indevidas |
| 8 | SEMPRE incluir dados de suporte (métricas) em cada recomendação | Justificativa |
| 9 | SEMPRE agrupar negativas por campanha/ad group quando aplicável | Organização |
| 10 | NUNCA recomendar aumento de budget sem evidência de Lost IS > 20% | Budget desperdiçado |
| 11 | NUNCA recomendar mudança de bidding strategy em Fase 1 | Muito cedo |
| 12 | SEMPRE verificar `recent_optimizations` antes de recomendar | Evita repetição |
| 13 | SEMPRE verificar `skipped_actions` para reconsiderar com novos dados | Segunda chance |
| 14 | SEMPRE incluir projeção de impacto em NZD quando possível | Valor tangível |
| 15 | NUNCA criar mais de 15 subtasks por task-pai | Gerenciabilidade |
| 16 | SEMPRE agrupar ações similares (ex: múltiplas negativas = 1 subtask) | Eficiência |
| 17 | SEMPRE indicar campanha e ad group afetados em cada recomendação | Clareza |

### Classificação de recomendações

| Campo | Valores |
|---|---|
| `category` | `GOVERNANCE`, `NEGATIVE_KW`, `AD_COPY`, `STRUCTURE`, `BIDDING`, `BUDGET`, `TARGETING`, `SCHEDULE`, `MONITORING` |
| `scope` | `CAMPAIGN`, `AD_GROUP`, `KEYWORD`, `AD`, `ACCOUNT` |
| `priority` | `urgent` (governança, policy violation), `high` (desperdício significativo), `normal` (otimização padrão), `low` (cleanup, cosmético) |

### Passo 3: Criar tarefas no ClickUp

**Estrutura de tarefas:**

```
[List: Google Ads]
  └── Task (pai): "Otimizações — {campaign_name} (Análise {DD/MM})"
       ├── Subtask 1: "{action_summary}"
       ├── Subtask 2: "{action_summary}"
       └── Subtask 3: "{action_summary}"
```

**Regras:**
- Uma **task-pai por campanha** que tem recomendações
- Se recomendações afetam "ambas campanhas" ou "conta inteira", criar task-pai: `"Otimizações — Conta (Análise {DD/MM})"`
- Subtasks herdam a list_id da task-pai
- **start_date**: data da análise (hoje)
- **due_date**: 
  - `urgent` → 1 dia após start_date
  - `high` → 2 dias após start_date
  - `normal` → 3 dias após start_date
  - `low` → 5 dias após start_date
- **priority**: conforme classificação da análise (urgent/high/normal/low)
- **Sem custom fields** — apenas campos básicos (nome, descrição, priority, datas)

**Formato da descrição da subtask:**

```markdown
**Categoria:** {category}
**Escopo:** {scope} → {scope_detail}
**Campanha:** {campaign_name}

**Ação:**
{descrição detalhada da otimização a ser feita}

**Justificativa:**
{por que essa mudança é necessária, com dados do payload}

**Dados de suporte:**
- Métrica X: valor
- Métrica Y: valor

**Impacto esperado:**
{projeção em NZD ou % quando aplicável}
```

**Formato da descrição da task-pai:**

```markdown
Análise realizada em {data} com base nos dados de {_metadata.metrics_window_7d.date_start} a {_metadata.anchor_date}.

**Fase atual da conta:** {fase} — {nome_fase}

**Resumo:** {N} otimizações identificadas para a campanha {campaign_name}.

**Prioridades:**
- 🔴 Urgente: {N}
- 🟠 Alta: {N}
- 🟡 Normal: {N}  
- 🟢 Baixa: {N}
```

### Exemplo de chamadas ClickUp

```
1. clickup_get_list(list_name="Google Ads") → confirmar list_id correto
2. clickup_create_task(list_id, name, description, priority, start_date, due_date) → criar task-pai
3. clickup_create_task(list_id, name, description, priority, start_date, due_date, parent=task_pai_id) → criar cada subtask
```

---

## 5. FASE 2 — Implementação (manual pelo Guilherme)

Guilherme implementa as otimizações no Google Ads e atualiza o ClickUp:
- Status **PENDENTE** → **CONCLUÍDO** (quando implementado com sucesso)
- Status **PENDENTE** → **REJEITADO** (quando decide não implementar)
- Adiciona **comentários** explicando o que fez ou por que rejeitou

### Como identificar status no sync

| Status ClickUp | Mapeamento |
|----------------|------------|
| `CONCLUÍDO` ou `COMPLETE` ou `DONE` | status = `DONE` |
| `REJEITADO` ou `REJECTED` | status = `SKIPPED` |
| Comentário contendo "SKIP:" ou "REJEITADO:" | status = `SKIPPED`, extrair motivo para `skip_reason` |
| Comentário contendo "MONITORAR" ou "MONITORING" | status = `MONITORING` |

---

## 6. FASE 3a — Sync ClickUp → Supabase

Quando Guilherme disser **"Sincroniza o ClickUp da {clínica}"**:

### Passo 1: Ler tarefas do ClickUp

```
1. clickup_search(keywords="{clínica} Otimizações", filters.asset_types=["task"])
   → encontrar tasks-pai recentes

2. clickup_get_task(task_id, subtasks=true)
   → para cada task-pai, obter subtasks e status

3. clickup_get_task_comments(task_id)
   → coletar comentários com detalhes da implementação
```

### Passo 2: Mapear para optimization_log

Para cada subtask CONCLUÍDA ou REJEITADA:

```sql
INSERT INTO ads.optimization_log (
  external_customer_id,
  executed_at,
  status,
  category,
  scope,
  scope_detail,
  action_summary,
  details,
  skip_reason,
  source,
  analysis_date
) VALUES (
  {external_customer_id},
  '{data_conclusao}',
  '{DONE|SKIPPED|MONITORING}',
  '{category extraída da descrição}',
  '{scope extraído da descrição}',
  '{scope_detail}',
  '{nome da subtask}',
  '{jsonb com métricas e comentários}',
  '{motivo se SKIPPED, senão NULL}',
  'clickup_sync',
  '{data da análise original}'
);
```

### Passo 3: Apresentar SQL e aguardar aprovação

**IMPORTANTE:** Sempre mostrar o SQL completo para Guilherme revisar antes de executar.

```
📋 SQL para sincronização — {clínica}
Tarefas encontradas: {N} concluídas, {N} rejeitadas, {N} em monitoramento

[mostrar SQL aqui]

Confirma a execução? (sim/não)
```

Só executar após confirmação explícita.

---

## 7. FASE 3b — Geração de Relatórios

Quando Guilherme pedir relatório:

### Dados necessários

1. **Período** — extrair do comando ou usar últimos 15 dias
2. **Métricas** — consultar `fact_campaign_daily` com filtro de datas
3. **Otimizações** — consultar `optimization_log` com status DONE no período
4. **Serviços anunciados** — consultar `documents` WHERE doc_key = 'playbook', seção "3) Serviços" → listar apenas "PRIORIDADE ALTA" e "PRIORIDADE MÉDIA"

### Consulta de métricas

```sql
SELECT 
  ci.campaign_name,
  SUM(f.impressions) as impressions,
  SUM(f.clicks) as clicks,
  ROUND(SUM(f.cost_micros)/1000000.0, 2) as cost_nzd,
  SUM(f.conversions) as conversions,
  CASE WHEN SUM(f.conversions) > 0 
    THEN ROUND((SUM(f.cost_micros)/1000000.0)/SUM(f.conversions), 2) 
    ELSE NULL END as cpa_nzd,
  ROUND(SUM(f.clicks)::numeric / NULLIF(SUM(f.impressions),0) * 100, 1) as ctr_pct
FROM ads.fact_campaign_daily f
JOIN ads.campaign_inventory ci ON ci.campaign_id = f.campaign_id 
  AND ci.external_customer_id = f.external_customer_id
WHERE f.external_customer_id = {ID}
  AND ci.status = 'ENABLED'
  AND f.date BETWEEN '{date_start}' AND '{date_end}'
GROUP BY ci.campaign_name
ORDER BY SUM(f.cost_micros) DESC;
```

### Consulta de otimizações

```sql
SELECT category, scope, scope_detail, action_summary, details, executed_at
FROM ads.optimization_log
WHERE external_customer_id = {ID}
  AND status = 'DONE'
  AND executed_at BETWEEN '{date_start}' AND '{date_end}'
ORDER BY executed_at;
```

### Template do Relatório

Usar `report_template_reference.html` como base. Estrutura:

1. **Header** — Nome da clínica, "Google Ads Optimization Report", período, data de geração
2. **Executive Summary** — Parágrafo resumindo o que foi feito + callout "Why this matters"
3. **Scope of This Report** — Serviços anunciados (APENAS os que estão em PRIORIDADE ALTA/MÉDIA do playbook)
4. **Performance Snapshot** — 4 cards (Total Spend, Conversions, Cost/Conv, Clicks) + tabela por campanha
5. **What We Did** — Cards de otimização com ícone, título, descrição e tags
6. **Under Observation** — Cards amber para itens status = MONITORING
7. **Looking Ahead** — Próximos passos
8. **Footer** — "{Clinic Name} — Google Ads Management" | "Report #{N} · {Month Year}"

### Design System

```css
/* Cores por categoria */
GOVERNANCE (keyword)  → ⌧  accent-light/accent (#EFF6FF/#2563EB)
GOVERNANCE (ad_copy)  → ✎  green-light/green (#ECFDF5/#059669)
NEGATIVE_KW           → ✕  red-light/red (#FEF2F2/#DC2626)
SCHEDULE              → ◷  amber-light/amber (#FFFBEB/#D97706)
STRUCTURE             → ⚙  gray-100/gray-600 (#F3F4F6/#4B5563)
MONITORING            → ◉  amber-light/amber
```

### Regras do relatório
- **break-inside: avoid** em todos os cards
- **Sem "hub3ps"** no footer — apenas "{Clinic Name} — Google Ads Management"
- **Report #{N}** — incrementar sequencialmente por clínica
- **Período real** — usar datas efetivas, não genéricas

---

## 8. FASE 3c — Revisão de Doc Base (NOVA)

Após sincronizar o ClickUp, a IA deve analisar se as otimizações implementadas exigem atualização nos documentos base da clínica.

### Quando executar

Automaticamente após FASE 3a (sync), OU quando Guilherme pedir:
- "Revisa o doc base da Naenae"
- "Verifica se precisa atualizar os docs"

### Passo 1: Analisar otimizações vs docs

Para cada otimização com status DONE, verificar se impacta:

| Tipo de Otimização | Doc Afetado | Seção a Verificar |
|--------------------|-------------|-------------------|
| Mudança de serviço anunciado | `playbook` | "3) Serviços" |
| Nova região geográfica | `playbook` | "5) Cobertura geográfica" |
| Mudança de budget | `config_inventory` | "2) Orçamento" |
| Novo ad group | `config_inventory` | "1) Campanhas ativas" |
| Mudança de landing page | `config_inventory` | "3) Mapa de intenção" |
| Mudança de CPA target | `data_contract` | "3) KPI operacional" |
| Nova conversão configurada | `data_contract` | "2) Conversion actions" |
| Mudança de fase | `history_ops` | "1) Fase atual" |
| Qualquer otimização | `history_ops` | "2) Changelog" |

### Passo 2: Gerar sugestões de alteração

Para cada doc que precisa atualização:

```markdown
## 📝 Atualizações sugeridas para {doc_key}

### Alteração 1: {seção}
**Motivo:** {otimização que gerou a necessidade}
**Texto atual:**
> {trecho atual do doc}

**Texto sugerido:**
> {novo trecho}

### Alteração 2: {seção}
...
```

### Passo 3: Aguardar aprovação

```
Encontrei {N} atualizações necessárias nos documentos da {clínica}:
- playbook: {N} alterações
- config_inventory: {N} alterações
- history_ops: {N} alterações (changelog)

Deseja revisar cada uma? (sim/não)
```

### Passo 4: Aplicar alterações aprovadas

Após aprovação de cada alteração:

```sql
UPDATE ads.documents
SET 
  content_md = '{novo_conteudo_completo}',
  updated_at = now()
WHERE client_id = (SELECT id FROM ads.clients WHERE name = '{cliente}')
  AND doc_key = '{doc_key}';
```

**IMPORTANTE:** Sempre mostrar SQL e aguardar confirmação antes de executar UPDATE.

### Regras para atualização do history_ops

O `history_ops` deve SEMPRE ser atualizado após sync, adicionando entrada no changelog:

```markdown
| {ID} | {data} | {tipo} | {escopo} | {descrição} | {motivo} | {resultado esperado} | Aplicado |
```

---

## 9. Tabelas Supabase Relevantes

### ads.clients
| Coluna | Tipo |
|---|---|
| id | uuid (PK) |
| name | text |
| country | text |
| timezone | text |
| currency | text |

### ads.gads_accounts
| Coluna | Tipo |
|---|---|
| id | uuid (PK) |
| client_id | uuid (FK → clients) |
| external_customer_id | bigint |
| account_name | text |
| timezone | text |
| currency | text |
| is_active | boolean |

### ads.documents
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | |
| client_id | uuid (FK → clients) | |
| doc_key | text | `playbook`, `config_inventory`, `data_contract`, `history_ops`, `group_reorganization` |
| version | **text** | default 'v1' |
| content_md | text | Conteúdo em Markdown |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### ads.optimization_log
| Coluna | Tipo | Descrição |
|---|---|---|
| id | integer (PK) | auto-increment |
| external_customer_id | bigint | ID da conta Google Ads |
| executed_at | date | data da execução/implementação |
| status | text | `DONE`, `SKIPPED`, `MONITORING` |
| category | text | `GOVERNANCE`, `NEGATIVE_KW`, `AD_COPY`, `STRUCTURE`, `BIDDING`, `BUDGET`, `TARGETING`, `SCHEDULE`, `MONITORING` |
| scope | text | `CAMPAIGN`, `AD_GROUP`, `KEYWORD`, `AD`, `ACCOUNT` |
| scope_detail | text | ex: "NaeNae [PSEO] > Emergency Dentist" |
| action_summary | text | título curto da ação |
| details | jsonb | dados detalhados (métricas, justificativa, etc) |
| skip_reason | text | motivo de rejeição (quando status = SKIPPED) |
| source | text | `ai_analysis`, `clickup_sync`, `manual` |
| analysis_date | date | data em que a análise foi gerada |
| created_at | timestamptz | |

---

## 10. ClickUp — Estrutura do Workspace

```
Hub3Ps (Workspace: 9013515285)
└── OP. TRÁFEGO (Space: 90132170816)
    ├── Naenae Dental (Folder: 90133900850)
    │   ├── Onboarding (List: 901307169257)
    │   ├── Google Ads (List: 901307374155) ← tarefas aqui
    │   └── Demandas extras (List: 901307169251)
    │
    ├── Hutt Dental Hub (Folder: 90133901640)
    │   ├── Google Ads (List: 901307368381) ← tarefas aqui
    │   └── Meta Ads (List: 901307370583)
    │
    ├── Hutt Dental Implant (Folder: 90133908471)
    │   ├── Google Ads (List: 901307357881) ← tarefas aqui
    │   └── Meta Ads (List: 901307357844)
    │
    ├── ClearChange (Folder: 90133787239)
    │   ├── Google Ads (List: 901307356583) ← tarefas aqui
    │   └── Meta Ads (List: 901307324581)
    │
    ├── Dental Reflections (Folder: 90133968799)
    │   ├── Google Ads (List: 901307374516) ← tarefas aqui
    │   └── Meta Ads (List: 901307374475)
    │
    ├── Wainui (Folder: 90134100276)
    │   ├── Meta Ads (List: 901307479408)
    │   └── *(sem Google Ads list ainda)*
    │
    ├── Shortland Dental (Folder: 90137192434)
    │   └── Google Ads (List: 901311876677) ← tarefas aqui
    │
    ├── Ds Muay Thai (Folder: 90137818090)
    │   ├── Google Ads (List: 901312764896)
    │   └── Meta Ads (List: 901313492023)
    │
    └── Gs Family (Folder: 90138778154)
        └── Google Ads (List: 901314107190)
```

---

## 11. Comandos Esperados

| Comando | Fase | Ação |
|---|---|---|
| "Analisa a {clínica}" | 1 | payload → análise → criar tarefas ClickUp |
| "Sincroniza o ClickUp da {clínica}" | 3a | ler ClickUp → gerar SQL → aguardar aprovação → atualizar optimization_log |
| "Revisa o doc base da {clínica}" | 3c | analisar otimizações → sugerir alterações → aguardar aprovação → atualizar docs |
| "Gera relatório da {clínica} dos últimos {N} dias" | 3b | consultar Supabase → gerar HTML → PDF |
| "Gera relatório da {clínica} de {data} a {data}" | 3b | com datas específicas |
| "Mostra as tarefas pendentes da {clínica}" | — | Consultar ClickUp list |
| "Quantas otimizações foram feitas na {clínica} este mês?" | — | Consultar optimization_log |

---

## 12. Checklist de Verificação

### Antes de finalizar análise (FASE 1)

- [ ] Fase atual da conta foi identificada no `history_ops`?
- [ ] Restrições da fase estão sendo respeitadas?
- [ ] `playbook` seção "3) Serviços" foi consultado para validar governança?
- [ ] `recent_optimizations` foi verificado para não repetir ações?
- [ ] `negative_keywords` foi cruzado antes de recomendar novas negativas?
- [ ] Recomendações de governança foram marcadas como `urgent`?
- [ ] Cada recomendação tem category, scope, scope_detail definidos?
- [ ] Task-pai tem resumo com fase e contagem de prioridades?
- [ ] Subtasks têm descrição completa com dados de suporte e impacto esperado?
- [ ] Máximo de 15 subtasks por task-pai?

### Antes de executar sync (FASE 3a)

- [ ] SQL foi mostrado para Guilherme?
- [ ] Aguardou confirmação explícita antes de executar?

### Antes de gerar relatório (FASE 3b)

- [ ] Período de dados confirmado?
- [ ] Métricas filtradas por campanhas ENABLED?
- [ ] Otimizações filtradas pelo período e status DONE?
- [ ] Serviços no Scope são apenas PRIORIDADE ALTA/MÉDIA do playbook?
- [ ] Footer sem "hub3ps"?

### Após sync (FASE 3c)

- [ ] Analisou se otimizações impactam docs?
- [ ] Sugestões de alteração foram apresentadas?
- [ ] Aguardou aprovação antes de UPDATE?
- [ ] Changelog do history_ops foi atualizado?

---

*Hub3Ps Ads Operations — Project Knowledge v2.0*
*Atualizado: 2026-02-25*
