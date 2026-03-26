# Ads AI Dashboard — Project Reference

> Referência completa para conversas futuras e contexto após compactação.
> **Última atualização:** 2026-03-25 (Sprint 5 — Auth + RLS + Company Profile completo)

---

## 1. O que é o projeto

**Nome:** Ads Intelligence by Hub3Ps
**Descrição:** Dashboard read-only para clientes de tráfego pago (Google Ads) consultarem performance das campanhas.
**Público:** Clínicas odontológicas na Nova Zelândia (7 contas ativas).
**Idioma da UI:** Inglês (clientes NZ). Conversas de dev em português brasileiro.
**Fase atual:** MVP completo com Auth + RLS. Próximo passo: deploy no EasyPanel via Dockerfile.

---

## 2. Stack Técnica

```
Framework:    Next.js 14 (App Router, Turbopack)
Language:     TypeScript
Styling:      Tailwind CSS v4 (CSS-based config, sem tailwind.config.ts)
Components:   shadcn/ui v4 (base-ui, não radix-ui)
Charts:       Recharts
Database:     Supabase (Postgres) — @supabase/ssr + @supabase/supabase-js
Auth:         Supabase Auth (email + password) com middleware Next.js
Font:         DM Sans (Google Fonts, variable font — sem array de weight)
Node:         /opt/homebrew/bin (prefixar PATH em comandos npm/npx)
Dev server:   http://localhost:3000
```

### Dependências instaladas
- `@supabase/supabase-js`, `@supabase/ssr`
- `recharts`, `date-fns`
- shadcn components: `card`, `table`, `badge`, `button`, `tabs`, `separator`, `skeleton`, `collapsible`

---

## 3. Supabase

- **Project ID:** `jxhtzkzmhbxxnlaiywew`
- **URL:** `https://jxhtzkzmhbxxnlaiywew.supabase.co`
- **Schema:** `ads` — **todas as queries usam `.schema("ads").from("tabela")`**
- **Auth:** anon key no `.env.local` (JWT começando com `eyJ`) — chave legacy (tipo anon, não publishable)
- **RLS:** ✅ **ATIVO** em todas as 25 tabelas do schema `ads`
- **GRANTs:** role `authenticated` tem `SELECT` em todas as tabelas do schema `ads`

```typescript
// ✅ correto
supabase.schema("ads").from("fact_campaign_daily").select(...)

// ❌ errado — vai ao schema public, não encontra a tabela
supabase.from("fact_campaign_daily").select(...)
```

### RLS — como funciona

O RLS usa as funções helper para determinar quais dados o utilizador autenticado pode ver:

```sql
-- Retorna os client_ids associados ao utilizador logado
ads.get_my_client_ids()  → uuid[]

-- Retorna os external_customer_ids (Google Ads) associados ao utilizador logado
ads.get_my_account_ids() → bigint[]
```

As policies em cada tabela usam essas funções. O frontend **não precisa filtrar por client** — o RLS filtra automaticamente. Mas as queries ainda passam `external_customer_id` explicitamente por clareza e performance.

### Mapeamento utilizador → conta

```
auth.users (Supabase Auth)
    └── ads.dashboard_users (auth_user_id → client_id)
            └── ads.gads_accounts (client_id → external_customer_id)
                    └── ads.clients (client_id → name, timezone, currency)
```

### Contas de clientes (external_customer_id)

| Cliente              | ID             |
| -------------------- | -------------- |
| ClearChange Aligners | 9652559023     |
| Dental Implants      | 1940590984     |
| Dental Reflections   | 7104324417     |
| Hutt Dental Hub      | 4935460152     |
| iDD Dental Lab       | 3251235686     |
| **Naenae Dental** ⭐  | **3960818728** |
| Wainui Dental        | 3927633786     |

> ⭐ Conta padrão de desenvolvimento: **Naenae (3960818728)**

### Tabelas principais (schema `ads`)

