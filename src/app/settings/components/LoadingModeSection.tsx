"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Infinity,
  MousePointerClick,
  Check,
  Grid3x3,
  LayoutGrid,
  LayoutList,
  Rows3,
  AlignJustify,
  Sparkles,
  ChevronDown,
  ArrowDownToLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

// ═══════════════════════════════════════════════════════
// Type definitions
// ═══════════════════════════════════════════════════════
interface LoadingModeSectionProps {
  t: (key: string) => string;
  loadMode: string;
  setLoadMode: (v: string) => void;
  tempVideosPerPage: number;
  setTempVideosPerPage: (v: number) => void;
}

type LoadModeId = "auto" | "manual";

type VideoCountOption = {
  value: number;
  icon: React.ElementType;
  gridSize: { cols: number; rows: number };
  labelKey: string;
  descKey: string;
};

// ═══════════════════════════════════════════════════════
// Mini preview: Auto (Infinite Scroll)
// ═══════════════════════════════════════════════════════
function AutoModePreview({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "w-full aspect-[16/10] rounded-lg border-2 p-1.5 overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-background to-muted/50",
        "border-border",
        active ? "opacity-90 scale-[1.02] shadow-sm" : "opacity-50"
      )}
    >
      {/* Mini header bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-4 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Grid of video thumbnails */}
      <div className="grid grid-cols-2 gap-0.5 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "aspect-video rounded-sm border transition-colors",
              i <= 3 ? "bg-muted-foreground/10 border-border/50" : "bg-primary/15 border-primary/30"
            )}
          />
        ))}
      </div>

      {/* Scroll indicator — animated arrow */}
      <div className="flex flex-col items-center gap-0.5">
        <motion.div
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown
            size={8}
            className={cn(
              "transition-colors",
              active ? "text-primary" : "text-muted-foreground/40"
            )}
          />
        </motion.div>
        <div
          className={cn(
            "h-0.5 w-6 rounded-full transition-colors",
            active ? "bg-primary/40" : "bg-muted-foreground/15"
          )}
        />
        <motion.div
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        >
          <ChevronDown
            size={6}
            className={cn(
              "transition-colors",
              active ? "text-primary/60" : "text-muted-foreground/25"
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Mini preview: Manual (Load More Button)
// ═══════════════════════════════════════════════════════
function ManualModePreview({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "w-full aspect-[16/10] rounded-lg border-2 p-1.5 overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-background to-muted/50",
        "border-border",
        active ? "opacity-90 scale-[1.02] shadow-sm" : "opacity-50"
      )}
    >
      {/* Mini header bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-4 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Grid of video thumbnails */}
      <div className="grid grid-cols-2 gap-0.5 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "aspect-video rounded-sm border transition-colors",
              "bg-muted-foreground/10 border-border/50"
            )}
          />
        ))}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center mt-0.5">
        <div
          className={cn(
            "h-2.5 w-12 rounded-full border flex items-center justify-center transition-colors",
            active
              ? "bg-primary/15 border-primary/30"
              : "bg-muted-foreground/10 border-border/50"
          )}
        >
          <ArrowDownToLine
            size={5}
            className={cn(
              "transition-colors",
              active ? "text-primary" : "text-muted-foreground/40"
            )}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Loading mode card
// ═══════════════════════════════════════════════════════
function LoadModeCard({
  mode,
  active,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  mode: LoadModeId;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  description: string;
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
          layoutId="loading-mode-active"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check size={12} className="text-primary-foreground" />
        </motion.div>
      )}

      {/* Mini preview */}
      {mode === "auto" ? (
        <AutoModePreview active={active} />
      ) : (
        <ManualModePreview active={active} />
      )}

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
// Mini grid preview for videos per page
// ═══════════════════════════════════════════════════════
function GridPreview({
  option,
  active,
  isRTL,
}: {
  option: VideoCountOption;
  active: boolean;
  isRTL: boolean;
}) {
  const { cols, rows } = option.gridSize;

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
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/30" />
        <div className="h-1.5 w-4 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Grid preview */}
      <div
        className={cn("grid gap-0.5", {
          "grid-cols-2": cols === 2,
          "grid-cols-3": cols === 3,
          "grid-cols-4": cols === 4,
          "grid-cols-5": cols === 5,
        })}
        style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-video rounded-sm border transition-colors",
              active
                ? i < 3
                  ? "bg-muted-foreground/10 border-border/50"
                  : "bg-primary/15 border-primary/30"
                : "bg-muted-foreground/8 border-border/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Videos per page card
// ═══════════════════════════════════════════════════════
function VideoCountCard({
  option,
  active,
  onClick,
  isRTL,
}: {
  option: VideoCountOption;
  active: boolean;
  onClick: () => void;
  isRTL: boolean;
}) {
  const Icon = option.icon;
  const { t } = useI18n();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-2 p-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group",
        active
          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
          : "border-transparent hover:border-border hover:bg-muted/40"
      )}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="videos-per-page-active"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check size={12} className="text-primary-foreground" />
        </motion.div>
      )}

      {/* Mini grid preview */}
      <GridPreview option={option} active={active} isRTL={isRTL} />

      {/* Count badge */}
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
        )}
      >
        {option.value}
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-semibold text-center leading-tight transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {t(option.labelKey)}
      </span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════
