"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, X } from "lucide-react";
import { IncognitoMaskIcon } from "@/components/icons/incognito-mask";
import { useIncognito } from "@/lib/incognito-context";
import { useI18n } from "@/lib/i18n-context";

/**
 * Incognito Banner — shown below the masthead when incognito mode is active.
 * Displays a semi-transparent banner with the incognito indicator.
 */
export function IncognitoBanner() {
  const { isIncognito, setIncognito } = useIncognito();
  const { t, direction } = useI18n();

  return (
    <AnimatePresence>
      {isIncognito && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
          dir={direction}
        >
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
            <div className="relative flex items-center gap-2">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping opacity-30 scale-150" />
              <IncognitoMaskIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 relative" style={{ '--mask-bg': '#fbbf24' } as React.CSSProperties} />
            </div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 tracking-wide">
              {t("incognitoBanner")}
            </p>
            <button
              onClick={() => setIncognito(false)}
              className="ms-2 p-0.5 rounded-full hover:bg-amber-500/20 transition-colors"
              aria-label={t("incognitoTurnOff")}
            >
              <X size={12} className="text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
