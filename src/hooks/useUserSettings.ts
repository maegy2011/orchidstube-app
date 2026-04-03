"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/hooks/use-user';

interface UserSettings {
  [key: string]: string;
}

const SETTINGS_STORAGE_KEY = 'orchids-user-settings';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  language: 'ar',
  location: 'مصر',
  restrictedMode: 'false',
  showGregorianDate: 'true',
  showHijriDate: 'true',
  showRamadanCountdown: 'true',
  hijriOffset: '0',
  loadMode: 'auto',
  sidebarMode: 'expanded',
  prayerEnabled: 'false',
  prayerCountry: '',
  prayerCity: '',
  prayerMethod: '4',
  prayerSchool: '0',
  prayerOffsets: '{"Fajr":0,"Dhuhr":0,"Asr":0,"Maghrib":0,"Isha":0}',
  wbDailyTimeLimit: '120',
  wbShortsDailyLimit: '20',
  wbBreakInterval: '30',
  wbBedtimeStart: '21:00',
  wbBedtimeEnd: '07:00',
  wbBedtimeEnabled: 'false',
};

/** Load settings from localStorage (for unauthenticated users) */
function loadLocalSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

/** Save settings to localStorage (for unauthenticated users) */
function saveLocalSettings(settings: UserSettings) {
  try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

export function useUserSettings() {
  const { userId, isAuthenticated } = useUser();
  // ─── Synchronous initialization from localStorage ───
  // This prevents flash of default values on reload by reading
  // stored settings before any async operation completes.
  const [settings, setSettingsState] = useState<UserSettings>(() => loadLocalSettings());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const pendingSettings = useRef<Record<string, string>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    const loadSettings = async () => {
      if (isAuthenticated && userId) {
        // ── Authenticated: SQLite is sole source of truth ──
        try {
          const response = await fetch('/api/user-settings', { signal: controller.signal });
          if (response.ok) {
            const serverSettings = await response.json();
            const merged: UserSettings = { ...DEFAULT_SETTINGS, ...serverSettings };
            setSettingsState(merged);
            // Sync to localStorage so getInitialSettings() reads correct values on next reload
            saveLocalSettings(merged);
            setIsSynced(true);
          } else {
            // API error — fall back to defaults
            setSettingsState(DEFAULT_SETTINGS);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setSettingsState(DEFAULT_SETTINGS);
        }
      } else {
        // ── Unauthenticated: localStorage only ──
        const localSettings = loadLocalSettings();
        setSettingsState(localSettings);
      }

      setIsLoaded(true);
    };

    loadSettings();
    return () => controller.abort();
  }, [isAuthenticated, userId]);

  useEffect(() => () => { if (flushTimer.current) clearTimeout(flushTimer.current); }, []);

  const flushPendingSettings = useCallback(() => {
    if (isAuthenticated && userId && Object.keys(pendingSettings.current).length > 0) {
      const toSend = { ...pendingSettings.current };
      pendingSettings.current = {};
      fetch('/api/user-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: toSend }),
      }).catch(() => {});
    }
  }, [isAuthenticated, userId]);

  const setSetting = useCallback((key: string, value: string) => {
    setSettingsState(prev => {
      const updated = { ...prev, [key]: value };
      // Always persist to localStorage so synchronous reads on reload
      // (getInitialSettings, loadLocalSettings) return correct values.
      saveLocalSettings(updated);
      if (isAuthenticated && userId) {
        pendingSettings.current[key] = value;
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flushPendingSettings, 300);
      }
      return updated;
    });
  }, [isAuthenticated, userId, flushPendingSettings]);

  const saveSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettingsState((prev: UserSettings) => {
      const updated: UserSettings = { ...prev };
      for (const [k, v] of Object.entries(newSettings)) {
        if (v !== undefined) updated[k] = v;
      }
      // Always persist to localStorage so synchronous reads on reload
      // (getInitialSettings, loadLocalSettings) return correct values.
      saveLocalSettings(updated);
      if (isAuthenticated && userId) {
        const filtered = Object.fromEntries(Object.entries(newSettings).filter(([, v]) => v !== undefined)) as Record<string, string>;
        pendingSettings.current = { ...pendingSettings.current, ...filtered };
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flushPendingSettings, 300);
      }
      return updated;
    });
  }, [isAuthenticated, userId, flushPendingSettings]);

  const getSetting = useCallback((key: string): string => {
    return settings[key] ?? DEFAULT_SETTINGS[key] ?? '';
  }, [settings]);

  return {
    settings,
    isLoaded,
    isSynced,
    setSetting,
    saveSettings,
    getSetting,
  };
}
