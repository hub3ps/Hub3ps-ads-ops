"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ClientOption {
  id: string;   // UUID (clients.id)
  name: string; // display name (clients.name)
}

interface AccountContextValue {
  accountId: number;
  accountName: string;
  displayName: string;
  firstName: string;
  avatarUrl: string;
  loading: boolean;
  // Multi-client support (populated when user has >1 client)
  clients: ClientOption[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId]           = useState(0);
  const [accountName, setAccountName]       = useState("");
  const [displayName, setDisplayName]       = useState("");
  const [firstName, setFirstName]           = useState("");
  const [avatarUrl, setAvatarUrl]           = useState("");
  const [loading, setLoading]               = useState(true);
  const [clients, setClients]               = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  // Step 1 — on mount: resolve user → all client_ids + display_name
  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch ALL rows for this user (admin may have multiple)
      const { data: userRows } = await supabase
        .schema("ads")
        .from("dashboard_users")
        .select("client_id, display_name, first_name, avatar_url")
        .eq("auth_user_id", user.id);

      if (!userRows?.length) { setLoading(false); return; }

      setDisplayName(userRows[0].display_name ?? "");
      setFirstName(userRows[0].first_name ?? "");
      setAvatarUrl(userRows[0].avatar_url ?? "");

      const clientIds = userRows.map((r) => r.client_id as string);

      if (clientIds.length > 1) {
        // Fetch names for the selector dropdown
        const { data: clientRows } = await supabase
          .schema("ads")
          .from("clients")
          .select("id, name")
          .in("id", clientIds);

        // Preserve the order from dashboard_users
        const nameMap = new Map(
          (clientRows ?? []).map((c: { id: string; name: string }) => [c.id, c.name]),
        );
        setClients(
          clientIds.map((id) => ({ id, name: nameMap.get(id) ?? id })),
        );
      }

      // Default to first client — triggers Step 2 via the effect below
      setSelectedClientId(clientIds[0]);
    }

    loadUser();
  }, []);

  // Step 2 — whenever selectedClientId changes: load gads_accounts
  useEffect(() => {
    if (!selectedClientId) return;

    const supabase = createClient();

    async function loadAccount() {
      const { data: account } = await supabase
        .schema("ads")
        .from("gads_accounts")
        .select("external_customer_id, account_name")
        .eq("client_id", selectedClientId)
        .single();

      if (account) {
        setAccountId(Number(account.external_customer_id));
        setAccountName(account.account_name ?? "");
      }

      setLoading(false);
    }

    loadAccount();
  }, [selectedClientId]);

  return (
    <AccountContext.Provider
      value={{
        accountId,
        accountName,
        displayName,
        firstName,
        avatarUrl,
        loading,
        clients,
        selectedClientId,
        setSelectedClientId,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}