// Main exported component
// ═══════════════════════════════════════════════════════
export default function LoadingModeSection({
  t,
  loadMode,
  setLoadMode,
  tempVideosPerPage,
  setTempVideosPerPage,
}: LoadingModeSectionProps) {
  const { direction } = useI18n();
  const isRTL = direction === "rtl";

  // ─── Loading Mode definitions ───
  const modes: {
    id: LoadModeId;
    icon: React.ElementType;
    label: string;
    description: string;
  }[] = [
    {
      id: "auto",
      icon: Infinity,
      label: t("autoLoad") || "Automatic (Infinite Scroll)",
      description:
        isRTL
          ? "يتم تحميل المزيد تلقائياً عند التمرير للأسفل"
          : "More videos load automatically as you scroll down",
    },
    {
      id: "manual",
      icon: MousePointerClick,
      label: t("manualLoad") || "Manual (Load More Button)",
      description:
        isRTL
          ? "اضغط زر \"تحميل المزيد\" لعرض فيديوهات إضافية"
          : 'Tap "Load More" to show additional videos',
    },
  ];

  // ─── Videos per page options ───
  const videoCountOptions: VideoCountOption[] = [
    {
      value: 6,
      icon: Rows3,
      gridSize: { cols: 2, rows: 2 },
      labelKey: "videosPerPageCompact",
      descKey: "videosPerPageCompactDesc",
    },
    {
      value: 12,
      icon: LayoutGrid,
      gridSize: { cols: 3, rows: 2 },
      labelKey: "videosPerPageDefault",
      descKey: "videosPerPageDefaultDesc",
    },
    {
      value: 18,
      icon: Grid3x3,
      gridSize: { cols: 3, rows: 3 },
      labelKey: "videosPerPageExtended",
      descKey: "videosPerPageExtendedDesc",
    },
    {
      value: 24,
      icon: LayoutList,
      gridSize: { cols: 4, rows: 3 },
      labelKey: "videosPerPageMax",
      descKey: "videosPerPageMaxDesc",
    },
    {
      value: 30,
      icon: AlignJustify,
      gridSize: { cols: 5, rows: 3 },
      labelKey: "videosPerPageUltra",
      descKey: "videosPerPageUltraDesc",
    },
  ];

  return (
    <div className="p-6 border-b border-border">
      <div className="flex flex-col gap-6">
        {/* ─── Section Header ─── */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">{t("loadMode")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("loadModeDesc") ||
                (isRTL
                  ? "اختر طريقة تحميل الفيديوهات وعددها"
                  : "Choose how videos load and how many to show")}
            </p>
          </div>
        </div>

        {/* ─── Loading Mode: Auto vs Manual ─── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("loadModeBehavior") ||
              (isRTL ? "سلوك التحميل" : "Loading Behavior")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode) => (
              <LoadModeCard
                key={mode.id}
                mode={mode.id}
                active={loadMode === mode.id}
                onClick={() => setLoadMode(mode.id)}
                icon={mode.icon}
                label={mode.label}
                description={mode.description}
              />
            ))}
          </div>
        </div>

        {/* ─── Divider ─── */}
        <div className="border-t border-border/60" />

        {/* ─── Videos Per Page ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("videosPerPage")}
            </p>
            <AnimatePresence mode="wait">
              <motion.span
                key={tempVideosPerPage}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-bold text-primary"
              >
                {tempVideosPerPage} {t("videosPerPageLabel") || "videos"}
              </motion.span>
            </AnimatePresence>
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            {t("videosPerPageDesc") ||
              (isRTL
                ? "اختر عدد الفيديوهات المعروضة في كل صفحة"
                : "Choose how many videos to display per page")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {videoCountOptions.map((option) => (
              <VideoCountCard
                key={option.value}
                option={option}
                active={tempVideosPerPage === option.value}
                onClick={() => setTempVideosPerPage(option.value)}
                isRTL={isRTL}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
