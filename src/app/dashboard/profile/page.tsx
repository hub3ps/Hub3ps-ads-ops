"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfileData, type ProfileData, type CampaignConfig, type AdGroupRow } from "@/lib/queries/profile";
import { useAccount } from "@/contexts/account-context";
import { cn } from "@/lib/utils";
import { SelectAccountPrompt } from "@/components/shared/select-account-prompt";

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e4ea] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 md:px-6 border-b border-[#eceef2]">
        <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0 text-[#4285F4]">
          {icon}
        </div>
        <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="px-4 py-4 md:px-6 md:py-5">{children}</div>
    </div>
  );
}

// ── Label-value row ───────────────────────────────────────────────────────────

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-[#f3f4f6] last:border-0">
      <span className="w-28 md:w-32 shrink-0 text-[12px] text-[#6b7280]">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[#4285F4] hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-[12px] text-[#111827] flex-1">{value}</span>
      )}
    </div>
  );
}

// ── Clinic Overview ───────────────────────────────────────────────────────────

function ClinicOverviewSection({ clinic }: { clinic: ProfileData["clinic"] }) {
  // Clean up site URL for display
  const siteDisplay = clinic.site.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Section
      title="Clinic Overview"
      icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 4V7C13 10.3 10.3 13 7 13C3.7 13 1 10.3 1 7V4L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      }
    >
      <div className="grid md:grid-cols-2 gap-x-12">
        <div>
          <InfoRow label="Clinic name"   value={clinic.name} />
          <InfoRow label="Website"       value={siteDisplay} href={clinic.site} />
          <InfoRow label="Address"       value={clinic.address} />
          <InfoRow label="Contact"       value={clinic.contact} />
        </div>
        <div>
          <InfoRow label="Country"       value={clinic.country} />
          <InfoRow label="Timezone"      value={clinic.timezone} />
          <InfoRow label="Currency"      value={clinic.currency} />
        </div>
      </div>

      {clinic.role && (
        <div className="mt-4 pt-4 border-t border-[#f3f4f6]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-2">
            Role in the group
          </p>
          <p className="text-[13px] text-[#374151] leading-relaxed">{clinic.role}</p>
        </div>
      )}
    </Section>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────

