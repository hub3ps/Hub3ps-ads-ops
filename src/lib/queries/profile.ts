// ── Types ────────────────────────────────────────────────────────────────────

export interface ClinicInfo {
  name: string;
  country: string;
  timezone: string;
  currency: string;
  site: string;
  address: string;
  contact: string;
  role: string;
}

export interface ServicesData {
  allowed: { label: string; note: string }[];
  blocked: { label: string; note: string }[];
}

export interface AdGroupRow {
  name: string;
  tcpa: string;
  intent: string;
}

export interface CampaignConfig {
  name: string;
  budget: string;
  bidding: string;
  schedule: string;
  coverage: string;
  adGroups: AdGroupRow[];
}

export interface ConversionAction {
  name: string;
  primary: string;
  include: string;
  note: string;
}

export interface CpaTarget {
  campaign: string;
  adGroup: string;
  cpa: string;
}

export interface ContractData {
  objective: string;
  conversions: ConversionAction[];
  cpaTargets: CpaTarget[];
  trackingNote: string;
}

export interface ProfileData {
  clinic: ClinicInfo;
  services: ServicesData;
  campaigns: CampaignConfig[];
  contract: ContractData;
}

// ── Markdown helpers ─────────────────────────────────────────────────────────

function getLines(md: string): string[] {
  return md.split("\n");
}

