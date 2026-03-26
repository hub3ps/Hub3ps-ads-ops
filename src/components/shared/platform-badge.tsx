import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: "google" | "meta";
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  if (platform === "google") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
          "bg-[#eff6ff] text-[#4285F4]",
          className,
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
        Google Ads
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
        "bg-[#eff3ff] text-[#1877F2]",
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" />
      Meta Ads
    </span>
  );
}
