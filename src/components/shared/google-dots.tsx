import { cn } from "@/lib/utils";

interface GoogleDotsProps {
  size?: number;
  className?: string;
}

export function GoogleDots({ size = 10, className }: GoogleDotsProps) {
  return (
    <div className={cn("flex gap-[3px] items-center", className)}>
      <span
        className="rounded-full bg-[#4285F4]"
        style={{ width: size, height: size }}
      />
      <span
        className="rounded-full bg-[#EA4335]"
        style={{ width: size, height: size }}
      />
      <span
        className="rounded-full bg-[#F9AB00]"
        style={{ width: size, height: size }}
      />
      <span
        className="rounded-full bg-[#34A853]"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
