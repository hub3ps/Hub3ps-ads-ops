"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdCopy } from "@/lib/queries/campaigns";
import { useAccount } from "@/contexts/account-context";
import { AdCopySection } from "@/components/dashboard/ad-copy-section";
import { SelectAccountPrompt } from "@/components/shared/select-account-prompt";

export default function AdsPage() {
  const { accountId, isAllAccounts } = useAccount();
  const [loading, setLoading] = useState(true);
  const [adCopy, setAdCopy] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getAdCopy(supabase, accountId)
      .then(setAdCopy)
      .finally(() => setLoading(false));
  }, [accountId]);

  if (isAllAccounts) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-[22px] font-bold text-[#111827]">Ads</h2>
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
        <h2 className="text-[15px] font-semibold text-[#111827]">Ads</h2>
        <p className="text-[12px] text-[#9ca3af] mt-0.5">Active responsive search ads</p>
      </div>
      <AdCopySection ads={adCopy} loading={loading} />
    </div>
  );
}
