"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOverviewData, getCampaignBreakdown } from "@/lib/queries/overview";
import { usePeriod } from "@/hooks/use-period";
import { useAccount } from "@/contexts/account-context";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { ConversionSplit } from "@/components/dashboard/conversion-split";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { OptimizationList } from "@/components/dashboard/optimization-list";
import { PeriodSelector } from "@/components/shared/period-selector";
import {
  KpiCardsSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@/components/shared/loading-skeleton";

export default function OverviewPage() {
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    Promise.all([
      getOverviewData(supabase, accountId, dateRange.start, dateRange.end),
      getCampaignBreakdown(supabase, accountId, dateRange.start),
    ])
      .then(([overview, camps]) => {
        setDaily(overview.daily);
        setOptimizations(overview.optimizations);
        setCampaigns(camps);
      })
      .finally(() => setLoading(false));
  }, [dateRange.start, dateRange.end, accountId]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">Performance Overview</h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">{label}</p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {/* KPIs */}
      {loading ? <KpiCardsSkeleton /> : <KpiCards data={daily} />}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div className="md:col-span-2">
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <WeeklyChart data={daily} metric="clicks" />
          )}
        </div>
        <div>
          {loading ? (
            <ChartSkeleton height={200} />
          ) : (
            <ConversionSplit campaigns={campaigns} />
          )}
        </div>
      </div>

      {/* Optimizations + Campaign table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <div className="md:col-span-2">
          {loading ? (
            <TableSkeleton rows={6} cols={1} />
          ) : (
            <OptimizationList optimizations={optimizations} />
          )}
        </div>
        <div>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <CampaignTable campaigns={campaigns} compact />
          )}
        </div>
      </div>
    </div>
  );
}
