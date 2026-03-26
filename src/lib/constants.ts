export const colors = {
  // Platform accents
  accent: "#4285F4", // Google Blue — primary accent
  accentMeta: "#1877F2", // Meta Blue — secondary
  green: "#34A853", // Google Green — positive/conversions
  yellow: "#F9AB00", // Google Yellow — warning/monitoring
  red: "#EA4335", // Google Red — negative/alert

  // Surfaces
  bg: "#f5f6f8",
  surface: "#ffffff",
  surfaceHover: "#f0f1f4",
  border: "#e2e4ea",
  borderLight: "#eceef2",

  // Text
  text: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  textDim: "#9ca3af",
  textGhost: "#d1d5db",
} as const;

export const categoryStyles = {
  NEGATIVE_KW: {
    icon: "✕",
    color: "#EA4335",
    bg: "#fef2f2",
    label: "Negative KW",
  },
  AD_COPY: { icon: "✎", color: "#059669", bg: "#ecfdf5", label: "Ad Copy" },
  GOVERNANCE: {
    icon: "⌧",
    color: "#4285F4",
    bg: "#eff6ff",
    label: "Governance",
  },
  SCHEDULE: { icon: "◷", color: "#d97706", bg: "#fffbeb", label: "Schedule" },
  STRUCTURE: { icon: "⚙", color: "#6b7280", bg: "#f3f4f6", label: "Structure" },
  BIDDING: { icon: "◈", color: "#7c3aed", bg: "#f5f3ff", label: "Bidding" },
  BUDGET: { icon: "◰", color: "#0891b2", bg: "#ecfeff", label: "Budget" },
  TARGETING: { icon: "◎", color: "#c2410c", bg: "#fff7ed", label: "Targeting" },
} as const;

export const statusStyles = {
  DONE: { color: "#059669", bg: "#ecfdf5", label: "Done" },
  MONITORING: { color: "#d97706", bg: "#fffbeb", label: "Monitoring" },
  SKIPPED: { color: "#6b7280", bg: "#f3f4f6", label: "Skipped" },
} as const;

export const CLIENT_ACCOUNTS = [
  { id: 9652559023, name: "ClearChange Aligners" },
  { id: 1940590984, name: "Dental Implants" },
  { id: 7104324417, name: "Dental Reflections" },
  { id: 4935460152, name: "Hutt Dental Hub" },
  { id: 3251235686, name: "iDD Dental Lab" },
  { id: 3960818728, name: "Naenae Dental Clinic" },
  { id: 3927633786, name: "Wainui Dental" },
] as const;

export const DEFAULT_ACCOUNT_ID = 3960818728; // Naenae — dev/test default
