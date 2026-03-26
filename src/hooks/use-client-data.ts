"use client";

import { useState } from "react";
import { CLIENT_ACCOUNTS, DEFAULT_ACCOUNT_ID } from "@/lib/constants";

export function useClientData() {
  const [accountId, setAccountId] = useState<number>(DEFAULT_ACCOUNT_ID);

  const currentClient = CLIENT_ACCOUNTS.find((c) => c.id === accountId);

  return {
    accountId,
    setAccountId,
    currentClient,
    clients: CLIENT_ACCOUNTS,
  };
}
