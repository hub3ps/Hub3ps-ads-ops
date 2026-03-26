# TEMPLATE — Documentos Base (Google Ads)
# Hub3ps Ads Ops | Schema: ads.documents
# Instrução: preencher os campos marcados com [PREENCHER] e remover esta linha antes de subir.
# Cada bloco abaixo = 1 INSERT em ads.documents com o doc_key correspondente.

---

## ═══════════════════════════════════════════
## DOC_KEY: playbook
## Identidade, papel no grupo, serviços, cobertura, governança
## ═══════════════════════════════════════════

# [NOME DA CLÍNICA] — Playbook Google Ads

**Última atualização:** [AAAA-MM-DD]
**Site:** [URL do site]
**Endereço:** [Endereço completo]
**Contato (recepção):** [email] | [telefone]
**Agendamento online:** [disponível/não disponível] via [plataforma, ex: DentalHub]

---

## 1) Identidade e papel no grupo

[Descrever em 2-3 frases: localização, público principal, diferencial de comunicação e qual papel ocupa dentro do grupo — ex: porta de entrada para urgência na região X, especialista em Y, cobertura da região Z.]

### Regra estratégica do grupo (essencial para otimização):
→ Contexto completo da estratégia do grupo: ver doc_key `group_reorganization` (NZ Dental Group — MCC 2135330960)

- **O que esta clínica COBRE com exclusividade:** [Descrever o que esta clínica captura que nenhuma outra do grupo captura — ex: Emergency/Urgência em Lower Hutt, Upper Hutt e Wellington City]
- **O que esta clínica PODE anunciar:** [Descrever serviços e regiões permitidos — ex: General & Preventive Dentistry em X, Y, Z]
- **O que esta clínica NÃO PODE anunciar:** [Descrever restrições com referência à clínica exclusiva — ex: Implantes (exclusivo: Hutt Dental Implant Centre), Dentures (exclusivo: Dental Reflections), Aligners (exclusivo: ClearChange Aligners)]

---

## 2) Horários de funcionamento

- Segunda: [horário]
- Terça: [horário]
- Quarta: [horário]
- Quinta: [horário]
- Sexta: [horário]
- Sábado: [horário ou Fechado]
- Domingo: [horário ou Fechado]

**Observação:** sempre usar o site como referência primária para anúncios/extensões.

---

## 3) Serviços — regras de mídia do grupo

**PRIORIDADE ALTA** (sempre pode escalar):
- [Serviço 1 — ex: urgência/emergência/dor]
- [Serviço 2]

**PRIORIDADE MÉDIA** (controlado por região e governança):
- [Serviço 1 — ex: general dentist / check-up]
- [Serviço 2]

**NÃO ANUNCIAR** (restrições do grupo para evitar sobreposição):
- [Serviço 1 — ex: Ortodontia/Aligners (exclusivo: ClearChange Aligners)]
- [Serviço 2 — ex: Implantes (exclusivo: Hutt Dental Implant Centre)]
- [Serviço 3 — ex: Dentures/Próteses (exclusivo: Dental Reflections)]

---

## 4) Diferenciais e claims permitidos (para copy)

**Claims seguros e verificáveis via site:**
- [Claim 1 — ex: atendimento fim de semana]
- [Claim 2 — ex: agendamento online]
- [Claim 3 — ex: tecnologia X]

**Claims internos (confirmar no site antes de usar em headlines):**
- [Claim 1 — ex: WINZ quotes]
- [Claim 2 — ex: Afterpay / Q Card]

---

## 5) Cobertura geográfica

**Principal (não deve mudar):**
- [Região 1]
- [Região 2]

**Expansão secundária (controlada):**
- [Região — somente se CPA/eficiência sustentar e sem sobreposição indevida]

**Regra de expansão geográfica:**
A expansão para novas regiões só deve ser considerada quando a clínica estiver dominando as buscas para os serviços anunciados nas regiões principais. "Dominar" significa: ter Impression Share superior aos principais concorrentes e ser líder consistente em posição superior no leilão. Enquanto a clínica não liderar o leilão nas regiões principais, todo budget deve ser concentrado nelas. Esta regra se aplica a todas as clínicas do grupo.

**Configuração atual:**
- Opção de local: [Presença / Presença + Interesse]
- Ajustes de lance por local: [Região +X%, Região sem ajuste, etc.]

---

## 6) Governança de keywords

**Clusters que PODEM ser trabalhados:**

