# Ads AI Dashboard — Next.js Project Setup

> Documento de referência para inicializar o repo Next.js do Ads AI Dashboard.
> Usar com Claude Code para gerar a estrutura inicial e começar a construir.
> **Versão:** 1.0 | **Data:** 2026-03-23

---

## 1. Visão Geral do Produto

**Nome:** Ads Intelligence by Hub3Ps
**O que é:** Dashboard read-only para clientes de tráfego pago (Google Ads, futuro Meta Ads) consultarem performance das campanhas em near real-time.
**Público:** Clínicas odontológicas na Nova Zelândia (8 clientes ativos).
**Idioma da UI:** Inglês (clientes NZ).
**Visão futura:** SaaS multi-tenant com autenticação, RLS e billing.

### MVP Scope (5 telas, read-only)

| #   | Tela              | Descrição                                                                  | Fonte principal                                                                              |
| --- | ----------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Overview**      | KPIs, weekly chart, conversion split, campaign table, recent optimizations | `fact_campaign_daily`, `campaign_inventory`, `optimization_log`                              |
| 2   | **Campaigns**     | Tabela detalhada por campanha + drill-down ad groups                       | `fact_campaign_daily`, `fact_adgroup_daily`, inventories                                     |
| 3   | **Keywords**      | Top keywords, quality score, match type                                    | `fact_keyword_daily`, `keyword_inventory`                                                    |
| 4   | **Insights**      | Heatmap horário, geo performance, auction insights                         | `fact_hourly_campaign_window`, `fact_geo_performance_window`, `fact_auction_insights_window` |
| 5   | **Optimizations** | Timeline completa de otimizações com filtros                               | `optimization_log`                                                                           |

**Fora do MVP:** Autenticação, perfil de usuário, settings, RLS, Meta Ads data.

---

## 2. Stack Técnica

```
Framework:    Next.js 14+ (App Router)
Language:     TypeScript
Styling:      Tailwind CSS 3
Components:   shadcn/ui (base) + custom components
Charts:       Recharts
Database:     Supabase (Postgres) — client SDK (@supabase/supabase-js)
Auth:         Supabase Auth (fase posterior, não no MVP)
Deployment:   Vercel (futuro) ou EasyPanel (VPS)
```

### Dependências iniciais

```bash
# Criar projeto
npx create-next-app@latest ads-ai-dashboard --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd ads-ai-dashboard

# Core
npm install @supabase/supabase-js recharts date-fns

# UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add card table badge button tabs separator skeleton

# Dev
npm install -D @types/node
```

---

## 3. Folder Structure

```
ads-ai-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (font, sidebar)
│   │   ├── page.tsx                # Redirect to /dashboard
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (sidebar + topbar)
│   │   │   ├── page.tsx            # Overview (tela 1)
│   │   │   ├── campaigns/
│   │   │   │   └── page.tsx        # Campaigns (tela 2)
│   │   │   ├── keywords/
│   │   │   │   └── page.tsx        # Keywords (tela 3)
│   │   │   ├── insights/
│   │   │   │   └── page.tsx        # Insights (tela 4)
│   │   │   └── optimizations/
│   │   │       └── page.tsx        # Optimizations (tela 5)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx         # Sidebar navigation
│   │   │   ├── topbar.tsx          # Top bar with tabs + search
│   │   │   └── footer.tsx          # Footer
│   │   ├── dashboard/
│   │   │   ├── kpi-cards.tsx       # 4 KPI cards
│   │   │   ├── weekly-chart.tsx    # Bar chart semanal
│   │   │   ├── conversion-split.tsx # Donut + progress bars
│   │   │   ├── campaign-table.tsx  # Tabela de campanhas
│   │   │   └── optimization-list.tsx # Lista de otimizações
│   │   └── shared/
│   │       ├── google-dots.tsx     # Google brand dots component
│   │       ├── platform-badge.tsx  # Google Ads / Meta Ads badge
│   │       ├── period-selector.tsx # 7d/14d/30d toggle
│   │       └── loading-skeleton.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Supabase browser client
│   │   │   ├── server.ts           # Supabase server client (RSC)
│   │   │   └── types.ts            # Generated types
│   │   ├── queries/
│   │   │   ├── overview.ts         # Queries para tela Overview
│   │   │   ├── campaigns.ts        # Queries para tela Campaigns
│   │   │   ├── keywords.ts         # Queries para tela Keywords
│   │   │   ├── insights.ts         # Queries para tela Insights
│   │   │   └── optimizations.ts    # Queries para tela Optimizations
│   │   ├── utils.ts                # Formatters, helpers
│   │   └── constants.ts            # Design tokens, category styles
│   │
│   └── hooks/
│       ├── use-period.ts           # Period selection state (7d/14d/30d)
│       └── use-client-data.ts      # Client context (futuro multi-tenant)
│
├── .env.local                      # Supabase URL + anon key
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 4. Design System (Tokens)

Aprovado na v5 (full light). Todas as cores derivadas do Google Ads + Meta Ads.

### 4.1 Cores

```typescript
// src/lib/constants.ts

