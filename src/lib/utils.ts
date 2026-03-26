import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with NZ locale, no decimals */
export function fmt(n: number): string {
  return n.toLocaleString("en-NZ", { maximumFractionDigits: 0 });
}

/** Format number with NZ locale, 2 decimals */
export function fmtDec(n: number): string {
  return n.toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format currency (NZD) */
export function fmtCurrency(n: number): string {
  return `$${fmtDec(n)}`;
}

/** Convert cost_micros to NZD */
export function microsToNzd(micros: number): number {
  return micros / 1_000_000;
}

/** Calculate CPA safely */
export function calcCpa(costMicros: number, conversions: number): number | null {
  return conversions > 0 ? microsToNzd(costMicros) / conversions : null;
}

/** Calculate CTR */
export function calcCtr(clicks: number, impressions: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

/** CPA color coding */
export function cpaColor(cpa: number | null): string {
  if (cpa === null) return "#9ca3af";
  if (cpa < 15) return "#34A853"; // green
  if (cpa < 30) return "#F9AB00"; // yellow
  return "#EA4335"; // red
}

/** Date range helper */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}