| Tabela                          | Tipo        | Filtros principais                                   |
| ------------------------------- | ----------- | ---------------------------------------------------- |
| `fact_campaign_daily`           | Métricas    | `external_customer_id` + `date` range                |
| `fact_adgroup_daily`            | Métricas    | idem + `campaign_id`                                 |
| `fact_keyword_daily`            | Métricas    | idem + `campaign_id` + `ad_group_id`                 |
| `fact_hourly_campaign_window`   | Window      | `external_customer_id` + `window_label`              |
| `fact_geo_performance_window`   | Window      | idem                                                 |
| `fact_auction_insights_window`  | Window      | idem                                                 |
| `fact_search_terms_window`      | Window      | idem                                                 |
| `campaign_inventory`            | Inventário  | `external_customer_id` + `status`                    |
| `adgroup_inventory`             | Inventário  | `external_customer_id`                               |
| `keyword_inventory`             | Inventário  | `external_customer_id`                               |
| `ad_copy_inventory`             | Inventário  | `external_customer_id` + `status = 'ENABLED'`        |
| `negatives_inventory`           | Inventário  | `external_customer_id`                               |
| `optimization_log`              | Log         | `external_customer_id` + `status` + `executed_at`    |
| `documents`                     | Conteúdo    | `client_id` — campos: `doc_key`, `content_md`, `content_md_en` |
| `clients`                       | Cadastro    | `id` (UUID) — `name`, `country`, `timezone`, `currency` |
| `dashboard_users`               | Auth        | `auth_user_id` (UUID) → `client_id`, `role`, `display_name` |
| `gads_accounts`                 | Auth        | `external_customer_id` → `client_id`, `account_name` |
| `v_keyword_metrics`             | View        | `external_customer_id` + `date` range (view do banco) |

**`cost_micros`** → sempre dividir por `1_000_000` para obter NZD.

### documents — campos relevantes
- `doc_key` — identificador do documento: `playbook`, `config_inventory`, `data_contract`, `history_ops`
- `content_md` — conteúdo em português (markdown)
- `content_md_en` — conteúdo traduzido para inglês (markdown) — pode ser `null` se ainda não traduzido
- **Sempre usar `content_md_en ?? content_md`** como fallback
- Filtrar por `client_id` (UUID), **não** por `external_customer_id`

### optimization_log — campos relevantes
| Campo | Uso |
| ----- | --- |
| `client_title` | Título para o cliente (pode ser null → fallback: `action_summary`) |
| `client_impact` | Impacto em linguagem simples para o cliente |
| `details.economia_projetada_mensal` | Savings mensal projetado (NZD) |
| `action_summary` | Descrição técnica — **nunca mostrar na UI** |
| `details.justification`, `details.quality_score`, etc. | Uso interno — **nunca mostrar na UI** |
| `category`, `status` | DONE / MONITORING / SKIPPED |
| `executed_at` | Timestamp (filtrado pelo period selector) |

### ad_copy_inventory — campos relevantes
- `headlines_raw`, `descriptions_raw` — JSON strings → sempre usar `JSON.parse()`
- `final_urls` — JSON string com array de URLs → `JSON.parse()[0]` para a URL principal
- `path1`, `path2` — podem ser a string `"null"` → verificar antes de usar
- `ad_strength` — EXCELLENT / GOOD / AVERAGE / POOR
- `assetPerformanceLabel` (dentro dos itens parseados) — GOOD / BEST / LEARNING / PENDING / LOW
- A tabela **não contém** `campaign_name` nem `ad_group_name` — fazer fetch paralelo de `campaign_inventory` e `adgroup_inventory` e merge via Maps em JS

---

## 4. Autenticação

### Fluxo
1. Utilizador acede qualquer rota → middleware verifica sessão
2. Sem sessão → redirect para `/login`
3. Login com email + password (`supabase.auth.signInWithPassword`)
4. Com sessão → `/dashboard` carrega, `AccountContext` busca dados do utilizador

### Middleware (`src/middleware.ts`)
- Protege `/dashboard/*` — redireciona para `/login` se não autenticado
- Redireciona `/login` → `/dashboard` se já autenticado
- Atualiza cookies de sessão em cada request (`setAll`)
- Matcher: `['/dashboard/:path*', '/login']`