| Cluster | Exemplos de termos |
|---|---|
| [Cluster 1 — ex: Urgência] | [termos] |
| [Cluster 2 — ex: Geral alta intenção] | [termos] |
| [Cluster 3 — ex: Preventivo] | [termos] |
| [Cluster 4 — ex: Brand] | [termos] |

**Negativas obrigatórias (evitar sobreposição de serviço):**
- Ortodontia/Aligners: braces, invisalign, aligners, orthodontist, orthodontics, clear aligners, teeth straightening
- Implantes: implant, implants, all on 4, all-on-4, dental implant, implant supported, screw
- Dentures/Próteses: denture, dentures, prosthetic, prosthetics, false teeth

⚠ Remover desta lista os termos que são serviço PRINCIPAL desta clínica (ex: Dental Reflections remove dentures das negativas; Hutt Dental Implant remove implants).

**Negativas informacionais/filtros:**
- [termos informativos, caseiros, how-to, etc.]

---

## 7) Landing pages principais

| Uso | URL |
|---|---|
| [Hub de serviços] | [URL] |
| [Contato/Agendamento] | [URL] |
| [Serviço específico 1] | [URL] |
| [Serviço específico 2] | [URL] |



---

## ═══════════════════════════════════════════
## DOC_KEY: config_inventory
## Estrutura atual das campanhas — snapshot operacional
## ═══════════════════════════════════════════

# [NOME DA CLÍNICA] — Config Inventory Google Ads

**Última atualização:** [AAAA-MM-DD]

---

## 1) Campanhas ativas

### Campanha 1: [NOME DA CAMPANHA]

- **Budget:** NZD [X]/dia
- **Bidding:** [Maximizar conversões com tCPA / Maximizar conversões sem tCPA / Target ROAS / Manual CPC]
- **tCPA alvo (se aplicável):** NZD [X]
- **Status:** [Qualificada / Limitada pelo orçamento / Pausada]
- **Redes:** [Search only / Search + Search Partners / Search + Display]
- **Programação:** [horário — ex: 06:00–22:00 todos os dias / All day]
- **Cobertura (geo):** [regiões + opção Presença/Interesse]
- **Ad groups:**

| Ad Group | tCPA alvo | Intenção principal |
|---|---|---|
| [nome] | NZD [X] | [descrição] |
| [nome] | NZD [X] | [descrição] |

---

### Campanha 2: [NOME DA CAMPANHA]

- **Budget:** NZD [X]/dia
- **Bidding:** [estratégia]
- **Status:** [status]
- **Redes:** [redes]
- **Programação:** [programação]
- **Cobertura (geo):** [regiões]
- **Ad groups:**

| Ad Group | tCPA alvo | Intenção principal |
|---|---|---|
| [nome] | NZD [X] | [descrição] |

---

### Campanhas pausadas / experimentais

| Campanha | Status | Observação |
|---|---|---|
| [nome] | [PAUSED/ENABLED] | [observação] |

---

## 2) Orçamento — referência mensal

- **Teto mensal de referência:** NZD [X]/mês (~NZD [X]/dia)

| Campanha | Budget diário |
|---|---|
| [Campanha 1] | NZD [X]/dia |
| [Campanha 2] | NZD [X]/dia |

---

## 3) Mapa de intenção — ad groups → landing pages

| Campanha | Ad Group | Intenção | Landing Page |
|---|---|---|---|
| [campanha] | [ad group] | [ex: urgência/dor] | [URL] |
| [campanha] | [ad group] | [ex: intenção geral] | [URL] |



---

## ═══════════════════════════════════════════
## DOC_KEY: data_contract
## Conversões, KPIs, atribuição, tracking
## ═══════════════════════════════════════════

# [NOME DA CLÍNICA] — Data Contract Google Ads

**Última atualização:** [AAAA-MM-DD]

---

## 1) Objetivo de marketing

[Descrever em 1-2 frases o objetivo central — ex: capturar demanda ready-to-book com foco em urgência/dor e dentista geral de alta intenção local.]

---

## 2) Conversion actions (estado atual)

| Action name | Primary? | Include in conv.? | Observação |
|---|---|---|---|
| [BookAppointmentClick] | [Sim/Não] | [Sim/Não] | [descrição] |
| [PhoneClick] | [Sim/Não] | [Sim/Não] | [descrição] |
| [ContactUsForm] | [Sim/Não] | [Sim/Não] | [descrição] |

**Observação sobre o estágio atual do tracking:**
[Ex: conversões tratadas como intenções (cliques/ações), não agendamento confirmado. Migração para tracking de agendamento confirmado está no backlog.]

