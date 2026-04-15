"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Monitor,
  Gamepad2,
  Heart,
  Undo2,
  Sparkles,
  Check,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

export type ThemeId = "light" | "dark" | "boys" | "girls" | "system";

interface ThemePickerProps {
  /** The currently selected (temp/preview) theme — controlled by parent */
  selectedTheme: ThemeId;
  /** Callback when user picks a new theme for preview */
  onThemeChange: (theme: ThemeId) => void;
  /** Whether the theme has changed from the saved/original */
  hasChanged: boolean;
  /** Callback to revert to the original theme */
  onRevert: () => void;
}

const THEMES: {
  id: ThemeId;
  getIcon: () => React.ReactNode;
  iconColor: string;
  preview: {
    bg: string;
    border: string;
    dot1: string;
    dot2: string;
    text: string;
    bar: string;
    accent: string;
  };
  kids?: boolean;
  labelKey: string;
}[] = [
  {
    id: "light",
    getIcon: () => <Sun className="w-5 h-5" />,
    iconColor: "text-amber-500",
    preview: {
      bg: "bg-gradient-to-br from-white to-gray-50",
      border: "border-gray-200",
      dot1: "bg-amber-400",
      dot2: "bg-gray-300",
      text: "text-gray-800",
      bar: "bg-gray-900",
      accent: "bg-gray-100",
    },
    labelKey: "themeLight",
  },
  {
    id: "dark",
    getIcon: () => <Moon className="w-5 h-5" />,
    iconColor: "text-blue-400",
    preview: {
      bg: "bg-gradient-to-br from-gray-900 to-gray-950",
      border: "border-gray-700",
      dot1: "bg-blue-400",
      dot2: "bg-gray-600",
      text: "text-gray-100",
      bar: "bg-blue-400",
      accent: "bg-gray-800",
    },
    labelKey: "themeDark",
  },
  {
    id: "boys",
    getIcon: () => <Gamepad2 className="w-5 h-5" />,
    iconColor: "text-sky-500",
    preview: {
      bg: "bg-gradient-to-br from-sky-50 to-blue-100",
      border: "border-sky-300",
      dot1: "bg-sky-400",
      dot2: "bg-sky-200",
      text: "text-sky-900",
      bar: "bg-sky-500",
      accent: "bg-sky-100",
    },
    kids: true,
    labelKey: "themeBoys",
  },
  {
    id: "girls",
    getIcon: () => <Heart className="w-5 h-5" />,
    iconColor: "text-pink-500",
    preview: {
      bg: "bg-gradient-to-br from-pink-50 to-rose-100",
      border: "border-pink-300",
      dot1: "bg-pink-400",
      dot2: "bg-pink-200",
      text: "text-pink-900",
      bar: "bg-pink-500",
      accent: "bg-pink-100",
    },
    kids: true,
    labelKey: "themeGirls",
  },
  {
    id: "system",
    getIcon: () => <Monitor className="w-5 h-5" />,
    iconColor: "text-muted-foreground",
    preview: {
      bg: "bg-gradient-to-br from-gray-100 to-gray-900",
      border: "border-gray-400",
      dot1: "bg-amber-400",
      dot2: "bg-gray-600",
      text: "text-gray-500",
      bar: "bg-gradient-to-r from-gray-900 to-gray-100",
      accent: "bg-gray-200",
    },
    labelKey: "themeSystem",
  },
];

function ThemePreviewCard({ theme, active, onClick, label }: { theme: typeof THEMES[number]; active: boolean; onClick: () => void; label: string }) {
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
      {/* Active indicator dot */}
      {active && (
        <motion.div
          layoutId="theme-picker-active"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check size={12} className="text-primary-foreground" />
        </motion.div>
      )}

      {/* Mini preview card */}
      <div
        className={cn(
          "w-full aspect-[16/10] rounded-xl border-2 p-1.5 overflow-hidden transition-all duration-300",
          theme.preview.bg,
          theme.preview.border,
          active ? "scale-[1.02] shadow-sm" : "opacity-60 group-hover:opacity-80"
        )}
      >
        {/* Mini header */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className={cn("w-2 h-2 rounded-full", theme.preview.dot1)} />
          <div className={cn("w-2 h-2 rounded-full", theme.preview.dot2)} />
          <div className="w-2 h-2 rounded-full bg-transparent" />
        </div>
        {/* Mini content */}
        <div className="space-y-1">
          <div className={cn("h-1.5 rounded-full w-3/4", theme.preview.bar)} />
          <div className={cn("h-1.5 rounded-full w-1/2", theme.preview.dot2)} />
        </div>
        {/* Mini cards */}
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-3 rounded-sm border",
                theme.preview.border,
                theme.preview.dot1,
                "opacity-40"
              )}
            />
          ))}
        </div>
        {/* Accent bar for kids themes */}
        {theme.kids && (
          <div className={cn("h-1 rounded-full w-full mt-2", theme.preview.bar, "opacity-60")} />
        )}
      </div>

      {/* Label + Icon */}
      <div className="flex items-center gap-1.5">
        <span className={cn("transition-colors", active ? theme.iconColor : "text-muted-foreground")}>
          {theme.getIcon()}
        </span>
        <span
          className={cn(
            "text-xs font-semibold transition-colors",
            active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </div>

      {/* Kids badge */}
      {theme.kids && (
        <span className="absolute top-2 start-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
          Kids
        </span>
      )}
    </motion.button>
  );
}

