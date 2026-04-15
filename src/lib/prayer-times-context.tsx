"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from './i18n-context';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useUser } from '@/hooks/use-user';
import {
  applyOffset,
  calculateQibla,
  PRAYER_METHODS,
  getRecommendedMethod,
  getRecommendedSchool,
  type PrayerTimings,
  type PrayerName,
  type NextPrayerInfo,
  type CurrentPrayerInfo,
  type HijriDate,
} from './prayer-utils';

// ─── Re-exports for backward compatibility ────────────────────────────
export type { PrayerTimings, PrayerName, NextPrayerInfo, CurrentPrayerInfo, HijriDate };
export { PRAYER_METHODS, getRecommendedMethod, getRecommendedSchool };

// ─── Context Types ────────────────────────────────────────────────────

interface PrayerContextType {
  prayerEnabled: boolean;
  setPrayerEnabled: (v: boolean) => void;
  prayerCountry: string;
  setPrayerCountry: (v: string) => void;
  prayerCity: string;
  setPrayerCity: (v: string) => void;
  prayerMethod: number;
  setPrayerMethod: (v: number) => void;
  prayerSchool: string;
  setPrayerSchool: (school: string) => void;
  timings: PrayerTimings | null;
  nextPrayer: NextPrayerInfo | null;
  currentPrayer: CurrentPrayerInfo | null;
  isPrayerTime: boolean;
  dismissReminder: () => void;
  isLoading: boolean;
  error: string | null;
  hijriDate: HijriDate | null;
  qiblaDirection: number | null;
  prayerOffsets: Record<string, number>;
  setPrayerOffset: (prayer: string, offset: number) => void;
  coordinates: { latitude: number; longitude: number } | null;
  refetchTimings: () => void;
}

