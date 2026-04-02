"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
// Sidebar Item Props
// ═══════════════════════════════════════════════════════
export interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  isCollapsed?: boolean;
  mounted?: boolean;
  isRTL?: boolean;
  theme?: string | undefined;
}

// ═══════════════════════════════════════════════════════
// Sidebar Item Component
// ═══════════════════════════════════════════════════════
export const SidebarItem = React.memo(function SidebarItem({
  icon: Icon,
  label,
  href,
  isActive = false,
  onClick,
  badge,
  badgeColor,
  isCollapsed = false,
  mounted = true,
  isRTL = false,
  theme,
}: SidebarItemProps) {
  // Theme-aware active styles
  const activeBg = useMemo(() => {
    if (!mounted) return "bg-muted/60";
    if (theme === "boys") return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
    if (theme === "girls") return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300";
    return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }, [mounted, theme]);

  const activeIconColor = useMemo(() => {
    if (!mounted) return "";
    if (theme === "boys") return isActive ? "text-sky-600" : "";
    if (theme === "girls") return isActive ? "text-pink-600" : "";
    return isActive ? "text-red-600" : "";
  }, [mounted, theme, isActive]);

  const indicatorColor = useMemo(() => {
    if (!mounted) return "bg-muted-foreground";
    if (theme === "boys") return "bg-sky-500";
    if (theme === "girls") return "bg-pink-500";
    return "bg-red-500";
  }, [mounted, theme]);

  const content = (
    <div
      title={isCollapsed ? label : undefined}
      className={cn(
        "relative flex items-center cursor-pointer transition-all duration-200 rounded-xl group",
        isCollapsed
          ? "flex-col justify-center h-[72px] px-1 mx-1"
          : "h-[40px] px-3 mx-2 w-full",
        isActive
          ? activeBg
          : "hover:bg-muted/60 text-foreground"
      )}
    >
      {/* Active indicator bar */}
      {isActive && !isCollapsed && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className={cn(
            "absolute w-[3px] h-5 rounded-full",
            isRTL ? "right-0 rounded-r-none" : "left-0 rounded-l-none",
            indicatorColor
          )}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      {/* Active dot for collapsed mode */}
      {isActive && isCollapsed && (
        <div
          className={cn(
            "absolute top-1.5 w-1.5 h-1.5 rounded-full",
            indicatorColor
          )}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-6 h-6 shrink-0",
          isCollapsed ? "mb-1" : "me-3",
          activeIconColor
        )}
      >
        <Icon
          className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={isActive ? 2.5 : 1.8}
        />
      </div>

      {/* Label (hidden when collapsed) */}
      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-between overflow-hidden">
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden text-ellipsis text-start",
              "text-[13px] leading-tight",
              isActive ? "font-semibold" : "font-medium"
            )}
          >
            {label}
          </span>
          {badge && (
            <span
              className={cn(
                "ms-2 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide shrink-0",
                badgeColor || "bg-red-600"
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={isCollapsed ? "w-full flex justify-center" : "w-full"}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="w-full">
      {content}
    </div>
  );
});
