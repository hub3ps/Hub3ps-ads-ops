"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Period, PeriodState } from "@/hooks/use-period";

const PRESETS: { value: Period; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
];

interface PeriodSelectorProps {
  state: PeriodState;
  onPreset: (days: Period) => void;
  onCustom: (start: string, end: string) => void;
  className?: string;
}

export function PeriodSelector({ state, onPreset, onCustom, className }: PeriodSelectorProps) {
  const isCustom = state.mode === "custom";

  const [customStart, setCustomStart] = useState(
    isCustom ? state.start : "",
  );
  const [customEnd, setCustomEnd] = useState(
    isCustom ? state.end : "",
  );
  const [showCustom, setShowCustom] = useState(isCustom);

  function handleApplyCustom() {
    if (customStart && customEnd && customStart <= customEnd) {
      onCustom(customStart, customEnd);
    }
  }

  function handlePreset(days: Period) {
    setShowCustom(false);
    onPreset(days);
  }

  function handleCustomToggle() {
    setShowCustom((v) => !v);
  }

  return (
    <div className={cn("flex flex-col items-stretch sm:items-end gap-2", className)}>
      <div className="flex items-center gap-1 bg-[#f5f6f8] rounded-lg p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={cn(
              "px-2.5 sm:px-3 py-1.5 rounded-md text-[12px] font-medium transition-all",
              !isCustom && state.mode === "preset" && state.days === p.value
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#374151]",
            )}
          >
            {p.label}
          </button>
        ))}

        <div className="w-px h-4 bg-[#e2e4ea] mx-0.5" />

        <button
          onClick={handleCustomToggle}
          className={cn(
            "px-2.5 sm:px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5",
            isCustom || showCustom
              ? "bg-white text-[#4285F4] shadow-sm"
              : "text-[#6b7280] hover:text-[#374151]",
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {isCustom
            ? <span className="max-w-[140px] sm:max-w-none truncate">{`${state.start} → ${state.end}`}</span>
            : "Custom"}
        </button>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 bg-white border border-[#e2e4ea] rounded-lg px-3 py-2.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || undefined}
              className="text-[12px] text-[#111827] border border-[#e2e4ea] rounded-md px-2 py-1 focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]/20"
            />
          </div>
          <span className="text-[#d1d5db]">→</span>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart || undefined}
              max={new Date().toISOString().split("T")[0]}
              className="text-[12px] text-[#111827] border border-[#e2e4ea] rounded-md px-2 py-1 focus:outline-none focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4]/20"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd || customStart > customEnd}
            className="px-3 py-1 rounded-md text-[12px] font-semibold bg-[#4285F4] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3574e2] transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
