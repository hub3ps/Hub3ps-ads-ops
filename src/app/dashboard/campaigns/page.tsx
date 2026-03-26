"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCampaigns, getAdGroups } from "@/lib/queries/campaigns";
import { fmtCurrency, cpaColor } from "@/lib/utils";
import { usePeriod } from "@/hooks/use-period";
import { useAccount } from "@/contexts/account-context";
import { useSort, sortRows, type SortState } from "@/hooks/use-sort";
import { PeriodSelector } from "@/components/shared/period-selector";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils";

// ── Sort header ───────────────────────────────────────────────────────────

function SortTh({
  label,
  col,
  sort,
  onSort,
  className,
}: {
  label: string;
  col: string;
  sort: SortState;
  onSort: (col: string) => void;
  className?: string;
}) {
  const active = sort.column === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={cn(
        "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-[#f0f1f4]",
        className,
      )}
      style={{ color: active ? "#374151" : "#9ca3af" }}
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        {label}
        {active && <span className="text-[10px]">{sort.dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

function SmallSortTh({
  label,
  col,
  sort,
  onSort,
}: {
  label: string;
  col: string;
  sort: SortState;
  onSort: (col: string) => void;
}) {
  const active = sort.column === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="pb-2 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#374151] whitespace-nowrap"
      style={{ color: active ? "#374151" : "#9ca3af" }}
    >
      <span className="flex items-center gap-1">
        {label}
        {active && <span className="text-[10px]">{sort.dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

// ── Ad Groups sub-table ───────────────────────────────────────────────────────

function AdGroupsTable({ rows }: { rows: any[] }) {
  const { sort, toggle } = useSort("spend");
  const sorted = sortRows(rows, sort.column, sort.dir);

  if (rows.length === 0) {
    return <p className="py-3 text-[12px] text-[#9ca3af]">No ad group data</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <SmallSortTh label="Ad Group"    col="ad_group_name" sort={sort} onSort={toggle} />
          <SmallSortTh label="Impressions" col="impressions"   sort={sort} onSort={toggle} />
          <SmallSortTh label="Clicks"      col="clicks"        sort={sort} onSort={toggle} />
          <SmallSortTh label="CTR"         col="ctr"           sort={sort} onSort={toggle} />
          <SmallSortTh label="Spend"       col="spend"         sort={sort} onSort={toggle} />
          <SmallSortTh label="Conv."       col="conversions"   sort={sort} onSort={toggle} />
          <SmallSortTh label="CPA"         col="cpa"           sort={sort} onSort={toggle} />
        </tr>
      </thead>
      <tbody>
        {sorted.map((ag, j) => (
          <tr key={j} className="border-t border-[#eceef2]">
            <td className="py-2.5 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#eff6ff] flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 11 11" fill="none">
                    <rect x="0.75" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
                    <rect x="6.25" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
                    <rect x="0.75" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
                    <rect x="6.25" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" opacity="0.4" />
                  </svg>
                </div>
                <span className="text-[12px] font-medium text-[#374151]">{ag.ad_group_name ?? "Unknown"}</span>
              </div>
            </td>
            <td className="py-2.5 pr-4 text-[12px] text-[#374151] tabular-nums">{Number(ag.impressions).toLocaleString("en-NZ")}</td>
            <td className="py-2.5 pr-4 text-[12px] text-[#374151] tabular-nums">{Number(ag.clicks).toLocaleString("en-NZ")}</td>
            <td className="py-2.5 pr-4 text-[12px] text-[#374151] tabular-nums">{ag.ctr.toFixed(2)}%</td>
            <td className="py-2.5 pr-4 text-[12px] text-[#374151] tabular-nums">{fmtCurrency(ag.spend)}</td>
            <td className="py-2.5 pr-4 text-[12px] text-[#374151] tabular-nums">{Number(ag.conversions).toFixed(1)}</td>
            <td className="py-2.5 text-[12px] font-semibold tabular-nums" style={{ color: cpaColor(ag.cpa) }}>
              {ag.cpa !== null ? fmtCurrency(ag.cpa) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const { accountId } = useAccount();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [adGroups, setAdGroups] = useState<Record<number, any[]>>({});
  const [loadingAdGroups, setLoadingAdGroups] = useState<Set<number>>(new Set());

  const { sort: campSort, toggle: campToggle } = useSort("spend");

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getCampaigns(supabase, accountId, dateRange.start)
      .then(setCampaigns)
      .finally(() => setLoading(false));
    setAdGroups({});
    setExpanded(new Set());
  }, [dateRange.start, dateRange.end, accountId]);

  async function toggleCampaign(campaignId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(campaignId) ? next.delete(campaignId) : next.add(campaignId);
      return next;
    });

    if (adGroups[campaignId]) return;
    const supabase = createClient();
    setLoadingAdGroups((prev) => new Set(prev).add(campaignId));
    const data = await getAdGroups(supabase, accountId, campaignId, dateRange.start);
    setAdGroups((prev) => ({ ...prev, [campaignId]: data }));
    setLoadingAdGroups((prev) => { const next = new Set(prev); next.delete(campaignId); return next; });
  }

  const sortedCampaigns = sortRows(campaigns, campSort.column, campSort.dir);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">Campaigns</h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">{label}</p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eceef2]">
                <SortTh label="Campaign"    col="campaign_name" sort={campSort} onSort={campToggle} />
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Status</th>
                <SortTh label="Impressions" col="impressions"   sort={campSort} onSort={campToggle} />
                <SortTh label="Clicks"      col="clicks"        sort={campSort} onSort={campToggle} />
                <SortTh label="CTR"         col="ctr"           sort={campSort} onSort={campToggle} />
                <SortTh label="Spend"       col="spend"         sort={campSort} onSort={campToggle} />
                <SortTh label="Conv."       col="conversions"   sort={campSort} onSort={campToggle} />
                <SortTh label="CPA"         col="cpa"           sort={campSort} onSort={campToggle} />
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((c, i) => {
                const isOpen = expanded.has(c.campaign_id);
                return (
                  <>
                    <tr
                      key={c.campaign_id ?? i}
                      className="border-b border-[#eceef2] hover:bg-[#f5f6f8] cursor-pointer transition-colors"
                      onClick={() => toggleCampaign(c.campaign_id)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                              <path d="M2 10L4.5 7L7 9L9.5 5.5L12 3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="text-[13px] font-medium text-[#111827] max-w-[180px] truncate">
                            {c.campaign_name ?? "Unknown"}
                          </span>
                          <svg
                            width="12" height="12" viewBox="0 0 12 12" fill="none"
                            className={cn("text-[#9ca3af] transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
                          >
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.status === "ENABLED" ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                          {c.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(c.impressions).toLocaleString("en-NZ")}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(c.clicks).toLocaleString("en-NZ")}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{c.ctr.toFixed(2)}%</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{fmtCurrency(c.spend)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(c.conversions).toFixed(1)}</td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold tabular-nums" style={{ color: cpaColor(c.cpa) }}>
                        {c.cpa !== null ? fmtCurrency(c.cpa) : "—"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${c.campaign_id}-adgroups`}>
                        <td colSpan={8} className="bg-[#f5f6f8] px-8 py-3">
                          {loadingAdGroups.has(c.campaign_id) ? (
                            <p className="text-[12px] text-[#9ca3af]">Loading ad groups…</p>
                          ) : (
                            <AdGroupsTable rows={adGroups[c.campaign_id] ?? []} />
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-[#9ca3af]">No campaign data for this period</p>
          )}
        </div>
      )}
    </div>
  );
}
