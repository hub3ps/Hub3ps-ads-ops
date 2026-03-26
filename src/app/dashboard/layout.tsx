import { AccountProvider } from "@/contexts/account-context";
import { DashboardShell } from "./shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountProvider>
      <DashboardShell>{children}</DashboardShell>
    </AccountProvider>
  );
}
