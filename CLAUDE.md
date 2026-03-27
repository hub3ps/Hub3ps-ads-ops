# Ads AI Dashboard — Project Reference

> Referência completa para conversas futuras e contexto após compactação.
> **Última atualização:** 2026-03-27 (Sprint 10 — Sidebar colapsável + fix font DM Sans)

---

## 1. O que é o projeto

**Nome:** Ads Intelligence by Hub3Ps
**Descrição:** Dashboard read-only para clientes de tráfego pago (Google Ads) consultarem performance das campanhas.
**Público:** Clínicas odontológicas na Nova Zelândia (7 contas ativas).
**Idioma da UI:** Inglês (clientes NZ). Conversas de dev em português brasileiro.
**Fase atual:** MVP completo — Auth + RLS + Deploy configurado. Em produção no EasyPanel.

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
| `dashboard_users`               | Auth        | `auth_user_id` (UUID) → `client_id`, `role`, `display_name`, `first_name`, `last_name`, `job_title`, `phone`, `country`, `created_at` |
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
- Dois effects: Effect 1 carrega user + todos os `client_ids`; Effect 2 carrega `gads_accounts` quando `selectedClientId` muda
- Expõe: `{ accountId, accountName, displayName, loading, clients, selectedClientId, setSelectedClientId }`
- **Multi-client:** se `clients.length > 1`, sidebar mostra `ClientSelector` dropdown; se 1, mostra info estática
- `clients: ClientOption[]` só é populado quando o user tem >1 cliente em `dashboard_users`

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

### Design tokens — padrão tipográfico das páginas

```
Page title (h1):  text-[22px] font-bold text-[#111827]
Page subtitle:    text-[14px] text-[#9ca3af] mt-1
Section h2:       text-[16px] font-semibold text-[#111827]
Card padding:     p-7
Labels:           text-[13px] font-medium text-[#6b7280] mb-2
Inputs:           px-4 py-3 text-[14px] rounded-xl border border-[#e2e4ea]
                  focus: border-[#4285F4] ring-2 ring-[#4285F4]/10
```

> Este padrão está documentado como comentário no topo de `settings/page.tsx` e deve ser seguido em novas páginas quando tocadas.

### Tailwind v4 — importante
- Não existe `tailwind.config.ts` — tokens definidos em `@theme` block no `globals.css`
- Cores custom: `bg-[#hex]` inline ou via CSS variables

### shadcn v4 — importante
- Usa `@base-ui/react` internamente, **não** `@radix-ui`
- `CollapsibleTrigger` **não tem** prop `asChild`
- Sem `disabled` prop no Trigger — controlar via estado

### DM Sans — variable font
```typescript
// ✅ correto (Next.js 16+ com Turbopack — axes: ["opsz"] causa erro ao recompilar do zero)
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
// ❌ errado — axes causa erro de compilação no Turbopack ao limpar cache
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], axes: ["opsz"] });
// ❌ errado — weight array não pode ser usado com axes
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
│       ├── settings/page.tsx               # Settings (Personal Data, Account, Change Password)
│       └── keywords/page.tsx               # Redirect → /dashboard/campaigns/keywords
│
├── components/
│   ├── ui/                                 # shadcn auto-generated
│   ├── layout/
│   │   ├── sidebar.tsx                     # Sidebar (desktop) + MobileSidebar (drawer) + SidebarContent (shared)
│   │   ├── topbar.tsx                      # Greeting firstName + clínica + data; hamburger mobile; avatar com foto
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── kpi-cards.tsx                   # 4 KPIs: Impressions, Clicks, Spend, Conversions
│   │   ├── weekly-chart.tsx                # Bar chart (Recharts) — highlight barra máxima
│   │   ├── conversion-split.tsx            # Donut chart + progress bars por campanha
│   │   ├── campaign-table.tsx              # Tabela campanhas (prop compact para col estreita)
│   │   ├── ad-copy-section.tsx             # RSA previews: Campaign → Ad Group → cards Desktop/Mobile
│   │   ├── optimization-list.tsx           # Accordion: client_title + client_impact + savings
│   │   └── portfolio-overview.tsx          # Vista "All accounts": KPI cards + tabela expandível por clínica + cards mobile
│   └── shared/
│       ├── google-dots.tsx
│       ├── platform-badge.tsx
│       ├── period-selector.tsx             # 7d/14d/30d + Custom date range picker
│       └── loading-skeleton.tsx
│
├── app/dashboard/
│   └── shell.tsx                           # DashboardShell — client wrapper com sidebarOpen state
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
        ├── profile.ts                     # getProfileData() + parsers: parsePlaybook, parseConfigInventory, parseDataContract — todos bilíngues (PT + EN)
        └── portfolio.ts                   # getPortfolioData(supabase, accountIds[], start, end) → PortfolioClinic[]
```

