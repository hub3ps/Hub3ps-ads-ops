"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getKeywords, type CampaignKeywords, type KeywordRow } from "@/lib/queries/keywords";
import { fmtCurrency, cpaColor } from "@/lib/utils";
import { usePeriod } from "@/hooks/use-period";
import { useAccount } from "@/contexts/account-context";
import { PeriodSelector } from "@/components/shared/period-selector";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useSort, sortRows, type SortState } from "@/hooks/use-sort";
import { cn } from "@/lib/utils";

const MATCH_COLORS: Record<string, { bg: string; color: string }> = {
  BROAD:  { bg: "#fff7ed", color: "#c2410c" },
  PHRASE: { bg: "#eff6ff", color: "#4285F4" },
  EXACT:  { bg: "#ecfdf5", color: "#059669" },
};

function qsColor(qs: number | null): string {
  if (qs === null) return "#9ca3af";
  if (qs >= 8) return "#34A853";
  if (qs >= 5) return "#F9AB00";
  return "#EA4335";
}

function SortTh({
  label, col, sort, onSort,
}: { label: string; col: string; sort: SortState; onSort: (col: string) => void }) {
  const active = sort.column === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-[#eef0f5] whitespace-nowrap"
      style={{ color: active ? "#374151" : "#9ca3af" }}
    >
      <span className="flex items-center gap-1">
        {label}
        {active && <span className="text-[9px]">{sort.dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

function KeywordTableRow({ kw }: { kw: KeywordRow }) {
  const matchStyle = MATCH_COLORS[kw.match_type] ?? { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <tr className="border-b border-[#eceef2] last:border-0 hover:bg-[#f5f6f8] transition-colors">
      <td className="px-4 py-3 text-[12px] font-medium text-[#111827] max-w-[200px]">
        <span className="block truncate">{kw.keyword_text}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={matchStyle}>
          {kw.match_type}
        </span>
      </td>
      <td className="px-4 py-3 text-[12px] font-semibold tabular-nums" style={{ color: qsColor(kw.quality_score) }}>
        {kw.quality_score !== null ? `${kw.quality_score}/10` : "—"}
      </td>
      <td className="px-4 py-3 text-[12px] text-[#374151] tabular-nums">
        {kw.impressions.toLocaleString("en-NZ")}
      </td>
      <td className="px-4 py-3 text-[12px] text-[#374151] tabular-nums">
        {kw.clicks.toLocaleString("en-NZ")}
      </td>
      <td className="px-4 py-3 text-[12px] text-[#374151] tabular-nums">
        {kw.ctr.toFixed(2)}%
      </td>
      <td className="px-4 py-3 text-[12px] text-[#374151] tabular-nums">
        {fmtCurrency(kw.spend)}
      </td>
      <td className="px-4 py-3 text-[12px] font-semibold tabular-nums" style={{ color: cpaColor(kw.cpa) }}>
        {kw.cpa !== null ? fmtCurrency(kw.cpa) : "—"}
      </td>
    </tr>
  );
}

function AdGroupAccordion({
  name, keywords, totalSpend, totalClicks, totalConversions, defaultOpen,
}: {
  name: string;
  keywords: KeywordRow[];
  totalSpend: number;
  totalClicks: number;
  totalConversions: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { sort, toggle } = useSort("clicks");

  return (
    <div className="border border-[#e2e4ea] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f5f6f8] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded bg-[#eff6ff] flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="0.75" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="6.25" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="0.75" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="6.25" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" opacity="0.4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#374151] truncate">{name}</span>
          <span className="text-[11px] text-[#9ca3af] bg-[#f5f6f8] px-2 py-0.5 rounded-full shrink-0">
            {keywords.length} kw
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-[#6b7280] tabular-nums">
            <span>{totalClicks.toLocaleString("en-NZ")} clicks</span>
            <span>{fmtCurrency(totalSpend)}</span>
            <span>{totalConversions.toFixed(1)} conv.</span>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            className={cn("text-[#9ca3af] transition-transform duration-200", open && "rotate-180")}
          >
            <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#eceef2] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8faff]">
                <SortTh label="Keyword"     col="keyword_text"  sort={sort} onSort={toggle} />
                <SortTh label="Match Type"  col="match_type"    sort={sort} onSort={toggle} />
                <SortTh label="QS"          col="quality_score" sort={sort} onSort={toggle} />
                <SortTh label="Impressions" col="impressions"   sort={sort} onSort={toggle} />
                <SortTh label="Clicks"      col="clicks"        sort={sort} onSort={toggle} />
                <SortTh label="CTR"         col="ctr"           sort={sort} onSort={toggle} />
                <SortTh label="Spend"       col="spend"         sort={sort} onSort={toggle} />
                <SortTh label="CPA"         col="cpa"           sort={sort} onSort={toggle} />
              </tr>
            </thead>
            <tbody>
              {sortRows(keywords, sort.column, sort.dir).map((kw, i) => (
                <KeywordTableRow key={`${kw.keyword_id}_${i}`} kw={kw} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CampaignAccordion({ campaign }: { campaign: CampaignKeywords }) {
  const [open, setOpen] = useState(false);

  const totalKw = campaign.adGroups.reduce((s, ag) => s + ag.keywords.length, 0);
  const totalSpend = campaign.adGroups.reduce((s, ag) => s + ag.total_spend, 0);
  const totalClicks = campaign.adGroups.reduce((s, ag) => s + ag.total_clicks, 0);

  return (
    <div className="border border-[#e2e4ea] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 transition-colors",
          open ? "bg-[#f8faff]" : "hover:bg-[#f5f6f8]",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L4.5 7L7 9L9.5 5.5L12 3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-left min-w-0">
            <p className="text-[14px] font-semibold text-[#111827] truncate">{campaign.campaign_name}</p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">
              {campaign.adGroups.length} ad {campaign.adGroups.length === 1 ? "group" : "groups"} · {totalKw} keywords
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-4 text-[12px] text-[#6b7280] tabular-nums">
            <span>{totalClicks.toLocaleString("en-NZ")} clicks</span>
            <span className="font-medium text-[#374151]">{fmtCurrency(totalSpend)}</span>
          </div>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className={cn("text-[#9ca3af] transition-transform duration-200 shrink-0", open && "rotate-180")}
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-[#f8faff] border-t border-[#eceef2] space-y-3">
          {campaign.adGroups.map((ag) => (
            <AdGroupAccordion
              key={ag.ad_group_id}
              name={ag.ad_group_name}
              keywords={ag.keywords}
              totalSpend={ag.total_spend}
              totalClicks={ag.total_clicks}
              totalConversions={ag.total_conversions}
              defaultOpen={campaign.adGroups.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignKeywordsPage() {
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CampaignKeywords[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getKeywords(supabase, accountId, dateRange.start, dateRange.end)
      .then(setData)
      .finally(() => setLoading(false));
  }, [dateRange.start, dateRange.end, accountId]);

  const totalCampaigns = data.length;
  const totalKw = data.reduce((s, c) => s + c.adGroups.reduce((a, ag) => a + ag.keywords.length, 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">Keywords</h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">
            {label}
            {!loading && totalKw > 0 && ` · ${totalCampaigns} campaigns · ${totalKw} keywords`}
          </p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e4ea] p-10 text-center">
          <p className="text-[13px] text-[#9ca3af]">No keyword data for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((campaign) => (
            <CampaignAccordion key={campaign.campaign_id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
