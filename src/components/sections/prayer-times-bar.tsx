"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { MinaretIcon } from "@/components/ui/minaret-icon";

export default function PrayerTimesBar() {
  const { t, direction } = useI18n();
  const { prayerEnabled, nextPrayer, currentPrayer, prayerCity, timings } = usePrayer();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prayerEnabled && (nextPrayer || currentPrayer)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [prayerEnabled, nextPrayer, currentPrayer]);

  if (!isVisible || !nextPrayer || !timings) return null;

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isRTL = direction === 'rtl';

  // Check if we should show "Elapsed" (within 15 minutes of current prayer)
  const isElapsedMode = currentPrayer && currentPrayer.elapsedMs < 15 * 60 * 1000;
  
  const prayerName = isElapsedMode ? currentPrayer.name : nextPrayer.name;
  const prayerLabel = t(prayerName.toLowerCase() as any);
  const prayerTime = timings[prayerName];

  const timeInfo = isElapsedMode 
    ? `${t('elapsed')}: ${Math.floor(currentPrayer.elapsedMs / 60000)} ${t('minutes')}` 
    : `${t('remaining')}: ${formatMs(nextPrayer.remainingMs)}`;

  const displayLabel = isElapsedMode 
    ? `${prayerLabel} (${prayerTime})` 
    : `${t('nextPrayer') || 'Next'}: ${prayerLabel} (${prayerTime})`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 w-full h-[40px] sm:h-[36px] overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-blue-50 z-[6001] border-b border-blue-500/20 shadow-lg flex items-center"
      >
        <div className="w-full px-4 relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-blue-400/20 p-1 rounded-lg border border-blue-400/30 shrink-0"
            >
              <MinaretIcon className="w-4 h-4 text-blue-300" />
            </motion.div>
            
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="font-bold text-sm sm:text-base tracking-tight text-blue-100">
                {displayLabel}
              </span>
              <span className="h-4 w-[1px] bg-blue-500/30 hidden sm:block" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] sm:text-xs font-bold text-blue-200">
                  {timeInfo}
                </span>
                <span className="hidden sm:inline-block text-[10px] text-blue-400 font-medium">
                   ({prayerCity})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-blue-300/80 uppercase tracking-widest">
              <Bell size={12} className="animate-bounce" />
              {t('prayerTimes')}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
