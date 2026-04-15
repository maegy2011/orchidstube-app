"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useTheme } from "next-themes";
import { getFormattedGregorianDate, getFormattedHijriDate } from "@/lib/date-utils";

// ═══════════════════════════════════════════════════════
// Date Display Component
// ═══════════════════════════════════════════════════════
export function DateDisplay() {
  const { language, showGregorianDate, showHijriDate, hijriOffset } = useI18n();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-end me-2 text-[11px] font-bold text-muted-foreground/80 leading-tight">
      {mounted && showGregorianDate && (
        <div className="whitespace-nowrap uppercase tracking-tighter">
          {getFormattedGregorianDate(language)}
        </div>
      )}
      {mounted && showHijriDate && (
        <div className="whitespace-nowrap uppercase tracking-tighter text-primary/80">
          {getFormattedHijriDate(language, hijriOffset)}
        </div>
      )}
    </div>
  );
}
