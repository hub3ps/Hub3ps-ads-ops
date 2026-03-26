"use client";

import { fmtCurrency, cpaColor } from "@/lib/utils";

interface CampaignRow {
  campaign_id?: number;
  campaign_name?: string;
  status?: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  spend: number;
  cpa: number | null;
  ctr: number;
}

interface CampaignTableProps {
  campaigns: CampaignRow[];
  compact?: boolean;
}

export function CampaignTable({ campaigns, compact = false }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e4ea] p-8 text-center">
        <p className="text-[13px] text-[#9ca3af]">No campaign data for this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#eceef2]">
        <h3 className="text-[15px] font-semibold text-[#111827]">Campaigns</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#eceef2]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Campaign
              </th>
              {!compact && (
                <>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Conv.
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                Spend
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                CPA
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const color = cpaColor(c.cpa);
              return (
                <tr
                  key={i}
                  className="border-b border-[#eceef2] last:border-0 hover:bg-[#f5f6f8] transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <p className={`text-[13px] font-medium text-[#111827] truncate ${compact ? "max-w-[130px]" : "max-w-[200px]"}`}>
                      {c.campaign_name ?? "Unknown"}
                    </p>
                  </td>
                  {!compact && (
                    <>
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] tabular-nums">
                        {Number(c.clicks).toLocaleString("en-NZ")}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#374151] tabular-nums">
                        {Math.round(Number(c.conversions))}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3.5 text-[13px] text-[#374151] tabular-nums">
                    {fmtCurrency(c.spend)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color }}>
                      {c.cpa !== null ? fmtCurrency(c.cpa) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
