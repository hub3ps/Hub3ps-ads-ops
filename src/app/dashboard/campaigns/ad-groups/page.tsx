"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAllAdGroups } from "@/lib/queries/campaigns";
import { fmtCurrency, cpaColor } from "@/lib/utils";
import { usePeriod } from "@/hooks/use-period";
import { useAccount } from "@/contexts/account-context";
import { useSort, sortRows, type SortState } from "@/hooks/use-sort";
import { PeriodSelector } from "@/components/shared/period-selector";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils";

function SortTh({
  label, col, sort, onSort,
}: { label: string; col: string; sort: SortState; onSort: (col: string) => void }) {
  const active = sort.column === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:bg-[#f0f1f4] whitespace-nowrap"
      style={{ color: active ? "#374151" : "#9ca3af" }}
    >
      <span className="flex items-center gap-1">
        {label}
        {active && <span className="text-[10px]">{sort.dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}

export default function AdGroupsPage() {
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(true);
  const [adGroups, setAdGroups] = useState<any[]>([]);
  const { sort, toggle } = useSort("spend");

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getAllAdGroups(supabase, accountId, dateRange.start, dateRange.end)
      .then(setAdGroups)
      .finally(() => setLoading(false));
  }, [dateRange.start, dateRange.end, accountId]);

  const sorted = sortRows(adGroups, sort.column, sort.dir);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">Ad Groups</h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">
            {label}{!loading && adGroups.length > 0 && ` · ${adGroups.length} ad groups`}
          </p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b border-[#eceef2]">
                <SortTh label="Ad Group"    col="ad_group_name"  sort={sort} onSort={toggle} />
                <SortTh label="Campaign"    col="campaign_name"  sort={sort} onSort={toggle} />
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Status</th>
                <SortTh label="Impressions" col="impressions"    sort={sort} onSort={toggle} />
                <SortTh label="Clicks"      col="clicks"         sort={sort} onSort={toggle} />
                <SortTh label="CTR"         col="ctr"            sort={sort} onSort={toggle} />
                <SortTh label="Spend"       col="spend"          sort={sort} onSort={toggle} />
                <SortTh label="Conv."       col="conversions"    sort={sort} onSort={toggle} />
                <SortTh label="CPA"         col="cpa"            sort={sort} onSort={toggle} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((ag, i) => (
                <tr key={ag.ad_group_id ?? i} className="border-b border-[#eceef2] last:border-0 hover:bg-[#f5f6f8] transition-colors">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#111827] max-w-[160px]">
                    <span className="block truncate">{ag.ad_group_name ?? "Unknown"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-[#6b7280] max-w-[160px]">
                    <span className="block truncate">{ag.campaign_name ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      ag.status === "ENABLED" ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f3f4f6] text-[#6b7280]",
                    )}>
                      {ag.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(ag.impressions).toLocaleString("en-NZ")}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(ag.clicks).toLocaleString("en-NZ")}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{ag.ctr.toFixed(2)}%</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{fmtCurrency(ag.spend)}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">{Number(ag.conversions).toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold tabular-nums" style={{ color: cpaColor(ag.cpa) }}>
                    {ag.cpa !== null ? fmtCurrency(ag.cpa) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {adGroups.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-[#9ca3af]">No ad group data for this period</p>
          )}
        </div>
      )}
    </div>
  );
}