---

## 7. Páginas Implementadas

### Login (`/login`)
- Página pública, redireciona para `/dashboard` se já autenticado (middleware)
- Logo Ads Intelligence + formulário email + password
- `signInWithPassword` → erro inline se falhar → redirect `/dashboard` no sucesso

### Overview (`/dashboard`)
- Se `isAllAccounts` → renderiza `<PortfolioOverview />` em vez do Overview normal
- KPI cards: Impressions, Clicks, Spend, Conversions (com CTR e CPA)
- Bar chart semanal de clicks com highlight na barra máxima (Recharts)
- Donut chart + progress bars de conversões por campanha
- Tabela de campanhas compact (Campaign, Spend, CPA)
- Optimization list accordion (client_title + client_impact + savings)
- Layout: OptimizationList (col-span-2) + CampaignTable compact (col-span-1)

### Portfolio Overview (`/dashboard` com All accounts selecionado)
- Ativado quando `isAllAccounts === true` (sentinel `ALL_ACCOUNTS_ID = "__all__"`)
- **4 KPI cards** (mesmo design que kpi-cards.tsx): Impressions, Clicks, Spend, Conversions — soma de todas as contas
- **Desktop:** tabela expandível — linha por clínica (nome clicável → muda `selectedClientId`), spend share bar, chevron expande campanhas com status dot
- **Mobile:** cards por clínica com grid 3-col (Spend/Conv./Clicks), botão expande campanhas
- **Total row** no rodapé da tabela desktop
- `getPortfolioData()` — agrega `fact_campaign_daily` + join `campaign_inventory` + `gads_accounts`; retorna `PortfolioClinic[]` sorted by spend DESC
- Clicar no nome da clínica chama `setSelectedClientId(client_id)` → troca para conta individual

### Campaigns — Performance (`/dashboard/campaigns`)
- **Mobile (`md:hidden`):** `MobileCampaignCard` — métricas primárias (Spend/Conv./CPA) em grid 3 col, métricas secundárias (imp·clicks·CTR) em linha, botão "View ad groups" expande mini-cards por ad group
- **Desktop (`hidden md:block`):** tabela completa (Campaign, Status, Impressions, Clicks, CTR, Spend, Conv., CPA)
- Drill-down: mesmos `expanded`, `toggleCampaign`, `adGroups` usados por ambos os layouts
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
- **Parsers bilíngues (PT + EN):** todos os `getSection()`, `extractBold()` e campos de tabela aceitam labels em português e inglês — fallback: tenta PT, se vazio tenta EN
- **4 seções:**
  1. **Clinic Overview** — grid 2 colunas: name, website (link), address, contact, timezone, currency + Role paragraph
  2. **Services Advertised** — pills verdes (✓ can advertise) + pills vermelhas (✗ cannot advertise)
  3. **Campaign Setup** — accordion por campanha: budget badge, bidding/schedule/coverage pills, tabela de ad groups com tCPA
  4. **Performance Targets** — objective text, tabela CPA targets, tabela conversion actions, caixa amarela com tracking note

