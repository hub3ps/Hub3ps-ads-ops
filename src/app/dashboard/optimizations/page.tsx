"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOptimizations } from "@/lib/queries/optimizations";
import { categoryStyles, statusStyles } from "@/lib/constants";
import { useAccount } from "@/contexts/account-context";
import { usePeriod } from "@/hooks/use-period";
import { PeriodSelector } from "@/components/shared/period-selector";
import { OptimizationList } from "@/components/dashboard/optimization-list";
import { TableSkeleton } from "@/components/shared/loading-skeleton";

const ALL_CATEGORIES = Object.keys(categoryStyles);
const ALL_STATUSES = Object.keys(statusStyles);

export default function OptimizationsPage() {
  const { accountId } = useAccount();
  const { state, dateRange, setPreset, setCustomRange, label } = usePeriod(30);
  const [loading, setLoading] = useState(true);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getOptimizations(supabase, accountId, {
      dateStart: dateRange.start,
      dateEnd: dateRange.end,
    })
      .then(setOptimizations)
      .finally(() => setLoading(false));
  }, [accountId, dateRange.start, dateRange.end]);

  const filtered = optimizations.filter((opt) => {
    const statusMatch = filterStatus.length === 0 || filterStatus.includes(opt.status);
    const catMatch = filterCategory.length === 0 || filterCategory.includes(opt.category);
    return statusMatch && catMatch;
  });

  function toggleFilter(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[#111827]">Optimizations</h2>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">
            {label} · {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <PeriodSelector state={state} onPreset={setPreset} onCustom={setCustomRange} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Status</p>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_STATUSES.map((s) => {
              const style = statusStyles[s as keyof typeof statusStyles];
              const active = filterStatus.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleFilter(filterStatus, setFilterStatus, s)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    background: active ? style.bg : "white",
                    color: active ? style.color : "#9ca3af",
                    borderColor: active ? style.color : "#e2e4ea",
                  }}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Category</p>
          <div className="flex gap-1.5 flex-wrap">
            {ALL_CATEGORIES.map((c) => {
              const style = categoryStyles[c as keyof typeof categoryStyles];
              const active = filterCategory.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleFilter(filterCategory, setFilterCategory, c)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    background: active ? style.bg : "white",
                    color: active ? style.color : "#9ca3af",
                    borderColor: active ? style.color : "#e2e4ea",
                  }}
                >
                  {style.icon} {style.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={6} cols={1} />
      ) : (
        <OptimizationList optimizations={filtered} title="All Optimizations" />
      )}
    </div>
  );
}