export const colors = {
  // Platform accents
  accent: "#4285F4", // Google Blue — primary accent
  accentMeta: "#1877F2", // Meta Blue — secondary
  green: "#34A853", // Google Green — positive/conversions
  yellow: "#F9AB00", // Google Yellow — warning/monitoring
  red: "#EA4335", // Google Red — negative/alert

  // Surfaces
  bg: "#f5f6f8",
  surface: "#ffffff",
  surfaceHover: "#f0f1f4",
  border: "#e2e4ea",
  borderLight: "#eceef2",

  // Text
  text: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textDim: "#9ca3af",
  textGhost: "#d1d5db",
} as const;
```

### 4.2 Tailwind Config Extensions

```typescript
// tailwind.config.ts — extend theme

colors: {
  brand: {
    google: "#4285F4",
    meta: "#1877F2",
    green: "#34A853",
    yellow: "#F9AB00",
    red: "#EA4335",
  },
  surface: {
    DEFAULT: "#ffffff",
    hover: "#f0f1f4",
    bg: "#f5f6f8",
  },
  border: {
    DEFAULT: "#e2e4ea",
    light: "#eceef2",
  },
}
```

### 4.3 Tipografia

```
Font family: "DM Sans" (Google Fonts)
Import: https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap

KPI values:    28px, weight 700, letter-spacing -0.03em, tabular-nums
Section titles: 15px, weight 600
Body text:     13-14px, weight 400-500
Labels:        11-12px, weight 500-600, uppercase, letter-spacing 0.05em
Badges:        10-11px, weight 600
```

### 4.4 Componentes visuais — Style Guide

```
Cards:         bg white, border #e2e4ea, border-radius 12px, shadow 0 1px 3px rgba(0,0,0,0.04)
Sidebar item:  active → bg #eff6ff, text #4285F4; inactive → text #374151
Tabs:          active → color #4285F4, border-bottom 2px solid; inactive → #9ca3af
Buttons:       border-radius 6px, padding 4px 10px, font-size 12px
Progress bars: height 7px, border-radius 4px, bg #eceef2
Badges:        border-radius 100px, padding 2px 8px
Table rows:    border-bottom 1px solid #eceef2, padding 14px 16px
```

### 4.5 Category Colors (Optimization Types)

```typescript
export const categoryStyles = {
  NEGATIVE_KW: {
    icon: "✕",
    color: "#EA4335",
    bg: "#fef2f2",
    label: "Negative KW",
  },
  AD_COPY: { icon: "✎", color: "#059669", bg: "#ecfdf5", label: "Ad Copy" },
  GOVERNANCE: {
    icon: "⌧",
    color: "#4285F4",
    bg: "#eff6ff",
    label: "Governance",
  },
  SCHEDULE: { icon: "◷", color: "#d97706", bg: "#fffbeb", label: "Schedule" },
  STRUCTURE: { icon: "⚙", color: "#6b7280", bg: "#f3f4f6", label: "Structure" },
  BIDDING: { icon: "◈", color: "#7c3aed", bg: "#f5f3ff", label: "Bidding" },
  BUDGET: { icon: "◰", color: "#0891b2", bg: "#ecfeff", label: "Budget" },
  TARGETING: { icon: "◎", color: "#c2410c", bg: "#fff7ed", label: "Targeting" },
} as const;