function ServicesSection({ services }: { services: ProfileData["services"] }) {
  return (
    <Section
      title="Services Advertised"
      icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
        </svg>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2.5">
            Can advertise
          </p>
          <div className="flex flex-wrap gap-2">
            {services.allowed.map((s, i) => (
              <span
                key={i}
                title={s.note || undefined}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-[#ecfdf5] text-[#059669]"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2.5">
            Cannot advertise
          </p>
          <div className="flex flex-wrap gap-2">
            {services.blocked.map((s, i) => (
              <span
                key={i}
                title={s.note || undefined}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-[#fef2f2] text-[#EA4335]"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                  <path d="M3 3L7 7M7 3L3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#9ca3af] pt-1 border-t border-[#f3f4f6]">
          Services are managed according to the dental group&apos;s advertising strategy. Each clinic has designated specialties to avoid overlap.
        </p>
      </div>
    </Section>
  );
}

// ── Campaign Setup ────────────────────────────────────────────────────────────

function AdGroupsTable({ rows }: { rows: AdGroupRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
    <table className="w-full min-w-[400px] mt-3">
      <thead>
        <tr className="bg-[#f8faff]">
          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Ad Group</th>
          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">tCPA Target</th>
          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Intent</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((ag, i) => (
          <tr key={i} className="border-t border-[#eceef2]">
            <td className="px-3 py-2 text-[12px] font-medium text-[#374151]">{ag.name}</td>
            <td className="px-3 py-2 text-[12px] text-[#374151] tabular-nums">
              {ag.tcpa === "—" || ag.tcpa === "" ? (
                <span className="text-[#9ca3af]">—</span>
              ) : (
                <span className="font-semibold text-[#4285F4]">NZD ${ag.tcpa}</span>
              )}
            </td>
            <td className="px-3 py-2 text-[12px] text-[#6b7280]">{ag.intent}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignConfig }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-[#e2e4ea] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors text-left",
          open ? "bg-[#f8faff]" : "hover:bg-[#f5f6f8]",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L4.5 7L7 9L9.5 5.5L12 3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#111827] truncate">{campaign.name}</span>
          {campaign.budget && (
            <span className="shrink-0 text-[11px] font-medium text-[#4285F4] bg-[#eff6ff] px-2 py-0.5 rounded-full">
              {campaign.budget}
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn("text-[#9ca3af] transition-transform duration-200 shrink-0", open && "rotate-180")}
        >
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-[#eceef2]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <ConfigPill label="Bidding"   value={campaign.bidding} />
            <ConfigPill label="Schedule"  value={campaign.schedule} />
            <ConfigPill label="Coverage"  value={campaign.coverage} />
          </div>
          <AdGroupsTable rows={campaign.adGroups} />
        </div>
      )}
    </div>
  );
}

function ConfigPill({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="bg-[#f8faff] rounded-lg px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-0.5">{label}</p>
      <p className="text-[12px] text-[#374151]">{value}</p>
    </div>
  );
}

function CampaignSetupSection({ campaigns }: { campaigns: ProfileData["campaigns"] }) {
  return (
    <Section
      title="Campaign Setup"
      icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 1V3M7 11V13M1 7H3M11 7H13M2.93 2.93L4.34 4.34M9.66 9.66L11.07 11.07M2.93 11.07L4.34 9.66M9.66 4.34L11.07 2.93" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      }
    >
      <div className="space-y-3">
        {campaigns.map((c, i) => (
          <CampaignCard key={i} campaign={c} />
        ))}
      </div>
    </Section>
  );
}

// ── Performance Targets ───────────────────────────────────────────────────────

function PerformanceTargetsSection({ contract }: { contract: ProfileData["contract"] }) {
  return (
    <Section
      title="Performance Targets"
      icon={
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="7" cy="7" r="0.75" fill="currentColor" />
        </svg>
      }
    >
      <div className="space-y-6">

        {/* Marketing objective */}
        {contract.objective && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">
              Marketing Objective
            </p>
            <p className="text-[13px] text-[#374151] leading-relaxed">{contract.objective}</p>
          </div>
        )}

        {/* CPA targets */}
        {contract.cpaTargets.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">
              CPA Targets
            </p>
            <div className="border border-[#e2e4ea] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-[#f8faff] border-b border-[#eceef2]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Campaign</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Ad Group</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af] whitespace-nowrap">CPA Target (NZD)</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.cpaTargets.map((t, i) => (
                    <tr key={i} className="border-b border-[#eceef2] last:border-0">
                      <td className="px-4 py-2.5 text-[12px] text-[#374151]">{t.campaign}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium text-[#374151]">{t.adGroup}</td>
                      <td className="px-4 py-2.5 text-[12px] tabular-nums">
                        {t.cpa.includes("Sem") || t.cpa.includes("sem") ? (
                          <span className="text-[#9ca3af]">Not set</span>
                        ) : (
                          <span className="font-semibold text-[#4285F4]">${t.cpa}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Conversion actions */}
        {contract.conversions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">
              Conversion Actions
            </p>
            <div className="border border-[#e2e4ea] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-[#f8faff] border-b border-[#eceef2]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Action</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Primary</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.conversions.map((c, i) => (
                    <tr key={i} className="border-b border-[#eceef2] last:border-0">
                      <td className="px-4 py-2.5 text-[12px] font-medium text-[#374151]">{c.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          c.primary === "Sim"
                            ? "bg-[#ecfdf5] text-[#059669]"
                            : "bg-[#f3f4f6] text-[#6b7280]",
                        )}>
                          {c.primary === "Sim" ? "Primary" : "Secondary"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[#6b7280]">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Tracking note */}
        {contract.trackingNote && (
          <div className="flex gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5 text-[#d97706]">
              <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 7V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
            </svg>
            <p className="text-[12px] text-[#92400e] leading-relaxed">{contract.trackingNote}</p>
          </div>
        )}

      </div>
    </Section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      {[220, 160, 300, 260].map((h, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#e2e4ea] overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-[#eceef2] flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#f3f4f6]" />
            <div className="h-3.5 w-40 bg-[#f3f4f6] rounded" />
          </div>
          <div className="px-6 py-5">
            <div className="space-y-3">
              {Array.from({ length: Math.floor(h / 40) }).map((_, j) => (
                <div key={j} className="flex gap-4">
                  <div className="w-28 h-3 bg-[#f3f4f6] rounded" />
                  <div className="flex-1 h-3 bg-[#f3f4f6] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { accountId, accountName, isAllAccounts } = useAccount();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    setData(null);
    getProfileData(supabase, accountId)
      .then(setData)
      .catch((e) => console.error("getProfileData:", e))
      .finally(() => setLoading(false));
  }, [accountId]);

  if (isAllAccounts) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#111827]">Company Profile</h2>
          <p className="text-[14px] text-[#9ca3af] mt-1">Select an account to view data</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e4ea] shadow-sm">
          <SelectAccountPrompt />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold text-[#111827]">Company Profile</h2>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">
          {accountName || "Account"} — strategy & configuration
        </p>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : !data ? (
        <div className="bg-white rounded-xl border border-[#e2e4ea] p-10 text-center">
          <p className="text-[13px] text-[#9ca3af]">No profile data available for this account</p>
        </div>
      ) : (
        <div className="space-y-5">
          <ClinicOverviewSection   clinic={data.clinic} />
          <ServicesSection         services={data.services} />
          <CampaignSetupSection    campaigns={data.campaigns} />
          <PerformanceTargetsSection contract={data.contract} />
        </div>
      )}
    </div>
  );
}
