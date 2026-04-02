"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Clock, EyeOff, CheckCircle2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useUser } from "@/hooks/use-user";

const REMINDER_INTERVAL = 20 * 60 * 1000; // 20 minutes
const LONG_SESSION_THRESHOLD = 60 * 60 * 1000; // 1 hour
const LS_KEY = "lastEyeModalShown";

export function EyeProtectionReminder() {
  const { t } = useI18n();
  const { isAuthenticated } = useUser();
  const { settings, isLoaded: settingsLoaded, setSetting } = useUserSettings();
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [showCard, setShowCard] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState<number>(Date.now());

  const showToast = useCallback(() => {
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;pointer-events:none;";

    const el = document.createElement("div");
    el.style.cssText =
      "pointer-events:auto;display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:14px;background:var(--background);border:1px solid var(--border);box-shadow:0 8px 30px rgba(0,0,0,0.12);backdrop-filter:blur(12px);font-family:inherit;max-width:320px;";

    el.innerHTML = `
      <div style="background:#dcfce7;dark:bg:rgba(6,78,59,0.3);padding:6px;border-radius:10px;flex-shrink:0;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;color:var(--foreground);">${t("restYourEyes")}</div>
        <div style="font-size:11px;color:var(--muted-foreground);margin-top:2px;">${t("rule202020")}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="padding:4px;border-radius:8px;border:none;background:transparent;cursor:pointer;color:var(--muted-foreground);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(el);
    document.body.appendChild(container);

    requestAnimationFrame(() => {
      el.style.transition = "all 0.3s cubic-bezier(0.4,0,0.2,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      setTimeout(() => container.remove(), 300);
    }, 8000);
  }, [t]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const sessionDuration = now - sessionStartTime;
      const timeSinceLastReminder = now - lastReminderTime;

      if (timeSinceLastReminder >= REMINDER_INTERVAL) {
        showToast();
        setLastReminderTime(now);
      }

      // Show compact card for long sessions (once per day)
      try {
        const today = new Date().toDateString();

        // Get last shown date from userSettings (auth) or localStorage (unauth)
        let lastShownDate: string | null = null;
        if (isAuthenticated && settingsLoaded) {
          lastShownDate = settings.lastEyeModalShown || null;
        } else {
          lastShownDate = localStorage.getItem(LS_KEY);
        }

        if (sessionDuration >= LONG_SESSION_THRESHOLD && lastShownDate !== today) {
          setShowCard(true);

          if (isAuthenticated) {
            setSetting('lastEyeModalShown', today);
          } else {
            localStorage.setItem(LS_KEY, today);
          }
        }
      } catch {}
    }, 60000);

    return () => clearInterval(interval);
  }, [sessionStartTime, lastReminderTime, showToast, isAuthenticated, settingsLoaded, settings, setSetting]);

  return (
    <AnimatePresence>
      {showCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-[300px] rounded-2xl overflow-hidden shadow-2xl bg-background border border-border/60"
          >
            {/* ─── Header ─── */}
            <div className="relative px-4 pt-4 pb-2.5">
              <button
                onClick={() => setShowCard(false)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground leading-tight truncate">
                    {t("eyeReminderTitle")}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {t("eyeReminderDesc")}
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Rule Steps ─── */}
            <div className="px-4 pb-3">
              <div className="space-y-1.5">
                <RuleStep
                  step="1"
                  icon={<Clock className="w-3 h-3" />}
                  color="bg-blue-500"
                  title={t("every20Minutes")}
                  desc={t("every20MinutesDesc")}
                />
                <RuleStep
                  step="2"
                  icon={<Eye className="w-3 h-3" />}
                  color="bg-indigo-500"
                  title={t("look20Feet")}
                  desc={t("look20FeetDesc")}
                />
                <RuleStep
                  step="3"
                  icon={<CheckCircle2 className="w-3 h-3" />}
                  color="bg-purple-500"
                  title={t("for20Seconds")}
                  desc={t("for20SecondsDesc")}
                />
              </div>

              {/* Action button */}
              <button
                onClick={() => setShowCard(false)}
                className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-blue-500/20"
              >
                {t("iWillTakeCare")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Tiny Rule Step ───
const RuleStep = React.memo(function RuleStep({
  step,
  icon,
  color,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-2.5">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-bold text-muted-foreground">{step}</span>
        <div className={`${color} p-1 rounded-md`}>
          {icon}
        </div>
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-[11px] text-foreground leading-tight">{title}</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
});
