"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { microsToNzd } from "@/lib/utils";
import { format } from "date-fns";

interface DailyRow {
  date: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
}

interface WeeklyChartProps {
  data: DailyRow[];
  metric?: "clicks" | "spend" | "impressions" | "conversions";
}

export function WeeklyChart({ data, metric = "clicks" }: WeeklyChartProps) {
  const chartData = data.map((row) => ({
    date: row.date,
    label: format(new Date(row.date), "MMM d"),
    value:
      metric === "spend"
        ? microsToNzd(Number(row.cost_micros))
        : Number(row[metric]),
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value));

  const metricLabels = {
    clicks: "Clicks",
    spend: "Spend (NZD)",
    impressions: "Impressions",
    conversions: "Conversions",
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e4ea] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-[15px] font-semibold text-[#111827] mb-4">
        {metricLabels[metric]} Over Time
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barSize={20} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eceef2" strokeDasharray="0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #e2e4ea",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ color: "#111827", fontWeight: 600 }}
            cursor={{ fill: "#f5f6f8" }}
          />
          <Bar dataKey="value" name={metricLabels[metric]} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value === maxValue ? "#4285F4" : "#c7d9fd"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