### AccountContext (`src/contexts/account-context.tsx`)
- Busca `getUser()` → `dashboard_users` (pelo `auth_user_id`) → `gads_accounts` (pelo `client_id`)
- Expõe: `{ accountId: number, accountName: string, displayName: string, loading: boolean }`
- **Sem dropdown de conta** — a conta é determinada pelo login
- Sem `setAccountId` — conta é imutável durante a sessão

### Supabase client (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr"
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Logout
- Sidebar tem botão "Sign out" no footer
- Chama `supabase.auth.signOut()` + `router.push("/login")` + `router.refresh()`

---

## 5. Design System

### Cores

```
Google Blue:   #4285F4  (accent primário)
Google Green:  #34A853  (positivo, conversões)
Google Yellow: #FBBC04 / #F9AB00  (warning, monitoring)
Google Red:    #EA4335  (negativo, alert)
Meta Blue:     #1877F2  (secundário)

bg:            #f5f6f8  (background da página)
surface:       #ffffff  (cards)
border:        #e2e4ea
borderLight:   #eceef2

text:          #111827
textSecondary: #4b5563
textMuted:     #6b7280
textDim:       #9ca3af
```

### CPA Color Coding
- `< $15` → green `#34A853`
- `< $30` → yellow `#F9AB00`
- `>= $30` → red `#EA4335`
- `null` → gray `#9ca3af`

### Ad Strength colors
- EXCELLENT → green `#059669` / bg `#ecfdf5`
- GOOD → blue `#4285F4` / bg `#eff6ff`
- AVERAGE → yellow `#d97706` / bg `#fffbeb`
- POOR → red `#EA4335` / bg `#fef2f2`

### Asset Performance colors (headlines/descriptions)
- GOOD / BEST → green `#059669`
- LEARNING → blue `#4285F4`
- PENDING → gray `#6b7280`
- LOW → red `#EA4335`

### Tailwind v4 — importante
- Não existe `tailwind.config.ts` — tokens definidos em `@theme` block no `globals.css`
- Cores custom: `bg-[#hex]` inline ou via CSS variables

### shadcn v4 — importante
- Usa `@base-ui/react` internamente, **não** `@radix-ui`
- `CollapsibleTrigger` **não tem** prop `asChild`
- Sem `disabled` prop no Trigger — controlar via estado

### DM Sans — variable font
```typescript
// ✅ correto
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], axes: ["opsz"] });
// ❌ errado — causa erro de axes em non-variable font
const dmSans = DM_Sans({ weight: ["300", "400"], axes: ["opsz"] });
```

---

## 6. Estrutura de Ficheiros