// Extract value from "**Label:** value" on any line
function extractBold(md: string, label: string): string {
  const re = new RegExp(`\\*\\*${label}[^*]*\\*\\*:?\\s*(.+?)(?:\\n|$)`);
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

// Get lines of a section between two "## " headers
function getSection(md: string, fragment: string): string[] {
  const ls = getLines(md);
  const start = ls.findIndex((l) => l.startsWith("##") && l.includes(fragment));
  if (start === -1) return [];
  const end = ls.findIndex((l, i) => i > start + 1 && l.startsWith("## "));
  return ls.slice(start + 1, end === -1 ? undefined : end);
}

// Parse markdown table lines into array of objects
function parseTable(tableLines: string[]): Record<string, string>[] {
  const rows = tableLines.filter(
    (l) => l.includes("|") && !/^\|[-: |]+\|$/.test(l),
  );
  if (rows.length < 2) return [];
  const headers = rows[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);
  return rows.slice(1).map((row) => {
    const cells = row
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

// Strip markdown bold markers
function stripBold(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

// ── Parsers ──────────────────────────────────────────────────────────────────

function parsePlaybook(md: string): { clinic: Partial<ClinicInfo>; services: ServicesData } {
  // Header metadata (lines like "**Site:** https://...")
  const site    = extractBold(md, "Site") || extractBold(md, "Website");
  const addr    = extractBold(md, "Endereço") || extractBold(md, "Address");
  const contact = extractBold(md, "Contato") || extractBold(md, "Contact");

  // Role: first non-empty text paragraph after "## 1) Identidade" or "## 1) Identity"
  const roleSectionPt = getSection(md, "1) Identidade");
  const roleSection = roleSectionPt.length > 0 ? roleSectionPt : getSection(md, "1) Identity");
  let role = "";
  for (const line of roleSection) {
    const t = line.trim();
    if (t && !t.startsWith("#") && !t.startsWith("|") && !t.startsWith("**")) {
      role = t;
      break;
    }
  }

  // Services section (## 3)
  const svcLinesPt = getSection(md, "3) Serviços");
  const svcLines = svcLinesPt.length > 0 ? svcLinesPt : getSection(md, "3) Services");
  const allowed: ServicesData["allowed"] = [];
  const blocked: ServicesData["blocked"] = [];
  let current: "none" | "alta" | "media" | "blocked" = "none";

  for (const line of svcLines) {
    if (line.includes("PRIORIDADE ALTA")  || line.includes("HIGH PRIORITY"))   { current = "alta";    continue; }
    if (line.includes("PRIORIDADE MÉDIA") || line.includes("MEDIUM PRIORITY")) { current = "media";   continue; }
    if (line.includes("NÃO ANUNCIAR")     || line.includes("DO NOT ADVERTISE")) { current = "blocked"; continue; }

    if (line.startsWith("- ") && (current === "alta" || current === "media")) {
      const raw = stripBold(line.replace(/^- /, ""));
      // label = before " —" or "(" ; note = everything after
      const dashIdx = raw.indexOf(" —");
      const parenIdx = raw.indexOf(" (");
      const splitAt = dashIdx !== -1 ? dashIdx : parenIdx !== -1 ? parenIdx : raw.length;
      allowed.push({ label: raw.slice(0, splitAt).trim(), note: raw.slice(splitAt).replace(/^ — /, "").trim() });
    }
    if (line.startsWith("- ") && current === "blocked") {
      const raw = stripBold(line.replace(/^- /, ""));
      const parenIdx = raw.indexOf(" (");
      const splitAt = parenIdx !== -1 ? parenIdx : raw.length;
      blocked.push({ label: raw.slice(0, splitAt).trim(), note: raw.slice(splitAt).replace(/^\s*\(/, "").replace(/\)$/, "").trim() });
    }
  }

  return {
    clinic: { site, address: addr, contact },
    services: { allowed, blocked },
  };
}

function parseConfigInventory(md: string): CampaignConfig[] {
  const sectionLinesPt = getSection(md, "1) Campanhas ativas");
  const sectionLines = sectionLinesPt.length > 0 ? sectionLinesPt : getSection(md, "1) Active Campaigns");
  const campaigns: CampaignConfig[] = [];
  let cur: CampaignConfig | null = null;
  let inAdGroups = false;
  let agLines: string[] = [];

  function flush() {
    if (!cur) return;
    if (agLines.length) {
      const rows = parseTable(agLines);
      cur.adGroups = rows.map((r) => ({
        name:   r["Ad Group"] ?? r["Ad group"] ?? "",
        tcpa:   r["tCPA alvo (NZD)"] ?? r["tCPA Target (NZD)"] ?? r["tCPA target (NZD)"] ?? "",
        intent: r["Intenção principal"] ?? r["Primary Intent"] ?? r["Primary intent"] ?? "",
      }));
    }
    campaigns.push(cur);
    cur = null;
    inAdGroups = false;
    agLines = [];
  }

  for (const line of sectionLines) {
    if (
      (line.startsWith("### Campanha") || line.startsWith("### Campaign")) &&
      !line.toLowerCase().includes("pausada") &&
      !line.toLowerCase().includes("paused") &&
      !line.toLowerCase().includes("pausa")
    ) {
      flush();
      const name = line
        .replace(/^### Campanha \d+: /, "")
        .replace(/^### Campaign \d+: /, "")
        .replace(/^### Campaign: /, "")
        .trim();
      cur = { name, budget: "", bidding: "", schedule: "", coverage: "", adGroups: [] };
    } else if (line.startsWith("###")) {
      flush(); // e.g. "### Campanhas pausadas" / "### Paused Campaigns"
    } else if (cur) {
      if (line.includes("**Budget:**"))
        cur.budget   = stripBold(line.replace(/.*\*\*Budget:\*\*\s*/, ""));
      if (line.includes("**Bidding:**"))
        cur.bidding  = stripBold(line.replace(/.*\*\*Bidding:\*\*\s*/, ""));
      if (line.includes("**Programação:**") || line.includes("**Schedule:**"))
        cur.schedule = stripBold(line.replace(/.*\*\*(Programação|Schedule):\*\*\s*/, ""));
      if (line.includes("**Cobertura (geo):**") || line.includes("**Coverage (geo):**") || line.includes("**Coverage:**"))
        cur.coverage = stripBold(line.replace(/.*\*\*(Cobertura \(geo\)|Coverage \(geo\)|Coverage):\*\*\s*/, ""));
      if (line.includes("**Ad groups:**") || line.includes("**Ad Groups:**"))
        { inAdGroups = true; continue; }
      if (inAdGroups && line.startsWith("---"))
        { inAdGroups = false; continue; }
      if (inAdGroups && line.includes("|"))
        agLines.push(line);
    }
  }
  flush();
  return campaigns;
}

function parseDataContract(md: string): ContractData {
  // Section 1 - objective
  const objLinesPt = getSection(md, "1) Objetivo");
  const objLinesEn = objLinesPt.length > 0 ? objLinesPt : getSection(md, "1) Objective");
  const objLines   = objLinesEn.length > 0 ? objLinesEn : getSection(md, "1) Marketing Objective");
  const objective = objLines
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .join(" ");

  // Section 2 - conversion actions table
  const convLinesPt = getSection(md, "2) Conversion actions");
  const convLines   = convLinesPt.length > 0 ? convLinesPt : getSection(md, "2) Conversion Actions");
  const convTable = parseTable(convLines.filter((l) => l.includes("|")));
  const conversions: ConversionAction[] = convTable.map((r) => ({
    name:    r["Action name"] ?? r["Action Name"] ?? r["Nome"] ?? "",
    primary: r["Primary?"] ?? r["Primary"] ?? r["Primária?"] ?? "",
    include: r["Include in conv.?"] ?? r["Include"] ?? r["Incluir?"] ?? "",
    note:    r["Observação"] ?? r["Note"] ?? r["Notes"] ?? "",
  }));

  // Tracking note: bold "Observação" / "Note" / "Tracking" line in section 2
  let trackingNote = "";
  let inNote = false;
  for (const line of convLines) {
    if (line.startsWith("**Observação") || line.startsWith("**Note") || line.startsWith("**Tracking")) {
      inNote = true;
    }
    if (inNote) {
      const t = line.replace(/\*\*/g, "").trim();
      if (t) trackingNote += (trackingNote ? " " : "") + t;
      if (t === "" && trackingNote) break;
    }
  }
  trackingNote = trackingNote.replace(/^(Observação|Note|Tracking note)[^:]*:\s*/i, "");

  // Section 3 - CPA targets table
  const kpiLinesPt = getSection(md, "3) KPI");
  const kpiLines   = kpiLinesPt.length > 0 ? kpiLinesPt : getSection(md, "3) Operational KPI");
  const cpaTable = parseTable(kpiLines.filter((l) => l.includes("|")));
  const cpaTargets: CpaTarget[] = cpaTable.map((r) => ({
    campaign: r["Campanha"] ?? r["Campaign"] ?? "",
    adGroup:  r["Ad Group"] ?? r["Ad group"] ?? "",
    cpa:      r["CPA alvo (NZD)"] ?? r["CPA Target (NZD)"] ?? r["CPA target (NZD)"] ?? r["Target CPA (NZD)"] ?? "",
  }));

  return { objective, conversions, cpaTargets, trackingNote };
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getProfileData(
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>,
  accountId: number,
): Promise<ProfileData | null> {
  // Resolve client_id from external_customer_id
  const { data: gadsRow } = await supabase
    .schema("ads")
    .from("gads_accounts")
    .select("client_id")
    .eq("external_customer_id", accountId)
    .single();

  if (!gadsRow?.client_id) return null;
  const clientId = gadsRow.client_id as string;

  const [{ data: clientRow }, { data: docs }] = await Promise.all([
    supabase
      .schema("ads")
      .from("clients")
      .select("name, country, timezone, currency")
      .eq("id", clientId)
      .single(),
    supabase
      .schema("ads")
      .from("documents")
      .select("doc_key, content_md, content_md_en")
      .eq("client_id", clientId),
  ]);

  if (!clientRow || !docs) return null;

  const byKey = Object.fromEntries(
    (docs as { doc_key: string; content_md: string; content_md_en: string | null }[]).map((d) => [
      d.doc_key,
      d.content_md_en ?? d.content_md,
    ]),
  );

  const playbook = byKey["playbook"] ?? "";
  const config   = byKey["config_inventory"] ?? "";
  const contract = byKey["data_contract"] ?? "";

  const { clinic: pbClinic, services } = parsePlaybook(playbook);
  const campaigns = parseConfigInventory(config);
  const contractData = parseDataContract(contract);

  const clinic: ClinicInfo = {
    name:     (clientRow as { name: string }).name,
    country:  (clientRow as { country: string }).country,
    timezone: (clientRow as { timezone: string }).timezone,
    currency: (clientRow as { currency: string }).currency,
    site:     pbClinic.site     ?? "",
    address:  pbClinic.address  ?? "",
    contact:  pbClinic.contact  ?? "",
    role:     pbClinic.role     ?? "",
  };

  return { clinic, services, campaigns, contract: contractData };
}
