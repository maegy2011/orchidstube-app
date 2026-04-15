"use client";

import { Calendar, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { toast } from "sonner";
import SettingsToggle from "./SettingsToggle";

interface DateSettingsProps {
  showGregorian: boolean;
  setShowGregorian: (v: boolean) => void;
  showHijri: boolean;
  setShowHijri: (v: boolean) => void;
  showRamadan: boolean;
  setShowRamadan: (v: boolean) => void;
  hijriOffset: number;
  setHijriOffset: (v: number) => void;
  isRTL: boolean;
}

export default function DateSettingsSection({
  showGregorian,
  setShowGregorian,
  showHijri,
  setShowHijri,
  showRamadan,
  setShowRamadan,
  hijriOffset,
  setHijriOffset,
  isRTL,
}: DateSettingsProps) {
  const { t } = useI18n();

  const handleToggleGregorian = () => {
    if (showGregorian && !showHijri) {
      toast.error(t('atLeastOneDateEnabled'));
      return;
    }
    setShowGregorian(!showGregorian);
  };

  const handleToggleHijri = () => {
    if (showHijri && !showGregorian) {
      toast.error(t('atLeastOneDateEnabled'));
      return;
    }
    setShowHijri(!showHijri);
  };

  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{t('dateSettings')}</h3>
            <p className="text-sm text-muted-foreground">{t('hijriOffsetDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <span className="text-sm font-medium">{t('showGregorian')}</span>
            <SettingsToggle
              enabled={showGregorian}
              onToggle={handleToggleGregorian}
              isRTL={isRTL}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <span className="text-sm font-medium">{t('showHijri')}</span>
            <SettingsToggle
              enabled={showHijri}
              onToggle={handleToggleHijri}
              isRTL={isRTL}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{t('showRamadanCountdown')}</span>
            </div>
            <SettingsToggle
              enabled={showRamadan}
              onToggle={() => setShowRamadan(!showRamadan)}
              isRTL={isRTL}
              activeColor="bg-emerald-600"
              ringColor="focus:ring-emerald-500"
            />
          </div>

          <div className="col-span-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="space-y-1">
              <span className="text-sm font-medium">{t('hijriOffset')}</span>
              <p className="text-xs text-muted-foreground">{t('hijriOffsetDesc')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHijriOffset(Math.max(-2, hijriOffset - 1))}
                className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-muted transition-colors font-bold text-lg disabled:opacity-50"
                disabled={hijriOffset <= -2}
              >
                -
              </button>
              <div className="w-16 h-10 flex items-center justify-center bg-card border border-border rounded-lg font-bold">
                {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset}
              </div>
              <button
                onClick={() => setHijriOffset(Math.min(2, hijriOffset + 1))}
                className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-muted transition-colors font-bold text-lg disabled:opacity-50"
                disabled={hijriOffset >= 2}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