```
src/
├── middleware.ts                           # Auth guard: /dashboard/* → /login se não autenticado
├── app/
│   ├── layout.tsx                          # Root layout (DM Sans font)
│   ├── page.tsx                            # Redirect → /dashboard (middleware trata auth)
│   ├── globals.css                         # Tailwind v4 + design tokens
│   ├── login/page.tsx                      # Página de login (email + password)
│   └── dashboard/
│       ├── layout.tsx                      # Wrapped em AccountProvider
│       ├── page.tsx                        # Overview
│       ├── insights/page.tsx               # Insights (heatmap + auction)
│       ├── campaigns/
│       │   ├── page.tsx                    # Campaigns — tabela performance com drill-down
│       │   ├── ad-groups/page.tsx          # Ad Groups — tabela flat de todos os ad groups
│       │   ├── keywords/page.tsx           # Keywords — hierarquia Campaign → Ad Group → tabela
│       │   └── ads/page.tsx                # Ads — RSA previews (Ad Copy)
│       ├── optimizations/page.tsx          # Optimization History
│       ├── profile/page.tsx                # Company Profile (parseia documentos markdown)
│       └── keywords/page.tsx               # Redirect → /dashboard/campaigns/keywords
│
├── components/
│   ├── ui/                                 # shadcn auto-generated
│   ├── layout/
│   │   ├── sidebar.tsx                     # Sidebar + logout button (sem client selector)
│   │   ├── topbar.tsx                      # Greeting com accountName do contexto + skeleton
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── kpi-cards.tsx                   # 4 KPIs: Impressions, Clicks, Spend, Conversions
│   │   ├── weekly-chart.tsx                # Bar chart (Recharts) — highlight barra máxima
│   │   ├── conversion-split.tsx            # Donut chart + progress bars por campanha
│   │   ├── campaign-table.tsx              # Tabela campanhas (prop compact para col estreita)
│   │   ├── ad-copy-section.tsx             # RSA previews: Campaign → Ad Group → cards Desktop/Mobile
│   │   └── optimization-list.tsx           # Accordion: client_title + client_impact + savings
│   └── shared/
│       ├── google-dots.tsx
│       ├── platform-badge.tsx
│       ├── period-selector.tsx             # 7d/14d/30d + Custom date range picker
│       └── loading-skeleton.tsx
│
├── contexts/
│   └── account-context.tsx                 # AccountProvider — busca user → dashboard_users → gads_accounts
│
├── hooks/
│   ├── use-period.ts                       # usePeriod() — preset (7/14/30d) ou custom range
│   ├── use-sort.ts                         # useSort() + sortRows() — sort clicável reutilizável
│   └── use-client-data.ts                  # (legado — não usar)
│
└── lib/
    ├── constants.ts                        # colors, categoryStyles, statusStyles, CLIENT_ACCOUNTS
    ├── utils.ts                            # cn, fmt, fmtCurrency, microsToNzd, calcCpa, cpaColor, getDateRange
    ├── supabase/
    │   ├── client.ts                       # createBrowserClient() — browser
    │   ├── server.ts                       # createServerClient() — RSC
    │   └── types.ts                        # Tipos manuais
    └── queries/
        ├── overview.ts                     # getOverviewData(), getCampaignBreakdown()
        ├── campaigns.ts                    # getCampaigns(), getAllAdGroups(), getAdGroups(), getAdCopy()
        ├── keywords.ts                     # getKeywords() → CampaignKeywords[] via v_keyword_metrics
        ├── insights.ts                     # getHourlyData(), getAuctionInsights()
        ├── optimizations.ts               # getOptimizations(supabase, accountId, options?)
        └── profile.ts                     # getProfileData() + parsers: parsePlaybook, parseConfigInventory, parseDataContract
```

---

## 7. Páginas Implementadas

### Login (`/login`)
- Página pública, redireciona para `/dashboard` se já autenticado (middleware)
- Logo Ads Intelligence + formulário email + password
- `signInWithPassword` → erro inline se falhar → redirect `/dashboard` no sucesso

### Overview (`/dashboard`)
- KPI cards: Impressions, Clicks, Spend, Conversions (com CTR e CPA)
- Bar chart semanal de clicks com highlight na barra máxima (Recharts)
- Donut chart + progress bars de conversões por campanha
- Tabela de campanhas compact (Campaign, Spend, CPA)
- Optimization list accordion (client_title + client_impact + savings)
- Layout: OptimizationList (col-span-2) + CampaignTable compact (col-span-1)

### Campaigns — Performance (`/dashboard/campaigns`)
- Tabela completa (Campaign, Status, Impressions, Clicks, CTR, Spend, Conv., CPA)
- Ícone de trend line azul por campanha; ícone de grid azul por ad group
- Drill-down: clicar numa campanha expande sub-tabela de ad groups
- Múltiplas campanhas podem estar abertas simultaneamente (`Set<number>`)
- Sort clicável em todas as colunas (campanhas: default spend; ad groups: default spend)

### Campaigns — Ad Groups (`/dashboard/campaigns/ad-groups`)
- Tabela flat de todos os ad groups da conta
- Colunas: Ad Group, Campaign, Status, Impressions, Clicks, CTR, Spend, Conv., CPA
- `getAllAdGroups()` — agrega `fact_adgroup_daily` + `adgroup_inventory` + `campaign_inventory`
- Todas as colunas ordenáveis (default spend DESC)

