"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPortfolioData, PortfolioClinic } from "@/lib/queries/portfolio";
import { usePeriod } from "@/hooks/use-period";
import { useAccount } from "@/contexts/account-context";
import { PeriodSelector } from "@/components/shared/period-selector";
import { fmtCurrency, fmt, cpaColor } from "@/lib/utils";

// ── Chevron icon ─────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M5 3L9 7L5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── KPI Cards ────────────────────────────────────────────────────────────────

function PortfolioKpiCards({ clinics }: { clinics: PortfolioClinic[] }) {
  const totals = clinics.reduce(
    (acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      cost: acc.cost + c.cost,
      conversions: acc.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : null;

  const kpis = [
    {
      label: "IMPRESSIONS",
      value: fmt(totals.impressions),
      sub: undefined as string | undefined,
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
      value: fmtCurrency(totals.cost),
      sub: undefined as string | undefined,
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
      value: fmt(Math.round(totals.conversions)),
      sub: cpa !== null ? `${fmtCurrency(cpa)} CPA` : "No conv.",
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

// ── Desktop table ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const isEnabled = status?.toUpperCase() === "ENABLED";
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: isEnabled ? "#34A853" : "#9ca3af" }}
    />
  );
}

function DesktopTable({
  clinics,
  onSelectClinic,
}: {
  clinics: PortfolioClinic[];
  onSelectClinic: (clientId: string) => void;
}) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalSpend = clinics.reduce((s, c) => s + c.cost, 0);

  return (
    <div className="bg-white border border-[#e2e4ea] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_120px_80px_80px_90px_90px_80px] gap-2 px-5 py-3 border-b border-[#e2e4ea] bg-[#f9fafb]">
        {["Account", "Spend", "Impr.", "Clicks", "CTR", "Conv.", "CPA"].map((h) => (
          <span key={h} className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
            {h}
          </span>
        ))}
      </div>

      {clinics.map((clinic) => {
        const isOpen = openIds.has(clinic.external_customer_id);
        const spendShare = totalSpend > 0 ? (clinic.cost / totalSpend) * 100 : 0;
        const ctr = clinic.impressions > 0 ? (clinic.clicks / clinic.impressions) * 100 : null;
        const cpaVal = clinic.cpa;

        return (
          <div key={clinic.external_customer_id}>
            {/* Clinic row */}
            <div
              className="grid grid-cols-[1fr_120px_80px_80px_90px_90px_80px] gap-2 px-5 py-3.5 border-b border-[#e2e4ea] items-center hover:bg-[#f9fafb] transition-colors"
            >
              {/* Account name + expand */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => toggle(clinic.external_customer_id)}
                  className="text-[#9ca3af] hover:text-[#4285F4] transition-colors shrink-0"
                >
                  <ChevronIcon open={isOpen} />
                </button>
                <button
                  onClick={() => onSelectClinic(clinic.client_id)}
                  className="text-[13px] font-semibold text-[#4285F4] hover:underline truncate text-left"
                >
                  {clinic.account_name}
                </button>
              </div>

              {/* Spend + share bar */}
              <div className="space-y-1">
                <span className="text-[13px] font-semibold text-[#111827]">
                  {fmtCurrency(clinic.cost)}
                </span>
                <div className="h-1 bg-[#e2e4ea] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4285F4] rounded-full"
                    style={{ width: `${spendShare}%` }}
                  />
                </div>
              </div>

              <span className="text-[13px] text-[#374151]">{fmt(clinic.impressions)}</span>
              <span className="text-[13px] text-[#374151]">{fmt(clinic.clicks)}</span>
              <span className="text-[13px] text-[#374151]">{ctr != null ? `${ctr.toFixed(2)}%` : "—"}</span>
              <span className="text-[13px] text-[#374151]">{Math.round(clinic.conversions)}</span>
              <span className="text-[13px] font-medium" style={{ color: cpaColor(cpaVal) }}>
                {cpaVal != null ? fmtCurrency(cpaVal) : "—"}
              </span>
            </div>

            {/* Expanded campaigns */}
            {isOpen && (
              <div className="bg-[#f9fafb] border-b border-[#e2e4ea]">
                {clinic.campaigns.map((camp) => {
                  const campCtr =
                    camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : null;
                  return (
                    <div
                      key={camp.campaign_id}
                      className="grid grid-cols-[1fr_120px_80px_80px_90px_90px_80px] gap-2 px-5 py-2.5 border-b border-[#eceef2] last:border-b-0 items-center"
                    >
                      <div className="flex items-center gap-2 pl-6 min-w-0">
                        <StatusDot status={camp.status} />
                        <span className="text-[12px] text-[#374151] truncate">{camp.campaign_name}</span>
                      </div>
                      <span className="text-[12px] text-[#374151]">{fmtCurrency(camp.cost)}</span>
                      <span className="text-[12px] text-[#374151]">{fmt(camp.impressions)}</span>
                      <span className="text-[12px] text-[#374151]">{fmt(camp.clicks)}</span>
                      <span className="text-[12px] text-[#374151]">
                        {campCtr != null ? `${campCtr.toFixed(2)}%` : "—"}
                      </span>
                      <span className="text-[12px] text-[#374151]">{Math.round(camp.conversions)}</span>
                      <span
                        className="text-[12px] font-medium"
                        style={{ color: cpaColor(camp.cpa) }}
                      >
                        {camp.cpa != null ? fmtCurrency(camp.cpa) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Total row */}
      {clinics.length > 0 && (() => {
        const totals = clinics.reduce(
          (acc, c) => ({
            impressions: acc.impressions + c.impressions,
            clicks: acc.clicks + c.clicks,
            cost: acc.cost + c.cost,
            conversions: acc.conversions + c.conversions,
          }),
          { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
        );
        const totalCtr =
          totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null;
        const totalCpa = totals.conversions > 0 ? totals.cost / totals.conversions : null;

        return (
          <div className="grid grid-cols-[1fr_120px_80px_80px_90px_90px_80px] gap-2 px-5 py-3.5 bg-[#f9fafb] border-t border-[#e2e4ea] items-center">
            <span className="text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide pl-6">
              Total
            </span>
            <span className="text-[13px] font-semibold text-[#111827]">{fmtCurrency(totals.cost)}</span>
            <span className="text-[13px] font-semibold text-[#111827]">{fmt(totals.impressions)}</span>
            <span className="text-[13px] font-semibold text-[#111827]">{fmt(totals.clicks)}</span>
            <span className="text-[13px] font-semibold text-[#111827]">
              {totalCtr != null ? `${totalCtr.toFixed(2)}%` : "—"}
            </span>
            <span className="text-[13px] font-semibold text-[#111827]">{Math.round(totals.conversions)}</span>
            <span
              className="text-[13px] font-semibold"
              style={{ color: cpaColor(totalCpa) }}
            >
              {totalCpa != null ? fmtCurrency(totalCpa) : "—"}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ── Mobile cards ─────────────────────────────────────────────────────────────

function MobileClinicCard({
  clinic,
  onSelectClinic,
}: {
  clinic: PortfolioClinic;
  onSelectClinic: (clientId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ctr = clinic.impressions > 0 ? (clinic.clicks / clinic.impressions) * 100 : null;

  return (
    <div className="bg-white border border-[#e2e4ea] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <button
            onClick={() => onSelectClinic(clinic.client_id)}
            className="text-[14px] font-semibold text-[#4285F4] hover:underline text-left"
          >
            {clinic.account_name}
          </button>
          <span
            className="text-[13px] font-semibold shrink-0"
            style={{ color: cpaColor(clinic.cpa) }}
          >
            {clinic.cpa != null ? `${fmtCurrency(clinic.cpa)} CPA` : "No conv."}
          </span>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[17px] font-bold text-[#111827]">{fmtCurrency(clinic.cost)}</p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Spend</p>
          </div>
          <div>
            <p className="text-[17px] font-bold text-[#111827]">{Math.round(clinic.conversions)}</p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Conv.</p>
          </div>
          <div>
            <p className="text-[17px] font-bold text-[#111827]">{fmt(clinic.clicks)}</p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">Clicks</p>
          </div>
        </div>

        {/* Secondary */}
        <p className="text-[11px] text-[#9ca3af] mt-2 text-center">
          {fmt(clinic.impressions)} impr.
          {ctr != null ? ` · ${ctr.toFixed(2)}% CTR` : ""}
        </p>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[#e2e4ea] text-[12px] font-medium text-[#6b7280] hover:bg-[#f5f6f8] transition-colors"
      >
        <span>{open ? "Hide campaigns" : `View ${clinic.campaigns.length} campaign${clinic.campaigns.length !== 1 ? "s" : ""}`}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Campaigns */}
      {open && (
        <div className="border-t border-[#e2e4ea]">
          {clinic.campaigns.map((camp) => (
            <div
              key={camp.campaign_id}
              className="px-4 py-3 border-b border-[#eceef2] last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <StatusDot status={camp.status} />
                  <span className="text-[12px] font-medium text-[#374151] truncate">
                    {camp.campaign_name}
                  </span>
                </div>
                <span
                  className="text-[11px] font-medium shrink-0"
                  style={{ color: cpaColor(camp.cpa) }}
                >
                  {camp.cpa != null ? fmtCurrency(camp.cpa) : "—"}
                </span>
              </div>
              <div className="flex gap-4 text-[11px] text-[#9ca3af]">
                <span>{fmtCurrency(camp.cost)} spend</span>
                <span>{Math.round(camp.conversions)} conv.</span>
                <span>{fmt(camp.clicks)} clicks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PortfolioOverview() {
  const { allAccountIds, clients, setSelectedClientId } = useAccount();
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState<PortfolioClinic[]>([]);

  useEffect(() => {
    if (!allAccountIds.length) return;
    const supabase = createClient();
    setLoading(true);
    getPortfolioData(supabase, allAccountIds, dateRange.start, dateRange.end)
      .then(setClinics)
      .finally(() => setLoading(false));
  }, [allAccountIds, dateRange.start, dateRange.end]);

  // Map external_customer_id → client_id for navigation
  const handleSelectClinic = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">
            Portfolio Overview
            <span className="ml-2 text-[12px] font-normal text-[#9ca3af]">
              {clients.length} accounts
            </span>
          </h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">{label}</p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e4ea] rounded-xl p-4 md:p-5 animate-pulse">
              <div className="h-3 w-20 bg-[#f3f4f6] rounded mb-3" />
              <div className="h-7 w-24 bg-[#f3f4f6] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <PortfolioKpiCards clinics={clinics} />
      )}

      {/* Table — desktop */}
      {loading ? (
        <div className="bg-white border border-[#e2e4ea] rounded-xl overflow-hidden animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-[#e2e4ea] flex gap-4">
              <div className="h-4 flex-1 bg-[#f3f4f6] rounded" />
              <div className="h-4 w-20 bg-[#f3f4f6] rounded" />
              <div className="h-4 w-16 bg-[#f3f4f6] rounded" />
            </div>
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <div className="bg-white border border-[#e2e4ea] rounded-xl px-5 py-10 text-center">
          <p className="text-[13px] text-[#9ca3af]">No data found for the selected period.</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <DesktopTable clinics={clinics} onSelectClinic={handleSelectClinic} />
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {clinics.map((clinic) => (
              <MobileClinicCard
                key={clinic.external_customer_id}
                clinic={clinic}
                onSelectClinic={handleSelectClinic}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
