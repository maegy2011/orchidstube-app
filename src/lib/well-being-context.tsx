"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from './i18n-context';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUser } from '@/hooks/use-user';
import { useIncognito } from './incognito-context';

export interface WellBeingLimits {
  dailyTimeLimit: number; // minutes, 0 means no limit
  shortsDailyLimit: number; // count, 0 means no limit
  breakInterval: number; // minutes, 0 means no limit
  bedtimeStart: string; // HH:mm
  bedtimeEnd: string; // HH:mm
  bedtimeEnabled: boolean;
}

interface WellBeingContextType {
  dailyWatchTime: number;
  dailyShortsCount: number;
  continuousWatchTime: number;
  isBedtime: boolean;
  limits: WellBeingLimits;
  setLimits: (limits: WellBeingLimits) => void;
  incrementShortsCount: () => void;
  resetContinuousTime: () => void;
  isLimitReached: boolean;
  isShortsLimitReached: boolean;
  /** True once settings are loaded AND daily counters are restored */
  isReady: boolean;
  /** Whether a parental PIN has been set */
  hasPinSet: boolean;
  /** Set a new parental PIN (hashes and stores it) */
  setParentalPin: (pin: string) => Promise<void>;
  /** Verify a PIN against the stored hash */
  verifyParentalPin: (pin: string) => Promise<boolean>;
  /** Remove the parental PIN */
  removeParentalPin: () => void;
}

const DEFAULT_LIMITS: WellBeingLimits = {
  dailyTimeLimit: 120,
  shortsDailyLimit: 20,
  breakInterval: 30,
  bedtimeStart: "21:00",
  bedtimeEnd: "07:00",
  bedtimeEnabled: false,
};

const WellBeingContext = createContext<WellBeingContextType | undefined>(undefined);

/** Get today's date string in YYYY-MM-DD format (local timezone) */
function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Hash a PIN using SHA-256 */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// localStorage keys (fallback for unauthenticated users only)
const LS_DAILY_SHORTS = 'wb-daily-shorts-temp';
const LS_DAILY_TIME = 'wb-daily-time';
const LS_PIN_KEY = 'orchids-parental-pin-hash';

