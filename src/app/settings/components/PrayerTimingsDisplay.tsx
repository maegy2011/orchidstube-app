"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrayerTimings } from "@/lib/prayer-times-context";

interface PrayerTimingsDisplayProps {
  timings: PrayerTimings;
  prayerOffsets: Record<string, number>;
  onAdjustOffset: (prayer: string, delta: number) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  t: (key: string) => string;
}

const PRAYER_NAMES: { key: keyof PrayerTimings; icon: string }[] = [
  { key: 'Fajr', icon: '🌅' },
  { key: 'Sunrise', icon: '☀️' },
  { key: 'Dhuhr', icon: '🕐' },
  { key: 'Asr', icon: '🌥️' },
  { key: 'Sunset', icon: '🌅' },
  { key: 'Maghrib', icon: '🌇' },
  { key: 'Isha', icon: '🌙' },
];

export default function PrayerTimingsDisplay({
  timings,
  prayerOffsets,
  onAdjustOffset,
  onRefresh,
  isLoading,
  t,
}: PrayerTimingsDisplayProps) {
  const [showOffsets, setShowOffsets] = useState(false);

  return (
    <>
      {/* Prayer times display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            {t('prayerTimes')}
          </h4>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", isLoading && "animate-spin")} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRAYER_NAMES.map(({ key, icon }) => {
            const offset = prayerOffsets[key] || 0;
            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors",
                  offset !== 0
                    ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
                    : "bg-muted/30 border-border"
                )}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t(key.toLowerCase())}
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {timings[key] || '--:--'}
                </span>
                {offset !== 0 && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    {offset > 0 ? '+' : ''}{offset}m
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offset adjustments */}
      <div className="space-y-3">
        <button
          onClick={() => setShowOffsets(!showOffsets)}
          className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", showOffsets && "rotate-180")} />
          {t('adjustPrayerTimes') || 'Adjust prayer times (±minutes)'}
        </button>

        <AnimatePresence>
          {showOffsets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <div
                  key={prayer}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                >
                  <span className="text-xs font-medium w-20">
                    {t(prayer.toLowerCase())}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAdjustOffset(prayer, -5)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => onAdjustOffset(prayer, -1)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      -1
                    </button>
                    <span className="w-12 text-center text-xs font-bold tabular-nums">
                      {(prayerOffsets[prayer] || 0) > 0 ? '+' : ''}{prayerOffsets[prayer] || 0}
                    </span>
                    <button
                      onClick={() => onAdjustOffset(prayer, 1)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onAdjustOffset(prayer, 5)}
                      className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      +5
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