### Settings (`/dashboard/settings`)
- Lê `?tab=` da URL via `useSearchParams` (wrapped em `<Suspense>` para o build de produção)
- `router.replace(/dashboard/settings?tab=${id})` ao navegar entre seções
- Mobile: 3 tabs em `flex` (distribuição igual, `flex-1`); Desktop: menu vertical lateral `w-48`
- **Personal Data** — grid `grid-cols-1 sm:grid-cols-2`: First Name, Last Name, Job Title, Country, Phone, Email (read-only)
  - Busca/salva em `dashboard_users` via `auth_user_id`; campos: `first_name`, `last_name`, `job_title`, `phone`, `country`, `avatar_url`
  - **Avatar upload:** file picker (JPG/PNG/WebP, max 2MB), preview imediato, upsert para `avatars/{user_id}/avatar` no Supabase Storage, URL pública com cache-buster salva em `avatar_url`
  - Botão "Remove" limpa avatar; Toast inline de sucesso/erro
- **Account** — read-only: clínicas vinculadas, role, member since, plan "Professional" (hardcoded)
  - Query: `dashboard_users.select("role, created_at, clients:client_id(name)")`
  - Mobile: rows empilhadas (`flex-col sm:flex-row`)
- **Change Password** — validação min 8 chars + confirmação; `supabase.auth.updateUser({ password })`
  - Toast inline de sucesso/erro

---

## 8. Componentes-Chave

### Sidebar (`src/components/layout/sidebar.tsx`)
- Extraído em `SidebarContent({ onClose?, collapsed?, onToggle? })` — shared entre desktop e mobile
- **Colapsável:** `export function Sidebar()` — gere o próprio estado `collapsed` via `useState(false)` + `useEffect` que lê `localStorage("sidebar-collapsed")` após mount (evita hydration mismatch)
- Largura via `style={{ width: collapsed ? "64px" : "224px", transition: "width 300ms ease" }}` (inline style — mais confiável que classes Tailwind dinâmicas com Turbopack)
- Colapsado: logo mostra só os 4 dots; client selector mostra inicial ou grid icon; platform badges somem; nav items mostram só ícone com `title` tooltip; Campaigns colapsa pra link direto; botão seta no footer faz toggle
- `export function MobileSidebar({ open, onClose })` — backdrop + drawer com `translate-x`, auto-fecha ao mudar de rota via `usePathname` + `useRef`; sempre expandida, sem suporte a collapse
- **Multi-client:** `clients.length > 1` → mostra `<ClientSelector>` dropdown; caso contrário, info estática
- Sem Sign out nem Settings — ambos no dropdown do avatar no Topbar
- Submenu Campaigns expansível; auto-expande quando qualquer `/dashboard/campaigns/*` está ativo

### DashboardShell (`src/app/dashboard/shell.tsx`)
- `"use client"` — gere `sidebarOpen` state (mobile drawer)
- Sidebar collapse é self-contained no componente `Sidebar` — shell não precisa saber do estado
- Renderiza: `<Sidebar>` (hidden md:flex) + `<MobileSidebar>` + `<Topbar onMenuClick>` + `<main>` + `<Footer>`
- `layout.tsx` simplificado para server component — só envolve em `<AccountProvider>` + `<DashboardShell>`

### AccountContext (`src/contexts/account-context.tsx`)
```typescript
interface ClientOption { id: string; name: string; }

interface AccountContextValue {
  accountId: number;          // external_customer_id do Google Ads
  accountName: string;        // nome da conta Google Ads
  displayName: string;        // nome completo do utilizador (de dashboard_users)
  firstName: string;          // primeiro nome (de dashboard_users.first_name)
  avatarUrl: string;          // URL pública do avatar (de dashboard_users.avatar_url)
  loading: boolean;
  clients: ClientOption[];    // lista de clientes (vazia se user tem só 1)
  selectedClientId: string;   // client_id activo
  setSelectedClientId: (id: string) => void;
}
// Cadeia: auth.getUser() → dashboard_users (todos os rows) → gads_accounts (por selectedClientId)
// Query: select("client_id, display_name, first_name, avatar_url")
```

### Topbar (`src/components/layout/topbar.tsx`)
- Recebe `onMenuClick?` prop — hamburger button (md:hidden) chama o callback do DashboardShell
- **Saudação 3 linhas:** `Good [morning/afternoon/evening], {firstName} 👋` → clínica (ícone pin + accountName) → data
  - `greetingName = firstName || displayName.split(" ")[0] || "there"`
  - Clínica atualiza automaticamente ao trocar de cliente no ClientSelector