/** The 5 daily prayers (excluding Sunrise/Sunset) */
const DAILY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const TIMINGS_CACHE_KEY = 'app-prayer-timings-cache';
const COORDS_STORAGE_KEY = 'app-prayer-coords';

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { isAuthenticated } = useUser();
  const { settings, isLoaded: settingsLoaded, setSetting } = useUserSettings();
  const [prayerEnabled, setPrayerEnabledState] = useState(false);
  const [prayerCountry, setPrayerCountryState] = useState('');
  const [prayerCity, setPrayerCityState] = useState('');
  const [prayerMethod, setPrayerMethodState] = useState(3); // MWL as default (most widely used)
  const [prayerSchool, setPrayerSchoolState] = useState<string>("0");
  const settingsSynced = useRef(false);
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<CurrentPrayerInfo | null>(null);
  const [isPrayerTime, setIsPrayerTime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [prayerOffsets, setPrayerOffsetsState] = useState<Record<string, number>>({});
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const lastNotifiedPrayer = useRef<string | null>(null);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const nextPrayerRef = useRef<NextPrayerInfo | null>(null);

  // ─── 1. Load persisted settings from useUserSettings ───
  useEffect(() => {
    if (!settingsLoaded || settingsSynced.current) return;
    settingsSynced.current = true;

    // Read prayer settings from useUserSettings (synced to DB for auth users)
    setPrayerEnabledState(settings.prayerEnabled === 'true');
    setPrayerCountryState(settings.prayerCountry || '');
    setPrayerCityState(settings.prayerCity || '');
    if (settings.prayerMethod) setPrayerMethodState(parseInt(settings.prayerMethod));
    if (settings.prayerSchool) setPrayerSchoolState(settings.prayerSchool);
    if (settings.prayerOffsets) {
      try { setPrayerOffsetsState(JSON.parse(settings.prayerOffsets)); } catch {}
    }

    // Prayer timings cache stays in localStorage (performance cache, expires daily)
    if (typeof window === 'undefined') return;
    const cachedTimings = localStorage.getItem(TIMINGS_CACHE_KEY);
    if (cachedTimings) {
      try {
        const parsed = JSON.parse(cachedTimings);
        if (parsed.timings && parsed.date === new Date().toDateString()) {
          setTimings(parsed.timings);
        }
      } catch {}
    }
    // Coordinates: load from userSettings for auth users, localStorage for unauthenticated
    if (settings.prayerCoordinates) {
      try { setCoordinates(JSON.parse(settings.prayerCoordinates)); } catch {}
    } else {
      const coords = localStorage.getItem(COORDS_STORAGE_KEY);
      if (coords) { try { setCoordinates(JSON.parse(coords)); } catch {} }
    }
  }, [settingsLoaded, settings]);

  // ─── 2. Persist settings on change ───
  const setPrayerEnabled = useCallback((v: boolean) => {
    setPrayerEnabledState(v);
    setSetting('prayerEnabled', String(v));
  }, [setSetting]);

  const setPrayerCountry = useCallback((v: string) => {
    setPrayerCountryState(v);
    setSetting('prayerCountry', v);
  }, [setSetting]);

  const setPrayerCity = useCallback((v: string) => {
    setPrayerCityState(v);
    setSetting('prayerCity', v);
  }, [setSetting]);

  const setPrayerMethod = useCallback((v: number) => {
    setPrayerMethodState(v);
    setSetting('prayerMethod', String(v));
  }, [setSetting]);

  const setPrayerSchool = useCallback((school: string) => {
    setPrayerSchoolState(school);
    setSetting('prayerSchool', school);
  }, [setSetting]);

  const setPrayerOffset = useCallback((prayer: string, offset: number) => {
    setPrayerOffsetsState(prev => {
      const updated = { ...prev, [prayer]: offset };
      setSetting('prayerOffsets', JSON.stringify(updated));
      return updated;
    });
  }, [setSetting]);

  // ─── 3. Fetch prayer timings ───
  const fetchTimings = useCallback(async () => {
    if (!prayerEnabled || ((!prayerCity || !prayerCountry) && !coordinates)) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ method: String(prayerMethod), school: prayerSchool });

      if (coordinates) {
        params.set('latitude', String(coordinates.latitude));
        params.set('longitude', String(coordinates.longitude));
      } else if (prayerCity && prayerCountry) {
        params.set('city', prayerCity);
        params.set('country', prayerCountry);
      } else {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/prayer/timings?${params.toString()}`);

      if (!response.ok) {
        throw new Error(response.status === 502 ? 'API_ERROR' : 'FETCH_ERROR');
      }

      const data = await response.json();

      if (data.code === 200 && data.data?.timings) {
        const rawTimings = data.data.timings;
        // Apply offsets
        const adjustedTimings: PrayerTimings = {
          Fajr: applyOffset(rawTimings.Fajr, prayerOffsets.Fajr || 0),
          Sunrise: applyOffset(rawTimings.Sunrise, prayerOffsets.Sunrise || 0),
          Dhuhr: applyOffset(rawTimings.Dhuhr, prayerOffsets.Dhuhr || 0),
          Asr: applyOffset(rawTimings.Asr, prayerOffsets.Asr || 0),
          Sunset: applyOffset(rawTimings.Sunset, prayerOffsets.Sunset || 0),
          Maghrib: applyOffset(rawTimings.Maghrib, prayerOffsets.Maghrib || 0),
          Isha: applyOffset(rawTimings.Isha, prayerOffsets.Isha || 0),
          Imsak: applyOffset(rawTimings.Imsak || '', prayerOffsets.Imsak || 0),
          Midnight: applyOffset(rawTimings.Midnight || '', prayerOffsets.Midnight || 0),
          Firstthird: applyOffset(rawTimings.Firstthird || '', prayerOffsets.Firstthird || 0),
          Lastthird: applyOffset(rawTimings.Lastthird || '', prayerOffsets.Lastthird || 0),
        };

        setTimings(adjustedTimings);
        retryCount.current = 0;

        // Cache to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(TIMINGS_CACHE_KEY, JSON.stringify({
            timings: adjustedTimings,
            date: new Date().toDateString(),
          }));
        }

        // Extract Hijri date
        if (data.data.date?.hijri) {
          const h = data.data.date.hijri;
          setHijriDate({
            day: h.day,
            month: h.month.number,
            year: h.year,
            monthName: h.month.en,
            monthNameAr: h.month.ar || h.month.en,
          });
        }

        // Calculate Qibla from coordinates
        if (coordinates) {
          setQiblaDirection(calculateQibla(coordinates.latitude, coordinates.longitude));
        }
      } else {
        throw new Error('INVALID_DATA');
      }
    } catch (err) {
      // Exponential retry: 30s, 60s, 120s, 240s, max 300s
      const maxRetries = 5;
      if (retryCount.current < maxRetries) {
        const delay = Math.min(30000 * Math.pow(2, retryCount.current), 300000);
        retryCount.current++;
        if (retryTimeout.current) clearTimeout(retryTimeout.current);
        retryTimeout.current = setTimeout(fetchTimings, delay);
        setError(t('prayerFetchError') || 'Failed to fetch prayer times');
      } else {
        setError(t('prayerFetchError') || 'Failed to fetch prayer times');
      }
    } finally {
      setIsLoading(false);
    }
  }, [prayerEnabled, prayerCity, prayerCountry, prayerMethod, prayerSchool, coordinates, prayerOffsets, t]);

  // ─── 4. Fetch on settings change ───
  useEffect(() => {
    if (prayerEnabled && (prayerCity || coordinates)) {
      const timer = setTimeout(fetchTimings, 300);
      return () => clearTimeout(timer);
    }
  }, [prayerEnabled, prayerCity, prayerCountry, prayerMethod, prayerSchool, fetchTimings, coordinates]);

  // ─── Auto-refresh timings ───
  useEffect(() => {
    if (!prayerEnabled) return;
    let intervalId: NodeJS.Timeout;

    const scheduleRefresh = () => {
      fetchTimings();

      // Calculate time until next refresh — use ref to avoid stale closure
      const currentNextPrayer = nextPrayerRef.current;
      if (currentNextPrayer && currentNextPrayer.remainingMs !== undefined) {
        const remainingMin = currentNextPrayer.remainingMs / 60000;
        if (remainingMin < 30) {
          // Near prayer time: refresh every 15 minutes
          intervalId = setInterval(fetchTimings, 15 * 60 * 1000);
        } else if (remainingMin < 120) {
          // Within 2 hours: refresh every hour
          intervalId = setInterval(fetchTimings, 60 * 60 * 1000);
        } else {
          // Normal: refresh every 4 hours
          intervalId = setInterval(fetchTimings, 4 * 60 * 60 * 1000);
        }
      } else {
        intervalId = setInterval(fetchTimings, 4 * 60 * 60 * 1000);
      }
    };

    scheduleRefresh();
    return () => {
      clearInterval(intervalId);
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [prayerEnabled, prayerCity, prayerCountry, prayerMethod, prayerSchool, coordinates]);

  // ─── 6. Update next/current prayer every second ───
  useEffect(() => {
    if (!timings) return;

    const update = () => {
      const now = new Date();
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      let next: NextPrayerInfo | null = null;
      let current: CurrentPrayerInfo | null = null;

      for (const prayer of DAILY_PRAYERS) {
        const timeStr = timings[prayer];
        if (!timeStr) continue;

        const [h, m] = timeStr.split(':').map(Number);
        const prayerSeconds = h * 3600 + m * 60;

        if (prayerSeconds > nowSeconds) {
          if (!next) {
            const remainingMs = (prayerSeconds - nowSeconds) * 1000;
            next = { name: prayer, remainingMs, time: timeStr };
          }
        } else {
          current = {
            name: prayer,
            elapsedMs: (nowSeconds - prayerSeconds) * 1000,
            time: timeStr,
          };
        }
      }

      // If all prayers passed, next is tomorrow's Fajr
      if (!next && timings.Fajr) {
        const [h, m] = timings.Fajr.split(':').map(Number);
        const fajrSeconds = h * 3600 + m * 60;
        const remainingMs = ((86400 - nowSeconds) + fajrSeconds) * 1000;
        next = { name: 'Fajr', remainingMs, time: timings.Fajr };
      }

      setNextPrayer(next);
      nextPrayerRef.current = next;
      setCurrentPrayer(current);

      // Detect prayer time (within 60 seconds of start)
      if (next && next.remainingMs <= 60000 && next.remainingMs >= 0) {
        if (lastNotifiedPrayer.current !== next.name + now.toDateString()) {
          lastNotifiedPrayer.current = next.name + now.toDateString();
          setIsPrayerTime(true);
        }
      } else {
        setIsPrayerTime(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  // ─── 7. Geocode city to coordinates for Qibla ───
  useEffect(() => {
    if (!prayerEnabled || !prayerCity || !prayerCountry) return;

    const controller = new AbortController();

    fetch(`/api/prayer/geocode?city=${encodeURIComponent(prayerCity)}&country=${encodeURIComponent(prayerCountry)}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (controller.signal.aborted) return;
        if (data && typeof data.latitude === 'number') {
          const coords = { latitude: data.latitude, longitude: data.longitude };
          setCoordinates(coords);
          // Persist coordinates to userSettings for auth users, localStorage for unauthenticated
          const coordsJson = JSON.stringify(coords);
          setSetting('prayerCoordinates', coordsJson);
          if (!isAuthenticated) {
            try { localStorage.setItem(COORDS_STORAGE_KEY, coordsJson); } catch {}
          }
          setQiblaDirection(calculateQibla(data.latitude, data.longitude));
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
      });

    return () => controller.abort();
  }, [prayerEnabled, prayerCity, prayerCountry]);

  const dismissReminder = useCallback(() => {
    setIsPrayerTime(false);
  }, []);

  return (
    <PrayerContext.Provider value={{
      prayerEnabled,
      setPrayerEnabled,
      prayerCountry,
      setPrayerCountry,
      prayerCity,
      setPrayerCity,
      prayerMethod,
      setPrayerMethod,
      prayerSchool,
      setPrayerSchool,
      timings,
      nextPrayer,
      currentPrayer,
      isPrayerTime,
      dismissReminder,
      isLoading,
      error,
      hijriDate,
      qiblaDirection,
      prayerOffsets,
      setPrayerOffset,
      coordinates,
      refetchTimings: fetchTimings,
    }}>
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayer() {
  const context = useContext(PrayerContext);
  if (context === undefined) {
    throw new Error('usePrayer must be used within a PrayerProvider');
  }
  return context;
}