### Campaigns — Keywords (`/dashboard/campaigns/keywords`)
- Hierarquia accordion: Campaign → Ad Group → tabela de keywords
- `getKeywords()` usa view `v_keyword_metrics` (single query, JOINs server-side no Postgres)
- Agrega por chave composta `keyword_id + campaign_id + ad_group_id`
- Header do ad group mostra totals (clicks, spend, conversions)
- Tabela: Keyword | Match Type | QS | Impressions | Clicks | CTR | Spend | CPA
- Match Type badges: BROAD=laranja, PHRASE=azul, EXACT=verde
- Quality Score colorido: ≥8 verde, ≥5 amarelo, <5 vermelho
- Todas as colunas ordenáveis (default clicks DESC dentro de cada ad group)

### Campaigns — Ads (`/dashboard/campaigns/ads`)
- RSA preview cards: Campaign → Ad Group → previews por headline
- 1 preview por headline do RSA (se 13 headlines → 13 cards)
- Toggle Desktop (580px) / Mobile (260px)
- Desktop: card com Google logo + search bar fake + ad result + linhas orgânicas
- Mobile: card clean estilo Google Ads — hamburger + Google logo + search bar `#f1f3f4`
- Random determinístico (`seededRng`) — sem hydration mismatch
- Ad Strength badge no topo de cada bloco

### Insights (`/dashboard/insights`)
- Heatmap horário (7 dias × 24 horas) com gradient azul por intensidade de clicks
- Tabela de Auction Insights (competitor domain + impression share, overlap rate, etc.)
- Sem period selector (usa `window_label` fixo)

### Optimization History (`/dashboard/optimizations`)
- Filtros: Status (DONE / MONITORING / SKIPPED) + Categoria + Period selector
- `OptimizationList` accordion com client_title + client_impact + savings
- `client_title` pode ser null → fallback: `action_summary`

### Company Profile (`/dashboard/profile`)
- Resolução: `external_customer_id` → `client_id` via `gads_accounts`
- Fetch paralelo: `clients` + `documents` por `client_id`
- Usa `content_md_en ?? content_md` como fallback
- Parseia markdown sem biblioteca externa (split por linhas, regex)
- **4 seções:**
  1. **Clinic Overview** — grid 2 colunas: name, website (link), address, contact, timezone, currency + Role paragraph
  2. **Services Advertised** — pills verdes (✓ can advertise) + pills vermelhas (✗ cannot advertise)
  3. **Campaign Setup** — accordion por campanha: budget badge, bidding/schedule/coverage pills, tabela de ad groups com tCPA
  4. **Performance Targets** — objective text, tabela CPA targets, tabela conversion actions, caixa amarela com tracking note

---

## 8. Componentes-Chave

### Sidebar (`src/components/layout/sidebar.tsx`)
- **Sem client selector dropdown** — conta mostrada como info estática (nome + dot verde)
- Botão "Sign out" no footer (`supabase.auth.signOut()` → `/login`)
- Submenu Campaigns expansível: Performance / Ad Groups / Keywords / Ads
- Auto-expande submenu quando qualquer `/dashboard/campaigns/*` está ativo
- `NavItem` helper com prop `exact` para Overview

### AccountContext (`src/contexts/account-context.tsx`)
```typescript
// Interface atual — sem setAccountId, sem currentClient
interface AccountContextValue {
  accountId: number;      // external_customer_id do Google Ads
  accountName: string;    // nome da conta Google Ads
  displayName: string;    // nome do utilizador (de dashboard_users)
  loading: boolean;
}
// Cadeia de resolução: auth.getUser() → dashboard_users → gads_accounts
```

### usePeriod
```typescript
type PeriodState = { mode: "preset"; days: 7 | 14 | 30 } | { mode: "custom"; start: string; end: string }
// retorna: { state, dateRange: { start, end }, setPreset, setCustomRange, label }
```

### useSort + sortRows (`src/hooks/use-sort.ts`)
```typescript
const { sort, toggle } = useSort("spend");   // sort: { column, dir }
const sorted = sortRows(rows, sort.column, sort.dir);
// null vai sempre para o fim; strings usam localeCompare
```

