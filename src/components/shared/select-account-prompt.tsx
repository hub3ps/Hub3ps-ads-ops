"use client";

import { useAccount } from "@/contexts/account-context";

export function SelectAccountPrompt() {
  const { clients, setSelectedClientId } = useAccount();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="#4285F4" strokeWidth="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="2" stroke="#4285F4" strokeWidth="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="2" stroke="#4285F4" strokeWidth="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="2" stroke="#4285F4" strokeWidth="1.5" opacity="0.4" />
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-[#111827] mb-1">Select an account</h3>
      <p className="text-[13px] text-[#9ca3af] mb-6 text-center max-w-sm">
        This page shows data for a specific account. Please select one from the list below or use the account selector in the sidebar.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {clients.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClientId(client.id)}
            className="px-4 py-2 rounded-lg border border-[#e2e4ea] text-[13px] font-medium text-[#374151] hover:bg-[#eff6ff] hover:text-[#4285F4] hover:border-[#4285F4] transition-colors"
          >
            {client.name}
          </button>
        ))}
      </div>
    </div>
  );
}
