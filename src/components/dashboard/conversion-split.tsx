"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { microsToNzd } from "@/lib/utils";

interface CampaignRow {
  campaign_name?: string;
  conversions: number;
  cost_micros: number;
  clicks: number;
}

interface ConversionSplitProps {
  campaigns: CampaignRow[];
}

const CHART_COLORS = ["#4285F4", "#34A853", "#F9AB00", "#EA4335", "#1877F2", "#7c3aed"];

export function ConversionSplit({ campaigns }: ConversionSplitProps) {
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions), 0);
  const totalSpend = campaigns.reduce((s, c) => s + microsToNzd(Number(c.cost_micros)), 0);

  const pieData = campaigns
    .filter((c) => Number(c.conversions) > 0)
    .slice(0, 6)
    .map((c, i) => ({
      name: c.campaign_name ?? `Campaign ${i + 1}`,
      value: Number(c.conversions),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div className="bg-white rounded-xl border border-[#e2e4ea] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Conversion Split</h3>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData.length > 0 ? pieData : [{ name: "No data", value: 1, color: "#eceef2" }]}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.length > 0
                  ? pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))
                  : <Cell fill="#eceef2" />}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e4ea" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[18px] font-bold text-[#111827] tabular-nums">{totalConversions}</p>
            <p className="text-[10px] text-[#9ca3af]">conv.</p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex-1 flex flex-col gap-2.5">
          {pieData.map((entry) => {
            const pct = totalConversions > 0 ? (entry.value / totalConversions) * 100 : 0;
            return (
              <div key={entry.name}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] text-[#374151] truncate max-w-[120px]">{entry.name}</p>
                  <p className="text-[12px] font-semibold text-[#111827]">{entry.value}</p>
                </div>
                <div className="h-1.5 rounded-full bg-[#eceef2] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: entry.color }}
                  />
                </div>
              </div>
            );
          })}
          {pieData.length === 0 && (
            <p className="text-[12px] text-[#9ca3af]">No conversion data</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#eceef2] grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-wider font-semibold">Total Spend</p>
          <p className="text-[14px] font-semibold text-[#111827] tabular-nums mt-0.5">
            ${totalSpend.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#9ca3af] uppercase tracking-wider font-semibold">Avg CPA</p>
          <p className="text-[14px] font-semibold text-[#111827] tabular-nums mt-0.5">
            {totalConversions > 0 ? `$${(totalSpend / totalConversions).toFixed(2)}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
