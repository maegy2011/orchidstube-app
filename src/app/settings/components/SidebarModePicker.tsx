"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  PanelLeftOpen,
  PanelLeftClose,
  EyeOff,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

export type SidebarModeId = "expanded" | "collapsed" | "hidden";

interface SidebarModePickerProps {
  value: SidebarModeId;
  onChange: (mode: SidebarModeId) => void;
}

// ═══════════════════════════════════════════════════════
// Miniature sidebar preview for each mode
// ═══════════════════════════════════════════════════════
function MiniSidebarPreview({
  mode,
  active,
  isRTL,
}: {
  mode: SidebarModeId;
  active: boolean;
  isRTL: boolean;
}) {
  const sidebarW = mode === "hidden" ? 0 : mode === "collapsed" ? 22 : 48;
  const showLabels = mode === "expanded";

  return (
    <div
      className={cn(
        "w-full aspect-[16/10] rounded-lg border-2 p-1.5 overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-background to-muted/50",
        "border-border",
        active ? "opacity-90 scale-[1.02] shadow-sm" : "opacity-50"
      )}
    >
      {/* Mini header */}
      <div className="flex items-center justify-between mb-1">
        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-6 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Body: sidebar + content */}
      <div className={cn("flex gap-0.5 h-full", isRTL && "flex-row-reverse")}>
        {/* Sidebar area */}
        <motion.div
          layout
          className={cn(
            "rounded-sm flex-shrink-0 transition-all duration-300 overflow-hidden",
            active ? "bg-primary/15" : "bg-muted-foreground/15"
          )}
          style={{ width: sidebarW }}
        >
          {sidebarW > 0 && (
            <div className="flex flex-col gap-0.5 p-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  {showLabels && (
                    <div className="h-1 w-4 rounded-full bg-muted-foreground/25" />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Content area */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 aspect-video rounded-sm bg-muted-foreground/10 border border-border/50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Individual mode card
// ═══════════════════════════════════════════════════════
function ModeCard({
  mode,
  active,
  onClick,
  icon: Icon,
  label,
  description,
  isRTL,
}: {
  mode: SidebarModeId;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  description: string;
  isRTL: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-2.5 p-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer group",
        active
          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
          : "border-transparent hover:border-border hover:bg-muted/40"
      )}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="sidebar-mode-active"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check size={12} className="text-primary-foreground" />
        </motion.div>
      )}

      {/* Mini preview */}
      <MiniSidebarPreview mode={mode} active={active} isRTL={isRTL} />

      {/* Icon + Label */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span
          className={cn(
            "text-xs font-semibold transition-colors",
            active
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </div>

      {/* Description */}
      <p
        className={cn(
          "text-[10px] text-center leading-relaxed",
          active ? "text-muted-foreground" : "text-muted-foreground/60"
        )}
      >
        {description}
      </p>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════
// Main exported component
// ═══════════════════════════════════════════════════════
export function SidebarModePicker({ value, onChange }: SidebarModePickerProps) {
  const { t, direction } = useI18n();
  const isRTL = direction === "rtl";

  const modes: {
    id: SidebarModeId;
    icon: React.ElementType;
    label: string;
    description: string;
  }[] = [
    {
      id: "expanded",
      icon: PanelLeftOpen,
      label: t("sidebarExpanded") || t("expanded") || "Full Sidebar",
      description:
        isRTL
          ? "القائمة الكاملة ظاهرة دائماً على الديسكتوب، overlay على الموبايل"
          : "Full sidebar on desktop, overlay on mobile",
    },
    {
      id: "collapsed",
      icon: PanelLeftClose,
      label: t("sidebarCollapsed") || t("collapsed") || "Mini Sidebar",
      description:
        isRTL
          ? "أيقونات فقط على الديسكتوب والموبايل"
          : "Icons only on desktop and mobile",
    },
    {
      id: "hidden",
      icon: EyeOff,
      label: t("sidebarHidden") || t("hidden") || "Hidden",
      description:
        isRTL
          ? "مخفية — اضغط القائمة لعرضها مؤقتاً"
          : "Hidden — tap menu to show temporarily",
    },
  ];

  return (
    <div className="p-6 border-b border-border">
      <div className="flex flex-col gap-5">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <PanelLeftOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{t("sidebarMode")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("sidebarModeDesc") ||
                (isRTL
                  ? "اختر شكل القائمة الجانبية"
                  : "Choose the sidebar layout")}
            </p>
          </div>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode) => (
            <ModeCard
              key={mode.id}
              mode={mode.id}
              active={value === mode.id}
              onClick={() => onChange(mode.id)}
              icon={mode.icon}
              label={mode.label}
              description={mode.description}
              isRTL={isRTL}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
