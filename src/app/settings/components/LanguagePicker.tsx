"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, Check, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import {
  isLanguageManuallySet,
  getAutoDetectedLanguage,
} from "@/lib/language-detect";
import type { LanguageCode, TranslationKeys } from "@/lib/translations";

interface LanguagePickerProps {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}

const LANGUAGES: {
  code: LanguageCode;
  flag: string;
  native: string;
  english: string;
  isRTL: boolean;
}[] = [
  { code: "ar", flag: "🇸🇦", native: "العربية", english: "Arabic", isRTL: true },
  { code: "en", flag: "🇺🇸", native: "English", english: "English", isRTL: false },
  { code: "fr", flag: "🇫🇷", native: "Français", english: "French", isRTL: false },
  { code: "es", flag: "🇪🇸", native: "Español", english: "Spanish", isRTL: false },
  { code: "zh", flag: "🇨🇳", native: "简体中文", english: "Chinese", isRTL: false },
  { code: "ja", flag: "🇯🇵", native: "日本語", english: "Japanese", isRTL: false },
  { code: "it", flag: "🇮🇹", native: "Italiano", english: "Italian", isRTL: false },
  { code: "de", flag: "🇩🇪", native: "Deutsch", english: "German", isRTL: false },
  { code: "pt", flag: "🇵🇹", native: "Português", english: "Portuguese", isRTL: false },
  { code: "tr", flag: "🇹🇷", native: "Türkçe", english: "Turkish", isRTL: false },
];

// ═══════════════════════════════════════════════════════
// Individual language card
// ═══════════════════════════════════════════════════════
const LanguageCard = React.memo(function LanguageCard({
  lang,
  active,
  isAutoDetected,
  isManuallySet,
  onClick,
  autoDetectedLabel,
  manuallySetLabel,
}: {
  lang: (typeof LANGUAGES)[number];
  active: boolean;
  isAutoDetected: boolean;
  isManuallySet: boolean;
  onClick: () => void;
  autoDetectedLabel: string;
  manuallySetLabel: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer group",
        active
          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
          : "border-transparent hover:border-border hover:bg-muted/40"
      )}
      aria-pressed={active}
    >
      {/* Active check indicator */}
      {active && (
        <motion.div
          layoutId="language-picker-active"
          className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm z-10"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Check size={12} className="text-primary-foreground" />
        </motion.div>
      )}

      {/* Flag emoji */}
      <span className="text-3xl leading-none select-none drop-shadow-sm">{lang.flag}</span>

      {/* Native name */}
      <span
        className={cn(
          "text-sm font-semibold leading-tight text-center transition-colors line-clamp-1 w-full",
          active
            ? "text-foreground"
            : "text-foreground/80 group-hover:text-foreground"
        )}
        dir={lang.isRTL ? "rtl" : "ltr"}
      >
        {lang.native}
      </span>

      {/* English name */}
      <span className="text-[11px] text-muted-foreground text-center leading-tight">
        {lang.english}
      </span>

      {/* RTL badge */}
      {lang.isRTL && (
        <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20">
          RTL
        </span>
      )}

      {/* Auto-detected indicator — show on the auto-detected card when not active */}
      {!active && isAutoDetected && !isManuallySet && (
        <span
          className="absolute top-1.5 end-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30"
          title={autoDetectedLabel}
        >
          <MapPin size={8} />
          {autoDetectedLabel}
        </span>
      )}
    </motion.button>
  );
});

// ═══════════════════════════════════════════════════════
// Main exported component
// ═══════════════════════════════════════════════════════
export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const { t } = useI18n();
  const [autoDetected, setAutoDetected] = useState<LanguageCode | null>(null);
  const [manuallySet, setManuallySet] = useState(false);

  useEffect(() => {
    // Determine auto-detected language and manual-set status
    try {
      setManuallySet(isLanguageManuallySet());
      if (!isLanguageManuallySet()) {
        const detected = getAutoDetectedLanguage();
        setAutoDetected(detected);
      }
    } catch {}
  }, [value]);

  return (
    <div className="p-6 border-b border-border">
      <div className="flex flex-col gap-5">
        {/* Section Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl mt-0.5">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{t("language" as TranslationKeys)}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("languageDesc" as TranslationKeys)}
            </p>
            {/* Detection status indicator */}
            <div className="flex items-center gap-1.5 mt-2">
              {manuallySet ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                  <Check size={10} />
                  {t("languageManuallySet" as TranslationKeys)}
                </span>
              ) : autoDetected && autoDetected === value ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                  <MapPin size={10} />
                  {t("languageAutoDetected" as TranslationKeys)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Language Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.code}
              lang={lang}
              active={value === lang.code}
              isAutoDetected={autoDetected === lang.code}
              isManuallySet={manuallySet}
              onClick={() => onChange(lang.code)}
              autoDetectedLabel={t("languageAutoDetected" as TranslationKeys)}
              manuallySetLabel={t("languageManuallySet" as TranslationKeys)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
