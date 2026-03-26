"use client";

import { format } from "date-fns";
import { categoryStyles, statusStyles } from "@/lib/constants";
import { fmtCurrency } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OptimizationRow {
  id: number;
  category: string;
  action_summary: string;
  client_title?: string | null;
  client_impact?: string | null;
  scope_detail?: string | null;
  status: string;
  executed_at: string;
  details?: { economia_projetada_mensal?: number; [key: string]: unknown } | null;
}

interface OptimizationListProps {
  optimizations: OptimizationRow[];
  title?: string;
}

function OptimizationItem({ opt }: { opt: OptimizationRow }) {
  const cat = categoryStyles[opt.category as keyof typeof categoryStyles];
  const st = statusStyles[opt.status as keyof typeof statusStyles];
  const title = opt.client_title ?? opt.action_summary;
  const savings = opt.details?.economia_projetada_mensal;
  const expandable = !!(opt.client_impact || savings != null);

  return (
    <Collapsible>
      <CollapsibleTrigger
        disabled={!expandable}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafa] data-[state=open]:bg-[#f8faff] ${
          !expandable ? "cursor-default" : "cursor-pointer"
        }`}
      >
        {/* Category icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
          style={cat ? { background: cat.bg, color: cat.color } : { background: "#f3f4f6", color: "#9ca3af" }}
        >
          {cat?.icon ?? "•"}
        </div>

        {/* Title */}
        <p className="flex-1 text-[13px] font-medium text-[#111827] leading-snug truncate">
          {title}
        </p>

        {/* Status + date + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {st && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}
            >
              {st.label}
            </span>
          )}
          <p className="text-[11px] text-[#9ca3af] w-12 text-right">
            {format(new Date(opt.executed_at), "MMM d")}
          </p>
          {expandable && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-[#9ca3af] transition-transform duration-200 group-data-[state=open]:rotate-180"
            >
              <path
                d="M3 5L7 9L11 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </CollapsibleTrigger>

      {expandable && (
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 bg-[#f8faff] border-t border-[#eceef2] space-y-3">
            {opt.client_impact && (
              <p className="text-[13px] text-[#374151] leading-relaxed">
                {opt.client_impact}
              </p>
            )}
            {savings != null && (
              <div className="inline-flex items-center gap-2 bg-[#ecfdf5] border border-[#bbf7d0] rounded-lg px-3 py-2">
                <span className="text-base">💰</span>
                <p className="text-[12px] font-semibold text-[#059669]">
                  Estimated savings:{" "}
                  <span className="tabular-nums">{fmtCurrency(savings)}/month</span>
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function OptimizationList({
  optimizations,
  title = "Recent Optimizations",
}: OptimizationListProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#eceef2]">
        <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="divide-y divide-[#eceef2]">
        {optimizations.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-[#9ca3af] text-center">
            No optimizations in this period
          </p>
        ) : (
          optimizations.map((opt) => <OptimizationItem key={opt.id} opt={opt} />)
        )}
      </div>
    </div>
  );
}