export const statusStyles = {
  DONE: { color: "#059669", bg: "#ecfdf5", label: "Done" },
  MONITORING: { color: "#d97706", bg: "#fffbeb", label: "Monitoring" },
  SKIPPED: { color: "#6b7280", bg: "#f3f4f6", label: "Skipped" },
} as const;
```

---

## 5. Supabase Connection

### 5.1 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://jxhtzkzmhbxxnlaiywew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<pegar no Supabase Dashboard → Settings → API>
```

### 5.2 Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );
}
```

### 5.3 IMPORTANTE — Segurança no MVP

No MVP, sem auth/RLS, as queries vão usar a `anon` key. Isso significa:

- **NÃO deploy público** até implementar RLS
- Durante dev, usar `service_role` key localmente se necessário
- Todas as queries filtram por `external_customer_id` — hardcoded no MVP, parametrizado depois

---

## 6. Queries por Tela

### 6.1 Overview

```typescript
// src/lib/queries/overview.ts

// KPIs + Daily trend (últimos N dias)
export async function getOverviewData(
  supabase: any,
  accountId: number,
  days: number = 30,
) {
  const dateStart = new Date();
  dateStart.setDate(dateStart.getDate() - days);
  const dateStr = dateStart.toISOString().split("T")[0];

  // Daily metrics
  const { data: daily } = await supabase
    .from("fact_campaign_daily")
    .select(
      `
      date,
      impressions,
      clicks,
      cost_micros,
      conversions
    `,
    )
    .eq("external_customer_id", accountId)
    .gte("date", dateStr)
    .order("date", { ascending: true });

  // Campaign breakdown
  const { data: campaigns } = await supabase.rpc("get_campaign_summary", {
    p_account_id: accountId,
    p_date_start: dateStr,
  });
  // NOTA: essa RPC não existe ainda. Alternativa: query raw via .from()

  // Recent optimizations
  const { data: optimizations } = await supabase
    .from("optimization_log")
    .select("*")
    .eq("external_customer_id", accountId)
    .in("status", ["DONE", "MONITORING"])
    .order("executed_at", { ascending: false })
    .limit(6);

  return { daily, campaigns, optimizations };
}
```

**NOTA:** O Supabase client não faz JOINs automáticos entre tabelas sem foreign keys expostas. Para queries com JOIN (ex: `fact_campaign_daily` + `campaign_inventory`), temos 2 opções:

**Opção A — Views no Supabase (recomendado):**
Criar views que já fazem o JOIN e expor via API.

**Opção B — Queries separadas + join no frontend:**
Buscar dados de cada tabela e fazer merge no código.

Recomendação: começar com **Opção B** pro MVP (mais rápido), migrar para **Opção A** quando otimizar performance.

### 6.2 Campaign Summary (query raw que precisa de join)

```typescript
// Opção B: duas queries + merge
export async function getCampaignBreakdown(
  supabase: any,
  accountId: number,
  dateStart: string,
) {
  // Inventory (nomes)
  const { data: inventory } = await supabase
    .from("campaign_inventory")
    .select(
      "campaign_id, campaign_name, status, bidding_strategy, budget_amount",
    )
    .eq("external_customer_id", accountId)
    .eq("status", "ENABLED");

  // Metrics
  const { data: metrics } = await supabase
    .from("fact_campaign_daily")
    .select("campaign_id, impressions, clicks, cost_micros, conversions")
    .eq("external_customer_id", accountId)
    .gte("date", dateStart);

  // Merge
  const campaignMap = new Map(inventory?.map((c: any) => [c.campaign_id, c]));
  const aggregated = new Map<number, any>();

  metrics?.forEach((m: any) => {
    const existing = aggregated.get(m.campaign_id) || {
      impressions: 0,
      clicks: 0,
      cost_micros: 0,
      conversions: 0,
    };
    existing.impressions += Number(m.impressions);
    existing.clicks += Number(m.clicks);
    existing.cost_micros += Number(m.cost_micros);
    existing.conversions += Number(m.conversions);
    aggregated.set(m.campaign_id, existing);
  });

  return Array.from(aggregated.entries()).map(([id, m]) => ({
    ...campaignMap.get(id),
    ...m,
    spend: m.cost_micros / 1_000_000,
    cpa: m.conversions > 0 ? m.cost_micros / 1_000_000 / m.conversions : null,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
  }));
}
```

### 6.3 Tabelas e Colunas de Referência Rápida

| Tabela                             | PK / Composite Key                                                          | Filtro principal                                  |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `ads.fact_campaign_daily`          | (external_customer_id, date, campaign_id)                                   | `external_customer_id` + `date` range             |
| `ads.fact_adgroup_daily`           | (external_customer_id, date, campaign_id, ad_group_id)                      | idem                                              |
| `ads.fact_keyword_daily`           | (external_customer_id, date, campaign_id, ad_group_id, keyword_id)          | idem                                              |
| `ads.fact_hourly_campaign_window`  | (external_customer_id, window_label, campaign_id, hour_of_day, day_of_week) | `external_customer_id` + `window_label`           |
| `ads.fact_geo_performance_window`  | (external_customer_id, window_label, campaign_id, geo_id)                   | idem                                              |
| `ads.fact_auction_insights_window` | (external_customer_id, window_label, campaign_id)                           | idem                                              |
| `ads.campaign_inventory`           | id (uuid)                                                                   | `external_customer_id` + `status = 'ENABLED'`     |
| `ads.adgroup_inventory`            | id (uuid)                                                                   | `external_customer_id`                            |
| `ads.keyword_inventory`            | (external_customer_id, campaign_id, ad_group_id, keyword_id)                | `external_customer_id`                            |
| `ads.optimization_log`             | id (serial)                                                                 | `external_customer_id` + `status` + `executed_at` |

**IMPORTANTE:** Todas as tabelas de métricas usam `cost_micros` (bigint). Para converter para NZD: `cost_micros / 1_000_000`.

---

## 7. Client Accounts (para hardcode no MVP)

| Client               | external_customer_id | Account Name         |
| -------------------- | -------------------- | -------------------- |
| ClearChange Aligners | 9652559023           | ClearChange Aligners |
| Dental Implants      | 1940590984           | Dental Implants      |
| Dental Reflections   | 7104324417           | Dental Reflections   |
| Hutt Dental Hub      | 4935460152           | Hutt Dental Hub      |
| iDD Dental Lab       | 3251235686           | iDD Dental Lab       |
| Naenae Dental Clinic | 3960818728           | Naenae Dental Clinic |
| Wainui Dental        | 3927633786           | Wainui Dental        |

**MVP default:** Usar Naenae (3960818728) como conta de desenvolvimento/teste.

---

## 8. Utility Functions

```typescript
// src/lib/utils.ts

