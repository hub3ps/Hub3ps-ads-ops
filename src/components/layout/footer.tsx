export function Footer() {
  return (
    <footer className="px-4 md:px-6 py-3 border-t border-[#eceef2] bg-white mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
        <p className="text-[11px] text-[#9ca3af]">
          Ads Intelligence by Hub3Ps · Data refreshed daily
        </p>
        <p className="text-[11px] text-[#9ca3af]">
          © {new Date().getFullYear()} Hub3Ps
        </p>
      </div>
    </footer>
  );
}
