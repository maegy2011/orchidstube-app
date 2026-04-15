"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

interface EyeProtectionProps {
  showModalInitially?: boolean;
}

export function EyeProtection({ showModalInitially = false }: EyeProtectionProps) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(showModalInitially);
  const [lastReminderTime, setLastReminderTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastReminderTime >= 20 * 60 * 1000) {
        showEyeToast();
        setLastReminderTime(now);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastReminderTime]);

  const showEyeToast = () => {
    toast.custom((toastId) => (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background border border-border/60 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs p-3 backdrop-blur-md"
      >
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-xl shrink-0">
          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs text-foreground truncate">
            {t("restYourEyes")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
            {t("rule202020")}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(toastId)}
          className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    ), { duration: 8000 });
  };

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-[300px] rounded-2xl overflow-hidden shadow-2xl bg-background border border-border/60"
          >
            {/* ─── Header ─── */}
            <div className="relative px-4 pt-4 pb-3">
              {/* Dismiss button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground leading-tight truncate">
                    {t("eyeProtectionTitle")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("eyeProtectionSubtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Tip Cards ─── */}
            <div className="px-4 pb-4 space-y-2">
              {/* 20-20-20 Rule */}
              <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-3">
                <div className="bg-blue-100 dark:bg-blue-900/25 p-1.5 rounded-lg shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-foreground">
                    {t("rule202020Title")}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t("rule202020Desc")}
                  </p>
                </div>
              </div>

              {/* Quick Tip */}
              <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-3">
                <div className="bg-amber-100 dark:bg-amber-900/25 p-1.5 rounded-lg shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs text-foreground">
                    {t("quickTipTitle")}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t("quickTipDesc")}
                  </p>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-emerald-500/20"
              >
                {t("gotIt")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