- Avatar circle: mostra `<img src={avatarUrl}>` se disponível, senão inicial do `displayName`
- Avatar abre dropdown: header (displayName + email), 3 links Settings, Sign out
- Click outside fecha via `useRef` + `mousedown`; animação `dropdownIn`
- Email via `supabase.auth.getUser()` em `useEffect` local
- Sign out: `supabase.auth.signOut()` + `router.push("/login")` + `router.refresh()`

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
10. **Conversions:** Google Ads usa atribuição fracionária (ex: `21.430491`). Sempre usar `Math.round()` antes de exibir conversões na UI. CPA usa o decimal internamente para o cálculo, mas exibe com `.toFixed(2)`

---

## 10. Estado Atual — O que está funcionando

- ✅ **Auth completo:** login page, middleware, sessão via cookies, logout
- ✅ **RLS ativo** em todas as tabelas do schema `ads`
- ✅ **AccountContext** multi-client: dois effects, ClientSelector condicional na sidebar; expõe `firstName`, `avatarUrl`
- ✅ Overview completo com dados reais
- ✅ KPI cards, bar chart, donut chart, campaign table compact, optimization accordion
- ✅ Filtro de período: 7d / 14d / 30d / Custom
- ✅ Sidebar: desktop colapsável (w-56↔w-16, estado em localStorage) + mobile drawer com backdrop, auto-fecha ao navegar
- ✅ Campaigns: mobile card layout (MobileCampaignCard) + desktop tabela com drill-down, sort clicável
- ✅ Ad Groups: tabela flat com coluna Campaign, sort clicável
- ✅ Keywords: hierarquia via `v_keyword_metrics`, sort clicável
- ✅ Ads: RSA previews Desktop/Mobile, seeded random
- ✅ Insights: heatmap horário + auction insights
- ✅ Optimization History: filtros status + categoria + período
- ✅ Company Profile: 4 seções, parseia markdown, `content_md_en` com fallback; parsers bilíngues PT + EN
- ✅ Settings: Personal Data (editable + avatar upload), Account (read-only), Change Password; tabs mobile; Suspense boundary
- ✅ Topbar: saudação com firstName, clínica (pin icon), data; hamburger mobile; avatar com foto; dropdown Settings + Sign out
- ✅ **Responsividade mobile completa:** todas as páginas, overflow-x-auto nas tabelas, card layouts onde necessário
- ✅ **Avatar upload:** Supabase Storage `avatars/{user_id}/avatar`, preview imediato, URL salva em `dashboard_users.avatar_url`
- ✅ **Conversions arredondadas** com `Math.round()` em todos os componentes de exibição
- ✅ **All accounts / Portfolio Overview:** `ALL_ACCOUNTS_ID`, `isAllAccounts`, `allAccountIds` no AccountContext; ClientSelector com opção "All accounts" no topo; PortfolioOverview com KPI cards + tabela expandível desktop + cards mobile
- ✅ Tipografia refinada: tokens documentados em `settings/page.tsx` (22px bold / 14px / p-7 / inputs rounded-xl)
- ✅ Loading skeletons em todas as páginas
- ✅ TypeScript sem erros
- ✅ **Fix font DM Sans:** removido `axes: ["opsz"]` — causa erro de compilação no Turbopack 16.2.1 ao limpar cache `.next`
- ✅ Dockerfile com `output: standalone`, ARG/ENV para vars Supabase, deploy no EasyPanel

---

## 11. O que falta / Próximos passos

### Deploy
- ✅ Dockerfile multi-stage com `output: standalone`
- ✅ ARG/ENV para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no build stage
- ✅ `.dockerignore` configurado
- ✅ Repositório: `https://github.com/hub3ps/Hub3ps-ads-ops.git` (branch `main`)
- [ ] Configurar domínio e HTTPS no EasyPanel

### Refinamentos pendentes
- [ ] Variar descriptions entre os previews do Ad Copy (actualmente podem repetir)
- [ ] Geo performance na página Insights (tabela `fact_geo_performance_window`)
- [ ] Sort clicável na tabela de Campaigns do Overview (compact)
- [ ] Card layout mobile para Ad Groups e Keywords (actualmente apenas scroll horizontal)

### Fase pós-deploy
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