/** How often (ms) to sync watch-time counters to the server */
const SERVER_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function WellBeingProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isAuthenticated } = useUser();
  const { isIncognito } = useIncognito();
  const [dailyWatchTime, setDailyWatchTime] = useState(0);
  const [dailyShortsCount, setDailyShortsCount] = useState(0);
  const [continuousWatchTime, setContinuousWatchTime] = useState(0);
  const [limits, setLimitsState] = useState<WellBeingLimits>(DEFAULT_LIMITS);
  const [isReady, setIsReady] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const lastTrackedMinuteRef = useRef(new Date().getMinutes());
  const pinHashRef = useRef<string | null>(null);

  const { settings, isLoaded: settingsLoaded, setSetting, saveSettings } = useUserSettings();

  // ─── Refs for dirty-tracking (avoid unnecessary server writes) ───
  const dirtyShortsRef = useRef(false);
  const dirtyTimeRef = useRef(false);
  const shortsValueRef = useRef('');
  const timeValueRef = useRef('');
  const lastSyncRef = useRef(Date.now());

  /** Flush dirty counters to server — only if values actually changed */
  const syncToServer = useCallback(() => {
    if (!isAuthenticated) return;
    const toSend: Record<string, string> = {};
    if (dirtyShortsRef.current && shortsValueRef.current) {
      toSend['wb-daily-shorts-temp'] = shortsValueRef.current;
      dirtyShortsRef.current = false;
    }
    if (dirtyTimeRef.current && timeValueRef.current) {
      toSend['wb-daily-time'] = timeValueRef.current;
      dirtyTimeRef.current = false;
    }
    if (Object.keys(toSend).length > 0) {
      fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: toSend }),
      }).catch(() => {});
    }
    lastSyncRef.current = Date.now();
  }, [isAuthenticated]);

  // ─── 1. Load limit settings from user preferences ───
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.wbDailyTimeLimit) setLimitsState(prev => ({ ...prev, dailyTimeLimit: parseInt(settings.wbDailyTimeLimit) }));
    if (settings.wbShortsDailyLimit) setLimitsState(prev => ({ ...prev, shortsDailyLimit: parseInt(settings.wbShortsDailyLimit) }));
    if (settings.wbBreakInterval) setLimitsState(prev => ({ ...prev, breakInterval: parseInt(settings.wbBreakInterval) }));
    if (settings.wbBedtimeStart) setLimitsState(prev => ({ ...prev, bedtimeStart: settings.wbBedtimeStart }));
    if (settings.wbBedtimeEnd) setLimitsState(prev => ({ ...prev, bedtimeEnd: settings.wbBedtimeEnd }));
    if (settings.wbBedtimeEnabled !== undefined) setLimitsState(prev => ({ ...prev, bedtimeEnabled: settings.wbBedtimeEnabled === 'true' }));
  }, [settingsLoaded]);

  // ─── 2. Restore daily shorts count (runs ONCE) ───
  useEffect(() => {
    if (!settingsLoaded) return;
    const todayKey = getTodayKey();

    if (isAuthenticated) {
      try {
        const raw = settings['wb-daily-shorts-temp'];
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.date === todayKey && typeof parsed.count === 'number') {
            setDailyShortsCount(parsed.count);
            shortsValueRef.current = raw;
            return;
          }
        }
      } catch {}
      // Expired or missing — reset to 0
      const resetPayload = JSON.stringify({ date: todayKey, count: 0 });
      shortsValueRef.current = resetPayload;
      setDailyShortsCount(0);
      // Mark dirty so it syncs on the next cycle (not immediately)
      dirtyShortsRef.current = true;
    } else {
      try {
        const shortsData = localStorage.getItem(LS_DAILY_SHORTS);
        if (shortsData) {
          const parsed = JSON.parse(shortsData);
          if (parsed.date === todayKey && typeof parsed.count === 'number') {
            setDailyShortsCount(parsed.count);
            return;
          }
        }
      } catch {}
      try { localStorage.setItem(LS_DAILY_SHORTS, JSON.stringify({ date: todayKey, count: 0 })); } catch {}
    }
  }, [settingsLoaded, isAuthenticated]);

  // ─── 3. Restore daily watch time (runs ONCE) ───
  useEffect(() => {
    if (!settingsLoaded) return;
    const todayKey = getTodayKey();

    if (isAuthenticated) {
      try {
        const raw = settings['wb-daily-time'];
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.date === todayKey && typeof parsed.minutes === 'number') {
            setDailyWatchTime(parsed.minutes);
            timeValueRef.current = raw;
            return;
          }
        }
      } catch {}
      // Expired or missing — reset to 0
      const resetPayload = JSON.stringify({ date: todayKey, minutes: 0 });
      timeValueRef.current = resetPayload;
      setDailyWatchTime(0);
      dirtyTimeRef.current = true;
    } else {
      try {
        const timeData = localStorage.getItem(LS_DAILY_TIME);
        if (timeData) {
          const parsed = JSON.parse(timeData);
          if (parsed.date === todayKey && typeof parsed.minutes === 'number') {
            setDailyWatchTime(parsed.minutes);
            return;
          }
        }
      } catch {}
      try { localStorage.setItem(LS_DAILY_TIME, JSON.stringify({ date: todayKey, minutes: 0 })); } catch {}
    }
  }, [settingsLoaded, isAuthenticated]);

  // ─── 4. Restore parental PIN (runs ONCE) ───
  useEffect(() => {
    if (!settingsLoaded) return;

    if (isAuthenticated) {
      const hash = settings.parentalPinHash;
      if (hash) {
        pinHashRef.current = hash;
        setHasPinSet(true);
      } else {
        pinHashRef.current = null;
        setHasPinSet(false);
      }
    } else {
      try {
        const hash = localStorage.getItem(LS_PIN_KEY);
        pinHashRef.current = hash;
        setHasPinSet(!!hash);
      } catch {
        pinHashRef.current = null;
        setHasPinSet(false);
      }
    }
  }, [settingsLoaded, isAuthenticated]);

  // ─── 5. Mark ready after restore + short delay ───
  useEffect(() => {
    if (!settingsLoaded) return;
    const t = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(t);
  }, [settingsLoaded]);

  // ─── 6. Periodic server sync (every 5 minutes) ───
  useEffect(() => {
    const interval = setInterval(syncToServer, SERVER_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [syncToServer]);

  // ─── 7. Sync on tab close / visibility change ───
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        syncToServer();
      }
    };
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable fire-and-forget
      if (!isAuthenticated) return;
      const toSend: Record<string, string> = {};
      if (dirtyShortsRef.current && shortsValueRef.current) {
        toSend['wb-daily-shorts-temp'] = shortsValueRef.current;
      }
      if (dirtyTimeRef.current && timeValueRef.current) {
        toSend['wb-daily-time'] = timeValueRef.current;
      }
      if (Object.keys(toSend).length > 0) {
        navigator.sendBeacon('/api/user-settings', JSON.stringify({ settings: toSend }));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated]);

  // ─── 8. Midnight auto-reset (checks once per minute) ───
  useEffect(() => {
    let lastDay = getTodayKey();
    const interval = setInterval(() => {
      const today = getTodayKey();
      if (today !== lastDay) {
        lastDay = today;
        setDailyShortsCount(0);
        setDailyWatchTime(0);

        const shortsReset = JSON.stringify({ date: today, count: 0 });
        const timeReset = JSON.stringify({ date: today, minutes: 0 });
        shortsValueRef.current = shortsReset;
        timeValueRef.current = timeReset;

        if (isAuthenticated) {
          dirtyShortsRef.current = true;
          dirtyTimeRef.current = true;
          syncToServer(); // Immediate sync for midnight reset
        } else {
          try {
            localStorage.setItem(LS_DAILY_SHORTS, shortsReset);
            localStorage.setItem(LS_DAILY_TIME, timeReset);
          } catch {}
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, syncToServer]);

  // ─── 9. Track watch time locally every minute (NO server call) ───
  useEffect(() => {
    if (isIncognito) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastTrackedMinuteRef.current) {
        lastTrackedMinuteRef.current = now.getMinutes();
        setDailyWatchTime(prev => {
          const newVal = prev + 1;
          const payload = JSON.stringify({ date: getTodayKey(), minutes: newVal });
          timeValueRef.current = payload;
          dirtyTimeRef.current = true;

          if (!isAuthenticated) {
            try { localStorage.setItem(LS_DAILY_TIME, payload); } catch {}
          }
          // DO NOT call setSetting here — synced by periodic sync (every 5 min)
          return newVal;
        });
        setContinuousWatchTime(prev => prev + 1);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isIncognito]);

  const setLimits = (newLimits: WellBeingLimits) => {
    setLimitsState(newLimits);
    saveSettings({
      wbDailyTimeLimit: String(newLimits.dailyTimeLimit),
      wbShortsDailyLimit: String(newLimits.shortsDailyLimit),
      wbBreakInterval: String(newLimits.breakInterval),
      wbBedtimeStart: newLimits.bedtimeStart,
      wbBedtimeEnd: newLimits.bedtimeEnd,
      wbBedtimeEnabled: String(newLimits.bedtimeEnabled),
    });
  };

  const incrementShortsCount = useCallback(() => {
    if (isIncognito) return;
    setDailyShortsCount(prev => {
      const newVal = prev + 1;
      const payload = JSON.stringify({ date: getTodayKey(), count: newVal });
      shortsValueRef.current = payload;
      dirtyShortsRef.current = true;

      if (isAuthenticated) {
        // Sync shorts count immediately (user action, not background)
        fetch('/api/user-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { 'wb-daily-shorts-temp': payload } }),
        }).catch(() => {});
        dirtyShortsRef.current = false;
      } else {
        try { localStorage.setItem(LS_DAILY_SHORTS, payload); } catch {}
      }

      return newVal;
    });
  }, [isAuthenticated, isIncognito]);

  const resetContinuousTime = useCallback(() => {
    setContinuousWatchTime(0);
  }, []);

  const setParentalPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    pinHashRef.current = hash;
    setHasPinSet(true);

    if (isAuthenticated) {
      setSetting('parentalPinHash', hash);
    } else {
      try { localStorage.setItem(LS_PIN_KEY, hash); } catch {}
    }
  }, [isAuthenticated, setSetting]);

  const verifyParentalPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = pinHashRef.current;
    if (!storedHash) return false;
    const hash = await hashPin(pin);
    return hash === storedHash;
  }, []);

  const removeParentalPin = useCallback(() => {
    pinHashRef.current = null;
    setHasPinSet(false);

    if (isAuthenticated) {
      setSetting('parentalPinHash', '');
    } else {
      try { localStorage.removeItem(LS_PIN_KEY); } catch {}
    }
  }, [isAuthenticated, setSetting]);

  const [isBedtime, setIsBedtime] = useState(false);

  useEffect(() => {
    const checkBedtime = () => {
      if (!limits.bedtimeEnabled) { setIsBedtime(false); return; }
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [sH, sM] = limits.bedtimeStart.split(':').map(Number);
      const [eH, eM] = limits.bedtimeEnd.split(':').map(Number);
      const startTime = sH * 60 + sM;
      const endTime = eH * 60 + eM;
      if (startTime > endTime) {
        setIsBedtime(currentTime >= startTime || currentTime < endTime);
      } else {
        setIsBedtime(currentTime >= startTime && currentTime < endTime);
      }
    };
    checkBedtime();
    const interval = setInterval(checkBedtime, 60000);
    return () => clearInterval(interval);
  }, [limits.bedtimeEnabled, limits.bedtimeStart, limits.bedtimeEnd]);

  const isLimitReached = limits.dailyTimeLimit > 0 && dailyWatchTime >= limits.dailyTimeLimit;
  const isShortsLimitReached = limits.shortsDailyLimit > 0 && dailyShortsCount >= limits.shortsDailyLimit;

  return (
    <WellBeingContext.Provider value={{
      dailyWatchTime,
      dailyShortsCount,
      continuousWatchTime,
      isBedtime,
      limits,
      setLimits,
      incrementShortsCount,
      resetContinuousTime,
      isLimitReached,
      isShortsLimitReached,
      isReady,
      hasPinSet,
      setParentalPin,
      verifyParentalPin,
      removeParentalPin,
    }}>
      {children}
    </WellBeingContext.Provider>
  );
}

export function useWellBeing() {
  const context = useContext(WellBeingContext);
  if (context === undefined) {
    throw new Error('useWellBeing must be used within a WellBeingProvider');
  }
  return context;
}
