"use client";

import React from "react";
import { PanelLeftClose, PanelLeftOpen, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
// Sidebar Footer Props
// ═══════════════════════════════════════════════════════
export interface SidebarFooterProps {
  isOverlay: boolean;
  isDesktop: boolean;
  sidebarMode: string;
  isCollapsed: boolean;
  isRTL: boolean;
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
  isRTL,
  onClose,
}: SidebarFooterProps) {
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
            ? isRTL
              ? "عرض القائمة الكاملة"
              : "Show full guide"
            : isRTL
              ? "تصغير القائمة"
              : "Collapse"
        }
      >
        {isCollapsed ? (
          <>
            <PanelLeftOpen className="w-5 h-5" />
          </>
        ) : (
          <>
            <PanelLeftClose className="w-5 h-5" />
            <span>{isRTL ? "تصغير القائمة" : "Collapse"}</span>
            {isRTL ? (
              <ChevronRight size={16} className="ms-auto" />
            ) : (
              <ChevronLeft size={16} className="ms-auto" />
            )}
          </>
        )}
      </button>
    </div>
  );
}
