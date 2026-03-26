"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getHourlyData, getAuctionInsights } from "@/lib/queries/insights";
import { TableSkeleton, ChartSkeleton } from "@/components/shared/loading-skeleton";
import { useAccount } from "@/contexts/account-context";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`,
);

function getHeatmapColor(value: number, max: number): string {
  if (max === 0) return "#f5f6f8";
  const intensity = value / max;
  const blue = Math.round(66 + (255 - 66) * (1 - intensity));
  const green = Math.round(133 + (255 - 133) * (1 - intensity));
  const alpha = 0.1 + 0.9 * intensity;
  return `rgba(66, ${green}, 244, ${alpha})`;
}

export default function InsightsPage() {
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [auctionData, setAuctionData] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    Promise.all([
      getHourlyData(supabase, accountId),
      getAuctionInsights(supabase, accountId),
    ])
      .then(([hourly, auction]) => {
        setHourlyData(hourly);
        setAuctionData(auction);
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  // Build heatmap matrix [day][hour]
  const heatmap: Record<string, Record<number, number>> = {};
  let maxClicks = 0;
  hourlyData.forEach((row) => {
    const day = DAYS[row.day_of_week] ?? `D${row.day_of_week}`;
    if (!heatmap[day]) heatmap[day] = {};
    const clicks = Number(row.clicks);
    heatmap[day][row.hour_of_day] = (heatmap[day][row.hour_of_day] ?? 0) + clicks;
    if (heatmap[day][row.hour_of_day] > maxClicks) maxClicks = heatmap[day][row.hour_of_day];
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[#111827]">Insights</h2>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">Hourly & competitive performance</p>
      </div>

      {/* Heatmap */}
      {loading ? (
        <ChartSkeleton height={220} />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e4ea] p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Click Heatmap — Hour × Day of Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr>
                  <th className="w-10 text-[11px] text-[#9ca3af]" />
                  {HOURS.filter((_, i) => i % 2 === 0).map((h, i) => (
                    <th key={i} colSpan={2} className="text-[10px] text-[#9ca3af] font-medium pb-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="text-[11px] text-[#9ca3af] font-medium pr-2 text-right">{day}</td>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const val = heatmap[day]?.[hour] ?? 0;
                      return (
                        <td key={hour} title={`${day} ${HOURS[hour]}: ${val} clicks`}>
                          <div
                            className="w-5 h-5 rounded-sm mx-auto"
                            style={{ background: getHeatmapColor(val, maxClicks) }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hourlyData.length === 0 && (
            <p className="text-center text-[12px] text-[#9ca3af] mt-4">No hourly data available</p>
          )}
        </div>
      )}

      {/* Auction Insights */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#eceef2]">
            <h3 className="text-[15px] font-semibold text-[#111827]">Auction Insights</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-[#eceef2]">
                {["Domain", "Impression Share", "Overlap Rate", "Outranking Share"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auctionData.map((row, i) => (
                <tr key={i} className="border-b border-[#eceef2] last:border-0 hover:bg-[#f5f6f8]">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#111827]">{row.domain ?? "—"}</td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">
                    {row.impression_share != null ? `${(row.impression_share * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">
                    {row.overlap_rate != null ? `${(row.overlap_rate * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[#374151] tabular-nums">
                    {row.outranking_share != null ? `${(row.outranking_share * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
              {auctionData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#9ca3af]">No auction data available</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
