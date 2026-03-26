"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAdCopy } from "@/lib/queries/campaigns";
import { useAccount } from "@/contexts/account-context";
import { AdCopySection } from "@/components/dashboard/ad-copy-section";

export default function AdsPage() {
  const { accountId } = useAccount();
  const [loading, setLoading] = useState(true);
  const [adCopy, setAdCopy] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    getAdCopy(supabase, accountId)
      .then(setAdCopy)
      .finally(() => setLoading(false));
  }, [accountId]);

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
