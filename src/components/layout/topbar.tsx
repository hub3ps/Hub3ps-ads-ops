"use client";

import { useAccount } from "@/contexts/account-context";

export function Topbar() {
  const { accountName, displayName, loading } = useAccount();

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  const name = accountName || displayName || "Dashboard";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-[#e2e4ea] sticky top-0 z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          {loading ? (
            <div className="animate-pulse space-y-1.5">
              <div className="h-4 w-52 bg-[#f3f4f6] rounded" />
              <div className="h-3 w-40 bg-[#f3f4f6] rounded" />
            </div>
          ) : (
            <>
              <h1 className="text-[15px] font-semibold text-[#111827]">
                {greeting}, <span className="text-[#4285F4]">{name}</span> 👋
              </h1>
              <p className="text-[12px] text-[#9ca3af] mt-0.5">
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
        <div className="w-8 h-8 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
          {loading ? "" : initial}
        </div>
      </div>
    </header>
  );
}
