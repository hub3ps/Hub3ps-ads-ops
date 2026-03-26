"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex gap-[5px] items-center mb-3">
            <span className="w-3 h-3 rounded-full bg-[#4285F4]" />
            <span className="w-3 h-3 rounded-full bg-[#EA4335]" />
            <span className="w-3 h-3 rounded-full bg-[#F9AB00]" />
            <span className="w-3 h-3 rounded-full bg-[#34A853]" />
          </div>
          <p className="text-[18px] font-bold text-[#111827]">Ads Intelligence</p>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">by Hub3Ps</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e4ea] shadow-sm px-8 py-8">
          <h1 className="text-[20px] font-semibold text-[#111827] mb-1">Sign in</h1>
          <p className="text-[13px] text-[#9ca3af] mb-6">Access your dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e4ea] text-[13px] text-[#111827] placeholder-[#d1d5db] bg-white outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/10"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e4ea] text-[13px] text-[#111827] placeholder-[#d1d5db] bg-white outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/10"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3.5 py-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#EA4335]">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4.5V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="7" cy="9.5" r="0.5" fill="currentColor" />
                </svg>
                <p className="text-[12px] text-[#EA4335]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#4285F4] hover:bg-[#3574e2] active:bg-[#2d63ca] text-white text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#9ca3af] mt-6">
          Hub3Ps © 2026
        </p>
      </div>
    </div>
  );
}
