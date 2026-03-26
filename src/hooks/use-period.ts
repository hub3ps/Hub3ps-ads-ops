"use client";

import { useState } from "react";
import { getDateRange } from "@/lib/utils";

export type Period = 7 | 14 | 30;

export type DateRange = {
  start: string;
  end: string;
};

export type PeriodState =
  | { mode: "preset"; days: Period }
  | { mode: "custom"; start: string; end: string };

export function usePeriod(defaultDays: Period = 30) {
  const [state, setState] = useState<PeriodState>({ mode: "preset", days: defaultDays });

  const dateRange: DateRange =
    state.mode === "preset"
      ? getDateRange(state.days)
      : { start: state.start, end: state.end };

  function setPreset(days: Period) {
    setState({ mode: "preset", days });
  }

  function setCustomRange(start: string, end: string) {
    setState({ mode: "custom", start, end });
  }

  const label =
    state.mode === "preset"
      ? `Last ${state.days} days`
      : `${state.start} → ${state.end}`;

  return { state, dateRange, setPreset, setCustomRange, label };
}
