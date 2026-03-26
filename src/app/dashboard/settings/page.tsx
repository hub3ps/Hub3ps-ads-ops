"use client";

// Design tokens (reference for all dashboard pages):
// Page title: text-[22px] font-bold — Subtitle: text-[14px] mt-1
// Section h2: text-[16px] font-semibold — Labels: text-[13px] text-[#6b7280] mb-2
// Inputs: px-4 py-3 text-[14px] rounded-xl — Cards: p-7

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = "personal" | "account" | "password";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  phone: string | null;
  country: string | null;
  display_name: string | null;
}

interface AccountRow {
  role: string;
  created_at: string;
  clients: { name: string } | null;
}

// ── Side menu ─────────────────────────────────────────────────────────────────

const menuItems: { id: Section; label: string }[] = [
  { id: "personal", label: "Personal Data" },
  { id: "account", label: "Account" },
  { id: "password", label: "Change Password" },
];

// ── Shared input style ────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#e2e4ea] text-[14px] text-[#111827] bg-white outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/10 placeholder-[#d1d5db]";

const labelClass = "block text-[13px] font-medium text-[#6b7280] mb-2";

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg text-[13px] font-medium",
        type === "success"
          ? "bg-[#ecfdf5] border border-[#6ee7b7] text-[#065f46]"
          : "bg-[#fef2f2] border border-[#fecaca] text-[#EA4335]",
      )}
    >
      {type === "success" ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4.5 7L6.5 9L9.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="0.5" fill="currentColor" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ── Personal Data ─────────────────────────────────────────────────────────────

function PersonalSection() {
  const [profile, setProfile] = useState<Profile>({
    first_name: "", last_name: "", job_title: "", phone: "", country: "", display_name: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data } = await supabase
        .schema("ads")
        .from("dashboard_users")
        .select("first_name, last_name, job_title, phone, country, display_name")
        .eq("auth_user_id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .schema("ads")
      .from("dashboard_users")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        job_title: profile.job_title,
        phone: profile.phone,
        country: profile.country,
      })
      .eq("auth_user_id", user.id);

    setSaving(false);
    if (error) {
      showToast("Failed to save changes. Please try again.", "error");
    } else {
      showToast("Changes saved successfully.", "success");
    }
  };

  const initial = (profile.first_name || profile.display_name || email || "?")
    .charAt(0)
    .toUpperCase();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 w-16 rounded-full bg-[#f3f4f6]" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-[#f3f4f6] rounded" />
              <div className="h-10 bg-[#f3f4f6] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[22px] font-semibold shrink-0">
          {initial}
        </div>
        <div>
          <button
            disabled
            className="px-3.5 py-2 rounded-lg border border-[#e2e4ea] text-[12px] font-medium text-[#9ca3af] cursor-not-allowed bg-[#f9fafb]"
          >
            Change photo
          </button>
          <p className="text-[11px] text-[#9ca3af] mt-1">Coming soon</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>First Name</label>
          <input
            type="text"
            className={inputClass}
            value={profile.first_name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
            placeholder="Jane"
          />
        </div>
        <div>
          <label className={labelClass}>Last Name</label>
          <input
            type="text"
            className={inputClass}
            value={profile.last_name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
            placeholder="Smith"
          />
        </div>
        <div>
          <label className={labelClass}>Job Title</label>
          <input
            type="text"
            className={inputClass}
            value={profile.job_title ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, job_title: e.target.value }))}
            placeholder="e.g., Practice Manager"
          />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input
            type="text"
            className={inputClass}
            value={profile.country ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
            placeholder="New Zealand"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="text"
            className={inputClass}
            value={profile.phone ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+64 21 000 0000"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={cn(inputClass, "bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed")}
            value={email}
            readOnly
          />
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#4285F4] hover:bg-[#3574e2] active:bg-[#2d63ca] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ── Account ───────────────────────────────────────────────────────────────────

function AccountSection() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .schema("ads")
        .from("dashboard_users")
        .select("role, created_at, clients:client_id(name)")
        .eq("auth_user_id", user.id);

      if (data) setAccounts(data as unknown as AccountRow[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b border-[#f3f4f6]">
            <div className="h-3 w-24 bg-[#f3f4f6] rounded" />
            <div className="h-3 w-32 bg-[#f3f4f6] rounded" />
          </div>
        ))}
      </div>
    );
  }

  const role = accounts[0]?.role ?? "—";
  const createdAt = accounts[0]?.created_at
    ? new Date(accounts[0].created_at).toLocaleDateString("en-NZ", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";
  const clinics = accounts.map((a) => a.clients?.name ?? "—").filter(Boolean);

  const rows = [
    { label: "Clinic(s) linked", value: clinics.join(", ") || "—" },
    { label: "Role", value: role.charAt(0).toUpperCase() + role.slice(1) },
    { label: "Member since", value: createdAt },
    { label: "Plan", value: "Professional" },
  ];

  return (
    <div className="divide-y divide-[#f3f4f6]">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-1 sm:gap-4">
          <span className="text-[13px] text-[#6b7280]">{label}</span>
          <span className="text-[13px] font-medium text-[#111827] sm:text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Change Password ───────────────────────────────────────────────────────────

function PasswordSection() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdate = async () => {
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      showToast(error.message || "Failed to update password.", "error");
    } else {
      showToast("Password updated successfully.", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-4 w-full md:max-w-sm">
      <div>
        <label className={labelClass}>New password</label>
        <input
          type="password"
          className={inputClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <input
          type="password"
          className={inputClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          autoComplete="new-password"
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#4285F4] hover:bg-[#3574e2] active:bg-[#2d63ca] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as Section | null;
  const validSections: Section[] = ["personal", "account", "password"];
  const [section, setSection] = useState<Section>(
    tabParam && validSections.includes(tabParam) ? tabParam : "personal",
  );

  // Sync state when URL param changes (e.g. navigating from topbar dropdown)
  useEffect(() => {
    const tab = searchParams.get("tab") as Section | null;
    if (tab && validSections.includes(tab)) setSection(tab);
  }, [searchParams]);

  const handleSectionChange = (id: Section) => {
    setSection(id);
    router.replace(`/dashboard/settings?tab=${id}`);
  };

  const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
    personal: { title: "Personal Data", subtitle: "Update your name, contact and profile info" },
    account: { title: "Account", subtitle: "Your linked clinics, role and plan" },
    password: { title: "Change Password", subtitle: "Update your login password" },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#111827]">Settings</h1>
        <p className="text-[14px] text-[#9ca3af] mt-1">Manage your account</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Side menu — vertical on md+, equal-width tabs on mobile */}
        <nav className="w-full md:w-48 md:shrink-0 bg-white border border-[#e2e4ea] rounded-xl overflow-hidden">
          <div className="flex md:flex-col">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={cn(
                  "flex-1 md:flex-none text-center md:text-left px-3 md:px-4 py-3 text-[13px] md:text-[14px] font-medium transition-colors",
                  section === item.id
                    ? "bg-[#eff6ff] text-[#4285F4]"
                    : "text-[#374151] hover:bg-[#f5f6f8] hover:text-[#111827]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content card */}
        <div className="flex-1 w-full min-w-0 bg-white border border-[#e2e4ea] rounded-xl p-5 md:p-7">
          <div className="mb-5">
            <h2 className="text-[16px] font-semibold text-[#111827]">
              {sectionTitles[section].title}
            </h2>
            <p className="text-[13px] text-[#9ca3af] mt-1">
              {sectionTitles[section].subtitle}
            </p>
          </div>
          <div className="border-t border-[#f3f4f6] pt-5">
            {section === "personal" && <PersonalSection />}
            {section === "account" && <AccountSection />}
            {section === "password" && <PasswordSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-32 bg-[#f3f4f6] rounded" />
            <div className="h-3 w-48 bg-[#f3f4f6] rounded" />
            <div className="h-64 bg-[#f3f4f6] rounded-xl mt-4" />
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