export function ThemePicker({
  selectedTheme,
  onThemeChange,
  hasChanged,
  onRevert,
}: ThemePickerProps) {
  const { t, language } = useI18n();
  const { setTheme, theme: currentSavedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const previewAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply preview by directly manipulating <html> classes (non-persistent)
  // This does NOT call setTheme() — so localStorage is untouched
  const applyPreviewClass = useCallback((themeId: ThemeId) => {
    const html = document.documentElement;

    // Remove all previous theme classes
    html.classList.remove("dark", "boys", "girls");

    // Apply the preview class (skip 'light' and 'system' — they need no class)
    if (themeId === "dark" || themeId === "boys" || themeId === "girls") {
      html.classList.add(themeId);
    }

    previewAppliedRef.current = themeId;
  }, []);

  // When selectedTheme changes from parent, update the HTML preview
  useEffect(() => {
    if (!mounted) return;
    applyPreviewClass(selectedTheme);
  }, [selectedTheme, mounted, applyPreviewClass]);

  // On unmount or when reverting, restore the saved theme
  const restoreSavedTheme = useCallback(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "boys", "girls");

    if (currentSavedTheme === "dark" || currentSavedTheme === "boys" || currentSavedTheme === "girls") {
      html.classList.add(currentSavedTheme);
    }

    previewAppliedRef.current = null;
  }, [currentSavedTheme]);

  // Restore saved theme when component unmounts (if user navigates away without saving)
  useEffect(() => {
    return () => {
      if (previewAppliedRef.current) {
        restoreSavedTheme();
      }
    };
  }, [restoreSavedTheme]);

  // Get localized label
  const getLocalizedLabel = useCallback(
    (id: ThemeId) => {
      switch (id) {
        case "light":
          return t("themeLight");
        case "dark":
          return t("themeDark");
        case "system":
          return t("themeSystem");
        case "boys":
          return t("themeBoys");
        case "girls":
          return t("themeGirls") || t("themeKids" as any) || "Girls";
        default:
          return id;
      }
    },
    [t]
  );

  // Override the getThemeLabel used in sub-component
  const labelGetter = getLocalizedLabel;

  const handleSelect = useCallback(
    (id: ThemeId) => {
      if (id === selectedTheme) return;
      // Apply preview immediately via DOM class
      document.documentElement.classList.add("no-transitions");
      applyPreviewClass(id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("no-transitions");
        });
      });
      // Notify parent of the selection
      onThemeChange(id);
    },
    [selectedTheme, onThemeChange, applyPreviewClass]
  );

  const handleRevert = useCallback(() => {
    document.documentElement.classList.add("no-transitions");
    restoreSavedTheme();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("no-transitions");
      });
    });
    onRevert();
  }, [onRevert, restoreSavedTheme]);

  if (!mounted) {
    return (
      <div className="p-6 border-b border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Map over themes and inject localized labels
  const themesWithLabels = THEMES.map((th) => ({
    ...th,
    label: labelGetter(th.id),
  }));

  return (
    <div className="p-6 border-b border-border">
      <div className="flex flex-col gap-5">
        {/* Section Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{t("appearance")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("appearanceDesc") || "اختر سمة — المعاينة فورية، الحفظ عند الضغط على زر الحفظ"}
              </p>
            </div>
          </div>

          {/* Preview indicator + Revert button */}
          <AnimatePresence>
            {hasChanged && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                className="flex items-center gap-2 shrink-0"
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                  <Eye size={12} />
                  <span>{language === "ar" ? "معاينة" : "Preview"}</span>
                </div>
                <button
                  onClick={handleRevert}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-lg transition-colors"
                >
                  <Undo2 size={13} />
                  {t("revert") || "تراجع"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {themesWithLabels.map((item) => (
            <ThemePreviewCard
              key={item.id}
              theme={item}
              active={selectedTheme === item.id}
              onClick={() => handleSelect(item.id)}
              label={item.label}
            />
          ))}
        </div>

        {/* Preview notice bar */}
        <AnimatePresence>
          {hasChanged && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  {language === "ar"
                    ? "أنت الآن في وضع المعاينة. السمة لن تتغير فعلياً حتى تضغط على زر «حفظ التغييرات» أدناه."
                    : "You are in preview mode. The theme will not be applied until you click the Save button below."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
