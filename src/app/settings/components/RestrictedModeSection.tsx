"use client";

import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import SettingsToggle from "./SettingsToggle";

interface RestrictedModeSectionProps {
  t: (key: string) => string;
  restrictedMode: boolean;
  setRestrictedMode: (v: boolean) => void;
  isRTL: boolean;
}

export default function RestrictedModeSection({
  t,
  restrictedMode,
  setRestrictedMode,
  isRTL,
}: RestrictedModeSectionProps) {
  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{t('restrictedMode')}</h3>
              {restrictedMode && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[11px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {t('restrictedModeActive')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('restrictedModeDesc')}</p>
          </div>
        </div>
        <SettingsToggle
          enabled={restrictedMode}
          onToggle={() => setRestrictedMode(!restrictedMode)}
          isRTL={isRTL}
        />
      </div>
      
      {/* Filter strength - only shown when restricted mode is on */}
      {restrictedMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-border/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('filterStrength')}</span>
            <div className="flex bg-muted p-1 rounded-xl">
              {[
                { value: "light", label: t('filterStrengthLight') },
                { value: "moderate", label: t('filterStrengthModerate') },
                { value: "strict", label: t('filterStrengthStrict') },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    // Save filter strength - for now store in settings
                    // The content filter will read this
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    true ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
