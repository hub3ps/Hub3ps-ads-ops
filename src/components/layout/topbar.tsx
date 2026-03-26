"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "@/contexts/account-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ── Dropdown item icons ───────────────────────────────────────────────────────

const PersonalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
    <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 13.5C2 11.015 4.515 9 7.5 9C10.485 9 13 11.015 13 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const AccountIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
    <rect x="2" y="4" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 4V3C5 2.448 5.448 2 6 2H9C9.552 2 10 2.448 10 3V4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 7.5H13" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
    <rect x="3" y="7" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 7V5C5 3.895 6.119 3 7.5 3C8.881 3 10 3.895 10 5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
    <path d="M6 2H3C2.45 2 2 2.45 2 3V12C2 12.55 2.45 13 3 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M10 10L13 7.5L10 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { accountName, displayName, firstName, loading } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  const greetingName = firstName || displayName?.split(" ")[0] || "there";
  const avatarName = displayName || accountName || "Dashboard";
  const initial = avatarName.charAt(0).toUpperCase();

  // Fetch email once
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  // Click outside closes dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const settingsItems = [
    { label: "Personal Data", tab: "personal", icon: <PersonalIcon /> },
    { label: "Account",       tab: "account",  icon: <AccountIcon /> },
    { label: "Change Password", tab: "password", icon: <LockIcon /> },
  ];

  return (
    <header className="bg-white border-b border-[#e2e4ea] sticky top-0 z-10">
      <div className="px-6 py-5 flex items-center justify-between">
        {/* Hamburger — mobile only */}
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-1.5 rounded-lg hover:bg-[#f5f6f8] transition-colors md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Greeting */}
        <div className="flex-1 ml-1 md:ml-0">
          {loading ? (
            <div className="animate-pulse space-y-1.5">
              <div className="h-4 w-52 bg-[#f3f4f6] rounded" />
              <div className="h-3 w-32 bg-[#f3f4f6] rounded" />
              <div className="h-3 w-40 bg-[#f3f4f6] rounded" />
            </div>
          ) : (
            <>
              <h1 className="text-[15px] md:text-[17px] font-semibold text-[#111827]">
                {greeting}, <span className="text-[#4285F4]">{greetingName}</span> 👋
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#9ca3af] shrink-0">
                  <path d="M6 1C3.79 1 2 2.79 2 5C2 7.5 6 11 6 11C6 11 10 7.5 10 5C10 2.79 8.21 1 6 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <circle cx="6" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                <span className="text-[13px] font-medium text-[#374151]">{accountName || "Dashboard"}</span>
              </div>
              <p className="hidden sm:block text-[12px] md:text-[13px] text-[#9ca3af] mt-0.5">
                {new Date().toLocaleDateString("en-NZ", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[12px] font-semibold shrink-0 hover:bg-[#3574e2] transition-colors"
          >
            {loading ? "" : initial}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#e2e4ea] rounded-xl shadow-lg z-50 overflow-hidden"
              style={{ animation: "dropdownIn 0.12s ease-out" }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[#e2e4ea] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#111827] truncate">{avatarName}</p>
                  <p className="text-[11px] text-[#9ca3af] truncate">{email}</p>
                </div>
              </div>

              {/* Settings items */}
              <div className="py-1">
                {settingsItems.map(({ label, tab, icon }) => {
                  const isActive =
                    pathname.startsWith("/dashboard/settings") &&
                    (new URLSearchParams(
                      typeof window !== "undefined" ? window.location.search : "",
                    ).get("tab") ?? "personal") === tab;
                  return (
                    <Link
                      key={tab}
                      href={`/dashboard/settings?tab=${tab}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors",
                        isActive
                          ? "text-[#4285F4] bg-[#eff6ff]"
                          : "text-[#374151] hover:bg-[#f5f6f8]",
                      )}
                    >
                      <span className={isActive ? "text-[#4285F4]" : "text-[#9ca3af]"}>{icon}</span>
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Sign out */}
              <div className="border-t border-[#e2e4ea] py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#6b7280] hover:bg-[#fef2f2] hover:text-[#EA4335] transition-colors"
                >
                  <SignOutIcon />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}
