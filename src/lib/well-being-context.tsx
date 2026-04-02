"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { toast } from "sonner";
import { useI18n } from './i18n-context';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUser } from '@/hooks/use-user';

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

export function WellBeingProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { isAuthenticated } = useUser();
  const [dailyWatchTime, setDailyWatchTime] = useState(0);
  const [dailyShortsCount, setDailyShortsCount] = useState(0);
  const [continuousWatchTime, setContinuousWatchTime] = useState(0);
  const [limits, setLimitsState] = useState<WellBeingLimits>(DEFAULT_LIMITS);
  const [isReady, setIsReady] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const lastTrackedMinuteRef = useRef(new Date().getMinutes());
  const pinHashRef = useRef<string | null>(null);

  const { settings, isLoaded: settingsLoaded, setSetting, saveSettings } = useUserSettings();

  // ─── 1. Load limit settings from user preferences ───
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.wbDailyTimeLimit) setLimitsState(prev => ({ ...prev, dailyTimeLimit: parseInt(settings.wbDailyTimeLimit) }));
    if (settings.wbShortsDailyLimit) setLimitsState(prev => ({ ...prev, shortsDailyLimit: parseInt(settings.wbShortsDailyLimit) }));
    if (settings.wbBreakInterval) setLimitsState(prev => ({ ...prev, breakInterval: parseInt(settings.wbBreakInterval) }));
    if (settings.wbBedtimeStart) setLimitsState(prev => ({ ...prev, bedtimeStart: settings.wbBedtimeStart }));
    if (settings.wbBedtimeEnd) setLimitsState(prev => ({ ...prev, bedtimeEnd: settings.wbBedtimeEnd }));
    if (settings.wbBedtimeEnabled !== undefined) setLimitsState(prev => ({ ...prev, bedtimeEnabled: settings.wbBedtimeEnabled === 'true' }));
  }, [settingsLoaded, settings]);

  // ─── 2. Restore daily shorts count ───
  useEffect(() => {
    if (!settingsLoaded) return;
    const todayKey = getTodayKey();

    if (isAuthenticated) {
      // Authenticated: restore from userSettings (stored as JSON)
      try {
        const raw = settings['wb-daily-shorts-temp'];
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.date === todayKey && typeof parsed.count === 'number') {
            setDailyShortsCount(parsed.count);
            return;
          }
        }
      } catch {}
      // Expired or missing — reset to 0 and persist
      const resetPayload = JSON.stringify({ date: todayKey, count: 0 });
      setSetting('wb-daily-shorts-temp', resetPayload);
    } else {
      // Unauthenticated: restore from localStorage
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
  }, [settingsLoaded, isAuthenticated, settings, setSetting]);

  // ─── 3. Restore daily watch time ───
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
            return;
          }
        }
      } catch {}
      const resetPayload = JSON.stringify({ date: todayKey, minutes: 0 });
      setSetting('wb-daily-time', resetPayload);
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
  }, [settingsLoaded, isAuthenticated, settings, setSetting]);

  // ─── 4. Restore parental PIN ───
  useEffect(() => {
    if (!settingsLoaded) return;

    if (isAuthenticated) {
      // Authenticated: load from userSettings
      const hash = settings.parentalPinHash;
      if (hash) {
        pinHashRef.current = hash;
        setHasPinSet(true);
      } else {
        pinHashRef.current = null;
        setHasPinSet(false);
      }
    } else {
      // Unauthenticated: load from localStorage
      try {
        const hash = localStorage.getItem(LS_PIN_KEY);
        pinHashRef.current = hash;
        setHasPinSet(!!hash);
      } catch {
        pinHashRef.current = null;
        setHasPinSet(false);
      }
    }
  }, [settingsLoaded, isAuthenticated, settings]);

  // ─── 5. Mark ready after restore + short delay ───
  useEffect(() => {
    if (!settingsLoaded) return;
    const t = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(t);
  }, [settingsLoaded]);

  // ─── 6. Midnight auto-reset (checks once per minute) ───
  useEffect(() => {
    let lastDay = getTodayKey();
    const interval = setInterval(() => {
      const today = getTodayKey();
      if (today !== lastDay) {
        lastDay = today;
        setDailyShortsCount(0);
        setDailyWatchTime(0);

        if (isAuthenticated) {
          const shortsReset = JSON.stringify({ date: today, count: 0 });
          const timeReset = JSON.stringify({ date: today, minutes: 0 });
          setSetting('wb-daily-shorts-temp', shortsReset);
          setSetting('wb-daily-time', timeReset);
        } else {
          try {
            localStorage.setItem(LS_DAILY_SHORTS, JSON.stringify({ date: today, count: 0 }));
            localStorage.setItem(LS_DAILY_TIME, JSON.stringify({ date: today, minutes: 0 }));
          } catch {}
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setSetting]);

  // ─── 7. Track watch time (every 10 seconds, increments minute counter) ───
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastTrackedMinuteRef.current) {
        lastTrackedMinuteRef.current = now.getMinutes();
        setDailyWatchTime(prev => {
          const newVal = prev + 1;

          if (isAuthenticated) {
            const payload = JSON.stringify({ date: getTodayKey(), minutes: newVal });
            setSetting('wb-daily-time', payload);
          } else {
            try {
              localStorage.setItem(LS_DAILY_TIME, JSON.stringify({ date: getTodayKey(), minutes: newVal }));
            } catch {}
          }

          return newVal;
        });
        setContinuousWatchTime(prev => prev + 1);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setSetting]);

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
    setDailyShortsCount(prev => {
      const newVal = prev + 1;

      if (isAuthenticated) {
        const payload = JSON.stringify({ date: getTodayKey(), count: newVal });
        setSetting('wb-daily-shorts-temp', payload);
      } else {
        try {
          localStorage.setItem(LS_DAILY_SHORTS, JSON.stringify({ date: getTodayKey(), count: newVal }));
        } catch {}
      }

      return newVal;
    });
  }, [isAuthenticated, setSetting]);

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
