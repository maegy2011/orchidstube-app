"use client";

import React from "react";
import { PanelLeftClose, PanelLeftOpen, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

// ═══════════════════════════════════════════════════════
// Sidebar Footer Props
// ═══════════════════════════════════════════════════════
export interface SidebarFooterProps {
  isOverlay: boolean;
  isDesktop: boolean;
  sidebarMode: string;
  isCollapsed: boolean;
  onClose?: () => void;
}

// ═══════════════════════════════════════════════════════
// Sidebar Footer Component
// ═══════════════════════════════════════════════════════
export function SidebarFooter({
  isOverlay,
  isDesktop,
  sidebarMode,
  isCollapsed,
  onClose,
}: SidebarFooterProps) {
  const { t } = useI18n();

  // Only show on desktop, non-overlay, non-hidden mode
  if (isOverlay || !isDesktop || sidebarMode === "hidden") {
    return null;
  }

  return (
    <div className={cn("border-t border-border/40 py-2 px-2")}>
      <button
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 w-full h-[40px] px-3 rounded-xl",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200",
          "text-[13px] font-medium"
        )}
        title={
          isCollapsed
            ? (t("sidebarExpanded") || "Full Sidebar")
            : (t("sidebarCollapsed") || "Mini Sidebar")
        }
      >
        {isCollapsed ? (
          <PanelLeftOpen className="w-5 h-5 rtl:rotate-180" />
        ) : (
          <>
            <PanelLeftClose className="w-5 h-5 rtl:rotate-180" />
            <span>{t("sidebarCollapsed") || "Mini Sidebar"}</span>
            <ChevronLeft size={16} className="ms-auto rtl:rotate-180" />
          </>
        )}
      </button>
    </div>
  );
}