---

## 3) KPI operacional

- **KPI principal:** [ex: CPA de intenção — manter baixo e preservar volume]
- **CPA target máximo:** [NZD X — teto absoluto, ou: "A ser definido quando o rastreamento migrar para agendamento confirmado"]
- **CPA de referência por campanha:**

| Campanha | Ad Group | CPA alvo (NZD) |
|---|---|---|
| [Campanha 1] | [Ad Group] | NZD [X] |
| [Campanha 2] | [Ad Group] | NZD [X] |

- **Janelas de análise:** LAST_7D (tático) + LAST_30D (tendência)
- **Nota de evolução:** [ex: quando migrar para agendamento confirmado, atualizar este documento]

**⚠ ATENÇÃO — Dados parciais no Supabase (remover este bloco quando houver 30d completos):**
Os dados desta conta no Supabase cobrem apenas a partir de [AAAA-MM-DD]. A janela "LAST_30D" NÃO contém 30 dias completos até ~[AAAA-MM-DD + 30d]. A IA NÃO deve tratar métricas acumuladas como se fossem 30 dias completos. Esta limitação se aplica a todas as contas com dados recentes no Supabase.

---

## 4) O que NÃO deve ser considerado conversão primária

- [ex: Pageviews, tempo no site, scroll depth]
- [ex: Conversões de Display sem intenção clara]



---

## ═══════════════════════════════════════════
## DOC_KEY: history_ops
## Changelog de otimizações e diagnósticos
## ═══════════════════════════════════════════

# [NOME DA CLÍNICA] — History Ops Google Ads

**Última atualização:** [AAAA-MM-DD]

---

## 1) Fase atual e roadmap

A conta opera em um modelo de fases. A IA deve ajustar suas recomendações conforme a fase vigente.

| Fase | Nome | Descrição | IA pode recomendar | IA NÃO deve recomendar |
|---|---|---|---|---|
| 1 | **REORGANIZAÇÃO** | Criar estrutura, implementar negativas de governança, corrigir violations, estabilizar sinais | Negativas, correções táticas, blindagem de governança, ajustes de landing/RSA pontuais | Mudanças estruturais grandes, expansão de serviços, aumento agressivo de budget, novos ad groups |
| 2 | **ESTABILIZAÇÃO** | Estrutura final atingida, refinando performance e tCPAs | Ajustes de tCPA, budget (com evidência), keywords EXACT, match types, RSAs, testes A/B | Reestruturação de campanhas/ad groups, mudança de papel das campanhas |
| 3 | **MANUTENÇÃO & MELHORIA CONTÍNUA** | Conta madura, foco em manter resultados e melhorar incrementalmente | Tudo: expansão controlada, testes, novos clusters, otimização contínua | Desviar do papel definido no playbook/group_reorganization |

### Fase atual: [1/2/3] — [REORGANIZAÇÃO/ESTABILIZAÇÃO/MANUTENÇÃO]

**Início:** [AAAA-MM-DD]

**Critérios para transição para a próxima fase:**
- [ ] [Critério 1 — ex: Negativas obrigatórias de governança implementadas]
- [ ] [Critério 2 — ex: Ad copy corrigido (sem violations)]
- [ ] [Critério 3 — ex: 30 dias de dados completos no Supabase]
- [ ] [Critério 4 — ex: CPA estável abaixo de NZD X]

---

## 2) Changelog

| ID | Data | Tipo | Escopo | O que mudou | Por que | Expectativa | Status |
|---|---|---|---|---|---|---|---|
| [CLI-CHG-0001] | [AAAA-MM-DD] | [Estrutura/Config/Bid/Budget/Negativas] | [campanha/ad group] | [descrição] | [motivo] | [resultado esperado] | [Em teste/Aplicado/Revertido] |

---

## 3) Backlog de melhorias

**Alta prioridade:**
- [ ] [item]

**Média prioridade:**
- [ ] [item]

**Baixa prioridade:**
- [ ] [item]

---

## 4) Cadência de revisão

- **Semanal:** Search terms + negativas. Revisar Campaigns/AdGroups, Conversions por ação, Locations. Implementar 1-2 mudanças, esperar 48h antes de nova alteração.
- **Quinzenal:** Estrutura, geo, budget. Revisar IS e decisões de alocação.
- **Mensal:** Estratégia, criativos RSA, ad strength. Avaliar necessidade de novas campanhas ou reestruturação.
- **Trimestral:** Tracking, governança do grupo, alinhamento com doc group_reorganization.