### getProfileData (`src/lib/queries/profile.ts`)
- `parsePlaybook()` — extrai site, address, contact, role, serviços allowed/blocked
- `parseConfigInventory()` — campanhas ativas com budget, bidding, schedule, coverage, ad groups
- `parseDataContract()` — objective, conversions, CPA targets, tracking note

### AdCopySection (`src/components/dashboard/ad-copy-section.tsx`)
- `getAdCopy()` usa `Promise.all` com 3 queries + merge em JS via Maps
- `buildVariations()` — 1 variação por headline, seeded RNG por `ad.id`
- `DesktopFrame` (580px) / `MobileFrame` (260px)

### OptimizationList
- `client_title` (fallback: `action_summary`) e `client_impact`
- **Nunca** exibir `action_summary`, `details.justification` ou outros campos técnicos

---

## 9. Regras do Projeto

1. **Sempre responder em português brasileiro** nas conversas de dev
2. **UI da dashboard em inglês** — clientes são NZ, não falam português
3. **Otimizações:** usar `client_title`/`client_impact` na UI, nunca `action_summary` ou campos de `details` técnicos
4. **Nunca expor dados técnicos** ao cliente: justification, quality score interno, etc.
5. **Todas as queries Supabase** usam `.schema("ads")` antes de `.from()`
6. **cost_micros** → dividir por `1_000_000` para NZD
7. **Ad Copy:** `final_urls` é JSON string, `path1`/`path2` podem ser a string `"null"`, `headlines_raw`/`descriptions_raw` são JSON strings
8. **documents:** filtrar por `client_id` (UUID), não por `external_customer_id`; usar `content_md_en ?? content_md`
9. **Bigints do Supabase:** campos como `keyword_id`, `campaign_id`, `ad_group_id`, `external_customer_id` chegam como **string** no JS — sempre usar `String()` como chave de Map e `Number()` para operações numéricas

---

## 10. Estado Atual — O que está funcionando

- ✅ **Auth completo:** login page, middleware, sessão via cookies, logout
- ✅ **RLS ativo** em todas as tabelas do schema `ads`
- ✅ **AccountContext** resolve user → conta via `dashboard_users` + `gads_accounts`
- ✅ Overview completo com dados reais
- ✅ KPI cards, bar chart, donut chart, campaign table compact, optimization accordion
- ✅ Filtro de período: 7d / 14d / 30d / Custom
- ✅ Sidebar expansível com submenu Campaigns, info de conta, botão Sign out
- ✅ Campaigns: drill-down múltiplos accordions, ícones, sort clicável
- ✅ Ad Groups: tabela flat com coluna Campaign, sort clicável
- ✅ Keywords: hierarquia via `v_keyword_metrics`, sort clicável
- ✅ Ads: RSA previews Desktop/Mobile, seeded random
- ✅ Insights: heatmap horário + auction insights
- ✅ Optimization History: filtros status + categoria + período
- ✅ Company Profile: 4 seções, parseia markdown, `content_md_en` com fallback
- ✅ Loading skeletons em todas as páginas
- ✅ TypeScript sem erros

---

## 11. O que falta / Próximos passos

### Deploy (próximo passo)
- [ ] **Dockerfile** para build e deploy no EasyPanel
- [ ] Variáveis de ambiente no EasyPanel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Configurar domínio e HTTPS

### Refinamentos pendentes
- [ ] Variar descriptions entre os previews do Ad Copy (actualmente podem repetir)
- [ ] Geo performance na página Insights (tabela `fact_geo_performance_window`)
- [ ] Sort clicável na tabela de Campaigns do Overview (compact)

### Fase pós-deploy
- [ ] Responsividade básica (mobile/tablet)
- [ ] Error handling user-facing
- [ ] Meta Ads integration

---

## 12. Como correr o projecto

```bash
# Instalar dependências
export PATH="/opt/homebrew/bin:$PATH"
npm install

# Correr em dev
npm run dev
# → http://localhost:3000  (redireciona para /login ou /dashboard conforme auth)

# TypeScript check
export PATH="/opt/homebrew/bin:$PATH"
npx tsc --noEmit
```

### .env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://jxhtzkzmhbxxnlaiywew.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Supabase Dashboard → Settings → API → anon public (chave legacy)
```
