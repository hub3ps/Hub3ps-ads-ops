"use client";

import { fmt, fmtCurrency, microsToNzd, calcCtr } from "@/lib/utils";

interface DailyRow {
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
}

interface KpiCardsProps {
  data: DailyRow[];
}

export function KpiCards({ data }: KpiCardsProps) {
  const totals = data.reduce(
    (acc, row) => ({
      impressions: acc.impressions + Number(row.impressions),
      clicks: acc.clicks + Number(row.clicks),
      cost_micros: acc.cost_micros + Number(row.cost_micros),
      conversions: acc.conversions + Number(row.conversions),
    }),
    { impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 },
  );

  const spend = microsToNzd(totals.cost_micros);
  const ctr = calcCtr(totals.clicks, totals.impressions);
  const cpa =
    totals.conversions > 0 ? spend / totals.conversions : null;

  const kpis = [
    {
      label: "IMPRESSIONS",
      value: fmt(totals.impressions),
      color: "#4285F4",
      bg: "#eff6ff",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="3" stroke="#4285F4" strokeWidth="1.5" />
          <path d="M1 9C3 4 6 2 9 2s6 2 8 7c-2 5-5 7-8 7S3 14 1 9z" stroke="#4285F4" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      label: "CLICKS",
      value: fmt(totals.clicks),
      sub: `${ctr.toFixed(2)}% CTR`,
      color: "#34A853",
      bg: "#ecfdf5",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9L8 13L14 5" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "SPEND",
      value: fmtCurrency(spend),
      color: "#F9AB00",
      bg: "#fffbeb",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#F9AB00" strokeWidth="1.5" />
          <path d="M9 5.5V7M9 11V12.5M6.5 9h5M6.5 9a2.5 2.5 0 015 0" stroke="#F9AB00" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "CONVERSIONS",
      value: fmt(totals.conversions),
      sub: cpa !== null ? `$${cpa.toFixed(2)} CPA` : "No conv.",
      color: "#EA4335",
      bg: "#fef2f2",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L11 7H16L12 10.5L13.5 16L9 12.5L4.5 16L6 10.5L2 7H7L9 2Z" stroke="#EA4335" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-xl border border-[#e2e4ea] p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative"
        >
          <div
            className="absolute top-3 right-3 md:top-4 md:right-4 w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center"
            style={{ background: kpi.bg }}
          >
            {kpi.icon}
          </div>
          <p className="text-[10px] md:text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase mb-2">
            {kpi.label}
          </p>
          <p
            className="text-[22px] md:text-[28px] font-bold text-[#111827] tracking-tight tabular-nums"
            style={{ letterSpacing: "-0.03em" }}
          >
            {kpi.value}
          </p>
          {kpi.sub && (
            <p className="text-[12px] text-[#6b7280] mt-1">{kpi.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