/** Format number with NZ locale, no decimals */
export function fmt(n: number): string {
  return n.toLocaleString("en-NZ", { maximumFractionDigits: 0 });
}

/** Format number with NZ locale, 2 decimals */
export function fmtDec(n: number): string {
  return n.toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format currency (NZD) */
export function fmtCurrency(n: number): string {
  return `$${fmtDec(n)}`;
}

/** Convert cost_micros to NZD */
export function microsToNzd(micros: number): number {
  return micros / 1_000_000;
}

/** Calculate CPA safely */
export function calcCpa(
  costMicros: number,
  conversions: number,
): number | null {
  return conversions > 0 ? microsToNzd(costMicros) / conversions : null;
}

/** Calculate CTR */
export function calcCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

/** CPA color coding */
export function cpaColor(cpa: number | null): string {
  if (cpa === null) return "#9ca3af";
  if (cpa < 15) return "#34A853"; // green
  if (cpa < 30) return "#F9AB00"; // yellow
  return "#EA4335"; // red
}

/** Date range helper */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
```

---

## 9. Ordem de Implementação

### Sprint 1 — Foundation (dia 1-2)

1. `create-next-app` + instalar dependências
2. Configurar Tailwind com tokens customizados
3. Instalar shadcn/ui components
4. Criar `Sidebar`, `Topbar`, `Footer` (layout base)
5. Configurar Supabase client
6. `.env.local` com credenciais

### Sprint 2 — Overview (dia 2-3)

1. Implementar queries de Overview (daily + campaigns + optimizations)
2. Montar `KpiCards`, `WeeklyChart`, `ConversionSplit`, `CampaignTable`, `OptimizationList`
3. Conectar dados reais (Naenae como default)
4. Period selector funcional (7d/14d/30d)

### Sprint 3 — Campaigns + Keywords (dia 3-4)

1. Tela Campaigns com tabela + drill-down ad groups
2. Tela Keywords com quality score, match type
3. Loading states e skeletons

### Sprint 4 — Insights + Optimizations (dia 4-5)

1. Heatmap horário (Recharts)
2. Geo performance
3. Auction insights
4. Timeline de otimizações com filtros

### Sprint 5 — Polish (dia 5-6)

1. Client selector (dropdown para trocar entre contas)
2. Responsividade básica
3. Error handling
4. Deploy local para teste

### Fase posterior (após MVP funcional)

- Supabase Auth + RLS
- Tabela `dashboard_users` (user ↔ client mapping)
- Perfil do usuário, Settings
- Deploy público (Vercel ou EasyPanel)
- Meta Ads integration

---

## 10. Comandos para Claude Code

Ao abrir o Claude Code no repo, use estes prompts para bootstrapar:

### Prompt 1 — Inicializar projeto

```
Cria o projeto Next.js "ads-ai-dashboard" com TypeScript, Tailwind, App Router e src dir.
Instala: @supabase/supabase-js, recharts, date-fns.
Configura shadcn/ui com tema customizado.
Segue a folder structure do documento ads-ai-dashboard-setup.md.
```

### Prompt 2 — Design system

```
Configura o Tailwind com os tokens customizados do documento (cores brand, surface, border).
Adiciona a font DM Sans via next/font/google.
Cria o arquivo src/lib/constants.ts com categoryStyles, statusStyles e colors.
Cria o arquivo src/lib/utils.ts com todas as utility functions do documento.
```

### Prompt 3 — Layout base

```
Cria o layout do dashboard com Sidebar (light theme, nav items, platform badges, logo),
Topbar (tabs, search, avatar) e Footer.
Usa os tokens definidos em constants.ts.
Sidebar active item usa bg #eff6ff com text #4285F4.
Referência visual: o prototype v5 que aprovamos.
```

### Prompt 4 — Overview page

```
Implementa a tela Overview com dados reais do Supabase (Naenae, account 3960818728).
Components: KpiCards, WeeklyChart (Recharts BarChart), ConversionSplit (PieChart + progress),
CampaignTable, OptimizationList.
Usa as queries definidas no documento (getCampaignBreakdown, etc).
Period selector: 7d, 14d, 30d.
```

---

## 11. Referência Visual

O design aprovado está no artifact `ads-ai-dashboard-v5-full-light.jsx` na conversa do Claude.
Características-chave:

- Full light theme (bg #f5f6f8, cards white)
- Sidebar light com logo gradient Google→Meta blue
- Google dots (4 cores) como branding element
- Platform badges (Google Ads: Active, Meta Ads: Soon)
- Greeting personalizado ("Good afternoon, {Client} 👋")
- KPI cards com ícone colorido no canto superior direito
- Bar chart com highlight Google Blue na barra de maior valor
- Donut chart para conversion split + progress bars
- Optimization list com category badges + status badges
- CPA color coding: green <$15, yellow <$30, red >$30
