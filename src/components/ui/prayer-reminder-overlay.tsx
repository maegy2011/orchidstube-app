"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock, X, Quote, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";

export default function PrayerReminderOverlay() {
  const { t, direction } = useI18n();
  const { isPrayerTime, dismissReminder, currentPrayer } = usePrayer();
  const [countdown, setCountdown] = useState(10);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (isPrayerTime) {
      setCountdown(10);
      setCanDismiss(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanDismiss(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPrayerTime]);

  if (!isPrayerTime) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative max-w-2xl w-full bg-card border-2 border-emerald-500/30 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Decorative backgrounds */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(16,185,129,0.3),transparent_70%)]" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.2),transparent_70%)]" />
          </div>

          <div className="relative p-8 sm:p-12 flex flex-col items-center text-center gap-8">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/20"
            >
              <Bell className="w-12 h-12 text-emerald-500" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {t('prayerReminder')}
              </h2>
                {currentPrayer && (
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {t(currentPrayer.name.toLowerCase() as any)}
                  </p>
                )}
            </div>

            <div className="space-y-8 w-full">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-muted/50 p-6 rounded-3xl border border-border relative group"
              >
                <Quote className="absolute -top-3 -left-3 w-8 h-8 text-emerald-500/30" />
                <p className="text-lg font-medium leading-relaxed italic text-foreground">
                  {t('prayerVirtueHadith')}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 relative"
              >
                <p className="text-lg font-bold leading-relaxed text-emerald-800 dark:text-emerald-200">
                  {t('prayerVirtueVerse')}
                </p>
              </motion.div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              <button
                disabled={!canDismiss}
                onClick={dismissReminder}
                className={`
                  w-full sm:w-auto px-12 py-4 rounded-2xl font-black text-lg transition-all duration-300 active:scale-95
                  ${canDismiss 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/40 cursor-pointer' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'}
                `}
              >
                {canDismiss ? t('dismiss') : t('waitTenSeconds').replace('{seconds}', countdown.toString())}
              </button>
              
              {!canDismiss && (
                <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
