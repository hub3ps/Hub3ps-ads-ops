"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";

const MIN_WIDTH = 64;
const MAX_WIDTH = 280;
const SNAP_THRESHOLD = 100;
const DEFAULT_WIDTH = 224;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Read from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
    const savedWidth = parseInt(localStorage.getItem("sidebar-width") || String(DEFAULT_WIDTH), 10);
    setSidebarCollapsed(collapsed);
    setSidebarWidth(collapsed ? MIN_WIDTH : savedWidth);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      if (next) {
        setSidebarWidth(MIN_WIDTH);
      } else {
        const savedWidth = parseInt(localStorage.getItem("sidebar-width") || String(DEFAULT_WIDTH), 10);
        setSidebarWidth(savedWidth);
      }
      return next;
    });
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onMouseMove = (ev: MouseEvent) => {
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
        setSidebarWidth(newWidth);
        setSidebarCollapsed(newWidth <= SNAP_THRESHOLD);
      };

      const onMouseUp = (ev: MouseEvent) => {
        const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + ev.clientX - startX));
        const collapsed = newWidth <= SNAP_THRESHOLD;

        if (collapsed) {
          setSidebarCollapsed(true);
          setSidebarWidth(MIN_WIDTH);
          localStorage.setItem("sidebar-collapsed", "true");
        } else {
          setSidebarCollapsed(false);
          setSidebarWidth(newWidth);
          localStorage.setItem("sidebar-collapsed", "false");
          localStorage.setItem("sidebar-width", String(newWidth));
        }

        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [sidebarWidth],
  );

  return (
    <div className="flex h-screen bg-[#f5f6f8] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onResizeStart={handleResizeStart}
          width={sidebarWidth}
          isResizing={isResizing}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-7">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
