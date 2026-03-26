"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAccount } from "@/contexts/account-context";

// ── Icons ─────────────────────────────────────────────────────────────────────

const OverviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" />
  </svg>
);

const InsightsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 13L5 9L7.5 11L10 7L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="13" cy="3" r="1.5" fill="currentColor" />
  </svg>
);

const CampaignsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 11L5 8L8 10L11 6L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4V7M14 4H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const OptimizationsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 2V5M8 11V14M2 8H5M11 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);


const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 13.5C2.5 11.015 5.015 9 8 9C10.985 9 13.5 11.015 13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="12" height="12" viewBox="0 0 12 12" fill="none"
    className={cn("transition-transform duration-200 text-[#9ca3af]", open && "rotate-180")}
  >
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Campaign sub-items ────────────────────────────────────────────────────────

const campaignSubItems = [
  { label: "Performance", href: "/dashboard/campaigns" },
  { label: "Ad Groups",   href: "/dashboard/campaigns/ad-groups" },
  { label: "Keywords",    href: "/dashboard/campaigns/keywords" },
  { label: "Ads",         href: "/dashboard/campaigns/ads" },
];

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
        isActive
          ? "bg-[#eff6ff] text-[#4285F4]"
          : "text-[#374151] hover:bg-[#f5f6f8] hover:text-[#111827]",
      )}
    >
      <span className={isActive ? "text-[#4285F4]" : "text-[#9ca3af]"}>{icon}</span>
      {label}
    </Link>
  );
}

// ── Client selector (admin with multiple accounts) ────────────────────────────

function ClientSelector() {
  const { clients, selectedClientId, setSelectedClientId, displayName } = useAccount();
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="relative">
      <p className="text-[10px] text-[#9ca3af] font-medium px-2 mb-1">{displayName}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#f5f6f8] hover:bg-[#eceef2] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] shrink-0" />
          <span className="text-[12px] font-medium text-[#111827] truncate">
            {selected?.name ?? "Select account"}
          </span>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e2e4ea] rounded-xl shadow-lg z-50 overflow-hidden">
          {clients.map((client) => {
            const isSelected = client.id === selectedClientId;
            return (
              <button
                key={client.id}
                onClick={() => { setSelectedClientId(client.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                  isSelected ? "bg-[#eff6ff] text-[#4285F4]" : "text-[#374151] hover:bg-[#f5f6f8]",
                )}
              >
                <span className="text-[12px] font-medium truncate">{client.name}</span>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path d="M2 6L5 9L10 3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { accountName, displayName, loading, clients, selectedClientId, setSelectedClientId } = useAccount();

  const isCampaignsActive = pathname.startsWith("/dashboard/campaigns");
  const [campaignsOpen, setCampaignsOpen] = useState(isCampaignsActive);

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-white border-r border-[#e2e4ea] h-screen sticky top-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e2e4ea]">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-[3px] items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F9AB00]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#111827] leading-none">Ads Intelligence</p>
            <p className="text-[10px] text-[#9ca3af] mt-0.5">by Hub3Ps</p>
          </div>
        </div>
      </div>

      {/* Account info / selector */}
      <div className="px-3 py-3 border-b border-[#e2e4ea]">
        {loading ? (
          <div className="animate-pulse space-y-1.5 px-2">
            <div className="h-2.5 w-24 bg-[#f3f4f6] rounded" />
            <div className="h-3 w-32 bg-[#f3f4f6] rounded" />
          </div>
        ) : clients.length > 1 ? (
          <ClientSelector />
        ) : (
          <div className="px-2">
            <p className="text-[10px] text-[#9ca3af] font-medium">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] shrink-0" />
              <p className="text-[12px] font-semibold text-[#111827] truncate">{accountName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Platform badges */}
      <div className="px-4 py-3 border-b border-[#e2e4ea] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#eff6ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
          <span className="text-[11px] font-semibold text-[#4285F4]">Google Ads</span>
          <span className="ml-auto text-[10px] font-semibold text-[#34A853] bg-[#ecfdf5] px-1.5 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#f3f4f6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]" />
          <span className="text-[11px] font-semibold text-[#9ca3af]">Meta Ads</span>
          <span className="ml-auto text-[10px] font-semibold text-[#9ca3af] bg-white px-1.5 py-0.5 rounded-full border border-[#e5e7eb]">Soon</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <NavItem href="/dashboard"           label="Overview"         icon={<OverviewIcon />} exact />
        <NavItem href="/dashboard/insights"  label="Insights"         icon={<InsightsIcon />} />

        {/* Campaigns expandable */}
        <div>
          <button
            onClick={() => setCampaignsOpen((v) => !v)}
            className={cn(
              "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
              isCampaignsActive
                ? "bg-[#eff6ff] text-[#4285F4]"
                : "text-[#374151] hover:bg-[#f5f6f8] hover:text-[#111827]",
            )}
          >
            <span className="flex items-center gap-2.5">
              <span className={isCampaignsActive ? "text-[#4285F4]" : "text-[#9ca3af]"}>
                <CampaignsIcon />
              </span>
              Campaigns
            </span>
            <ChevronIcon open={campaignsOpen} />
          </button>

          {campaignsOpen && (
            <div className="mt-0.5 ml-3 pl-4 border-l border-[#e2e4ea] flex flex-col gap-0.5">
              {campaignSubItems.map((sub) => {
                const isActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors",
                      isActive
                        ? "text-[#4285F4] bg-[#eff6ff]"
                        : "text-[#6b7280] hover:text-[#374151] hover:bg-[#f5f6f8]",
                    )}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <NavItem href="/dashboard/optimizations" label="Opt. History"    icon={<OptimizationsIcon />} />
        <NavItem href="/dashboard/profile"       label="Company Profile" icon={<ProfileIcon />} />
      </nav>

    </aside>
  );
}
