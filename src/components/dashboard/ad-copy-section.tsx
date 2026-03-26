"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface AssetItem {
  text: string;
  assetPerformanceLabel?: string;
  pinnedField?: string;
}

interface AdCopyRow {
  id?: number | string;
  campaign_id: number;
  campaign_name: string;
  ad_group_id: number;
  ad_group_name: string;
  ad_strength?: string;
  headlines_raw: string;
  descriptions_raw: string;
  final_urls?: string;
  path1?: string;
  path2?: string;
  status: string;
}

type ViewMode = "desktop" | "mobile";

interface AdVariation {
  headlines: string[];   // [main, ...secondary]
  description: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function parseAssets(raw: string): AssetItem[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseFinalUrls(raw?: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "";
  } catch {
    return raw;
  }
}

function getDomain(url: string): string {
  if (!url) return "";
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

/** Seeded pseudo-random — deterministic per (adId, index) so no hydration mismatch */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function buildVariations(
  headlines: AssetItem[],
  descriptions: AssetItem[],
  adSeed: number,
): AdVariation[] {
  const hTexts = headlines.map((h) => h.text).filter(Boolean);
  const dTexts = descriptions.map((d) => d.text).filter(Boolean);
  if (hTexts.length === 0) return [];

  return hTexts.map((mainHeadline, i) => {
    const rng = seededRng(adSeed + i * 31337);

    // Pick 1-2 secondary headlines (different from main)
    const others = hTexts.filter((_, j) => j !== i);
    const shuffled = [...others].sort(() => rng() - 0.5);
    const secondaries = shuffled.slice(0, Math.min(2, shuffled.length));

    // Pick 1-2 descriptions
    const dShuffled = [...dTexts].sort(() => rng() - 0.5);
    const descCount = dShuffled.length > 1 && rng() > 0.5 ? 2 : 1;
    const description = dShuffled.slice(0, descCount).join(" ");

    return { headlines: [mainHeadline, ...secondaries], description };
  });
}

// ── Style maps ────────────────────────────────────────────────────────────

const STRENGTH_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  EXCELLENT: { bg: "#ecfdf5", color: "#059669", label: "Excellent" },
  GOOD:      { bg: "#eff6ff", color: "#4285F4", label: "Good" },
  AVERAGE:   { bg: "#fffbeb", color: "#d97706", label: "Average" },
  POOR:      { bg: "#fef2f2", color: "#EA4335", label: "Poor" },
};

// ── Google logo SVG ───────────────────────────────────────────────────────

function GoogleLogo({ size = 20 }: { size?: number }) {
  const ratio = size / 20;
  // "Google" letter-by-letter with official colors
  const letters = [
    { char: "G", color: "#4285F4" },
    { char: "o", color: "#EA4335" },
    { char: "o", color: "#F9AB00" },
    { char: "g", color: "#4285F4" },
    { char: "l", color: "#34A853" },
    { char: "e", color: "#EA4335" },
  ];
  return (
    <span style={{ fontSize: size * ratio, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 }}>
      {letters.map((l, i) => (
        <span key={i} style={{ color: l.color }}>{l.char}</span>
      ))}
    </span>
  );
}

// ── Desktop frame ─────────────────────────────────────────────────────────

function DesktopFrame({
  variation,
  domain,
  fullDisplayUrl,
  clinicName,
}: {
  variation: AdVariation;
  domain: string;
  fullDisplayUrl: string;
  clinicName: string;
}) {
  return (
    <div
      className="shrink-0 bg-white rounded-xl border border-[#dadce0]"
      style={{ width: 580, padding: "20px 24px", scrollSnapAlign: "start" }}
    >
      {/* Google logo + search bar */}
      <div className="flex items-center gap-3 mb-5">
        <GoogleLogo size={22} />
        <div
          className="flex-1 border border-[#dfe1e5] rounded-3xl flex items-center px-4 gap-2"
          style={{ height: 40 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[13px] text-[#202124] truncate">{variation.headlines[0]}</span>
          <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12l7-7 7 7" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Ad result */}
      <div>
        {/* Favicon row */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center shrink-0">
            <span style={{ fontSize: 8, fontWeight: 700, color: "#5f6368" }}>
              {domain ? domain.charAt(0).toUpperCase() : "A"}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[14px] font-medium text-[#202124]">{clinicName}</span>
          </div>
          <span className="ml-1 text-[12px] font-bold text-[#202124] border border-[#dadce0] rounded px-1 leading-none py-0.5 shrink-0">
            Ad
          </span>
        </div>

        {/* URL */}
        <p className="text-[12px] text-[#006621] mb-1.5">
          {fullDisplayUrl || "www.example.com"}
        </p>

        {/* Headline */}
        <p
          className="mb-1"
          style={{ color: "#1a0dab", fontSize: 20, fontWeight: 400, lineHeight: 1.3 }}
        >
          {variation.headlines.join(" | ")}
        </p>

        {/* Description */}
        <p
          className="text-[#4d5156] overflow-hidden"
          style={{ fontSize: 14, lineHeight: 1.58, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {variation.description}
        </p>
      </div>

      {/* Organic placeholders */}
      <div className="mt-5 pt-4 border-t border-[#ebebeb] space-y-3">
        {[{ w: "55%", label: "72%", h: 14 }, { w: "40%", label: "88%", h: 10 }, { w: "48%", label: "65%", h: 10 }].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="rounded-full bg-[#e8e8e8]" style={{ width: ["55%", "40%", "48%"][i], height: 14 }} />
            <div className="rounded-full bg-[#e8e8e8]" style={{ width: ["88%", "72%", "65%"][i], height: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mobile frame ─────────────────────────────────────────────────────────

function MobileFrame({
  variation,
  domain,
  fullDisplayUrl,
  clinicName,
}: {
  variation: AdVariation;
  domain: string;
  fullDisplayUrl: string;
  clinicName: string;
}) {
  return (
    <div
      className="shrink-0 bg-white"
      style={{ width: 260, borderRadius: 16, border: "1px solid #dadce0", padding: 16, boxShadow: "0 1px 6px rgba(32,33,36,0.12)", scrollSnapAlign: "start" }}
    >
      {/* Chrome bar: hamburger + Google logo + circles */}
      <div className="flex items-center mb-3">
        <div className="flex flex-col gap-[3px] shrink-0">
          <div className="rounded-full bg-[#5f6368]" style={{ width: 14, height: 2 }} />
          <div className="rounded-full bg-[#5f6368]" style={{ width: 14, height: 2 }} />
          <div className="rounded-full bg-[#5f6368]" style={{ width: 14, height: 2 }} />
        </div>
        <div className="flex-1 flex justify-center">
          <GoogleLogo size={17} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="rounded-full bg-[#34A853]" style={{ width: 8, height: 8 }} />
          <div className="rounded-full bg-[#F9AB00]" style={{ width: 8, height: 8 }} />
        </div>
      </div>

      {/* Search bar */}
      <div
        className="flex items-center gap-2 px-3 mb-3"
        style={{ height: 36, background: "#f1f3f4", borderRadius: 18 }}
      >
        <span className="flex-1 text-[12px] text-[#9aa0a6] truncate">{variation.headlines[0]}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <circle cx="11" cy="11" r="7" stroke="#9aa0a6" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Divider */}
      <div className="mb-3" style={{ height: 1, background: "#ebebeb" }} />

      {/* Ad result */}
      <div>
        {/* Favicon + name + Ad badge */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <div
            className="rounded-full bg-[#f1f3f4] border border-[#dadce0] flex items-center justify-center shrink-0"
            style={{ width: 14, height: 14 }}
          >
            <span style={{ fontSize: 7, fontWeight: 700, color: "#5f6368" }}>
              {domain ? domain.charAt(0).toUpperCase() : "A"}
            </span>
          </div>
          <span className="text-[12px] font-medium text-[#202124] truncate">{clinicName}</span>
          <span
            className="shrink-0 font-bold text-[#202124] border border-[#dadce0] rounded"
            style={{ fontSize: 10, padding: "1px 4px", lineHeight: 1.4 }}
          >
            Ad
          </span>
        </div>

        {/* URL */}
        <p className="text-[11px] text-[#006621] mb-1">
          {fullDisplayUrl || "www.example.com"}
        </p>

        {/* Headline */}
        <p className="mb-1" style={{ color: "#1a0dab", fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>
          {variation.headlines.join(" | ")}
        </p>

        {/* Description */}
        <p
          className="text-[#4d5156] overflow-hidden"
          style={{ fontSize: 12, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
        >
          {variation.description}
        </p>
      </div>

      {/* Organic placeholders */}
      <div className="mt-3 pt-3 border-t border-[#ebebeb] space-y-2">
        {[
          { title: "65%", body: "85%" },
          { title: "50%", body: "78%" },
          { title: "58%", body: "90%" },
        ].map((l, i) => (
          <div key={i} className="space-y-1">
            <div style={{ width: l.title, height: 9, background: "#e8e8e8", borderRadius: 4 }} />
            <div style={{ width: l.body, height: 7, background: "#e8e8e8", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RSA Preview block for one ad ─────────────────────────────────────────

function GoogleAdsPreview({ ad }: { ad: AdCopyRow }) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const headlines = parseAssets(ad.headlines_raw);
  const descriptions = parseAssets(ad.descriptions_raw);
  const strength = ad.ad_strength ? STRENGTH_STYLE[ad.ad_strength] : null;
  const firstUrl = parseFinalUrls(ad.final_urls);
  const domain = getDomain(firstUrl);
  const path1 = ad.path1 && ad.path1 !== "null" ? ad.path1 : null;
  const path2 = ad.path2 && ad.path2 !== "null" ? ad.path2 : null;
  const displayPath = [path1, path2].filter(Boolean).join("/");
  const fullDisplayUrl = displayPath ? `${domain}/${displayPath}` : domain;
  const clinicName = ad.campaign_name.split(" ").slice(0, 3).join(" ");

  const adSeed = typeof ad.id === "number" ? ad.id : String(ad.id ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const variations = useMemo(
    () => buildVariations(headlines, descriptions, adSeed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ad.headlines_raw, ad.descriptions_raw],
  );

  const mobile = viewMode === "mobile";

  return (
    <div className="bg-white border border-[#e2e4ea] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[12px] font-medium text-[#374151]">Ad Variations</p>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">
            Showing {variations.length} possible ad variation{variations.length !== 1 ? "s" : ""} — Google combines headlines and descriptions automatically.
          </p>
        </div>
        {strength && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
            style={{ background: strength.bg, color: strength.color }}
          >
            {strength.label}
          </span>
        )}
      </div>

      {/* Desktop / Mobile toggle */}
      <div className="flex gap-1 bg-[#f5f6f8] rounded-lg p-0.5 w-fit mb-4">
        {(["desktop", "mobile"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              viewMode === m
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#374151]",
            )}
          >
            {m === "desktop" ? (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="0.75" y="0.75" width="11.5" height="8" rx="1.25" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4.5 12h4M6.5 8.75V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                <rect x="0.75" y="0.75" width="8.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="5" cy="10.5" r="0.6" fill="currentColor" />
              </svg>
            )}
            {m === "desktop" ? "Desktop" : "Mobile"}
          </button>
        ))}
      </div>

      {/* Variation cards — horizontal scroll */}
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {variations.map((v, i) =>
          mobile ? (
            <MobileFrame
              key={i}
              variation={v}
              domain={domain}
              fullDisplayUrl={fullDisplayUrl}
              clinicName={clinicName}
            />
          ) : (
            <DesktopFrame
              key={i}
              variation={v}
              domain={domain}
              fullDisplayUrl={fullDisplayUrl}
              clinicName={clinicName}
            />
          ),
        )}
      </div>
    </div>
  );
}

// ── Level 2: Ad Group accordion ───────────────────────────────────────────

function AdGroupAccordion({
  name,
  ads,
  defaultOpen = false,
}: {
  name: string;
  ads: AdCopyRow[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#e2e4ea] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f5f6f8] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-[#eff6ff] flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="0.75" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="6.25" y="0.75" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="0.75" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" />
              <rect x="6.25" y="6.25" width="4" height="4" rx="0.75" stroke="#4285F4" strokeWidth="1.1" opacity="0.4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#374151]">{name}</span>
          <span className="text-[11px] text-[#9ca3af] bg-[#f5f6f8] px-2 py-0.5 rounded-full">
            {ads.length} {ads.length === 1 ? "ad" : "ads"}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn("text-[#9ca3af] transition-transform duration-200 shrink-0", open && "rotate-180")}
        >
          <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-[#f8faff] border-t border-[#eceef2] space-y-4">
          {ads.map((ad, i) => (
            <GoogleAdsPreview key={ad.id ?? i} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Level 1: Campaign accordion ───────────────────────────────────────────

function CampaignAccordion({
  name,
  adGroups,
}: {
  name: string;
  adGroups: Map<string, AdCopyRow[]>;
}) {
  const [open, setOpen] = useState(false);
  const totalAds = Array.from(adGroups.values()).reduce((s, a) => s + a.length, 0);

  return (
    <div className="border border-[#e2e4ea] rounded-xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 transition-colors",
          open ? "bg-[#f8faff]" : "hover:bg-[#f5f6f8]",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L4.5 7L7 9L9.5 5.5L12 3" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[14px] font-semibold text-[#111827]">{name}</p>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">
              {adGroups.size} ad {adGroups.size === 1 ? "group" : "groups"} · {totalAds} {totalAds === 1 ? "ad" : "ads"}
            </p>
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={cn("text-[#9ca3af] transition-transform duration-200 shrink-0", open && "rotate-180")}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-[#f8faff] border-t border-[#eceef2] space-y-3">
          {Array.from(adGroups.entries()).map(([agName, ads]) => (
            <AdGroupAccordion key={agName} name={agName} ads={ads} defaultOpen={adGroups.size === 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────

interface AdCopySectionProps {
  ads: AdCopyRow[];
  loading?: boolean;
}

export function AdCopySection({ ads, loading = false }: AdCopySectionProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white border border-[#e2e4ea] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e4ea] p-10 text-center">
        <p className="text-[13px] text-[#9ca3af]">No enabled ads found for this account</p>
      </div>
    );
  }

  // Build Campaign → Ad Group → Ads hierarchy
  const byCampaign = new Map<string, Map<string, AdCopyRow[]>>();

  for (const ad of ads) {
    const cName = ad.campaign_name;
    const agName = ad.ad_group_name;
    if (!byCampaign.has(cName)) byCampaign.set(cName, new Map());
    const agMap = byCampaign.get(cName)!;
    if (!agMap.has(agName)) agMap.set(agName, []);
    agMap.get(agName)!.push(ad);
  }

  return (
    <div className="space-y-3">
      {Array.from(byCampaign.entries()).map(([cName, adGroups]) => (
        <CampaignAccordion key={cName} name={cName} adGroups={adGroups} />
      ))}
    </div>
  );
}
