"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useI18n } from './i18n-context';

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
};

export type PrayerName = keyof PrayerTimings;

interface PrayerContextType {
  prayerEnabled: boolean;
  setPrayerEnabled: (enabled: boolean) => void;
  prayerCountry: string;
  setPrayerCountry: (country: string) => void;
  prayerCity: string;
  setPrayerCity: (city: string) => void;
  prayerMethod: number;
  setPrayerMethod: (method: number) => void;
  timings: PrayerTimings | null;
  nextPrayer: { name: PrayerName; time: Date; remainingMs: number } | null;
  currentPrayer: { name: PrayerName; time: Date; elapsedMs: number } | null;
  isPrayerTime: boolean;
  dismissReminder: () => void;
}

const PrayerContext = createContext<PrayerContextType | undefined>(undefined);

export const PRAYER_METHODS = [
  { id: 3, name: "Muslim World League" },
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
  { id: 12, name: "Union Organization islamique de France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia" },
];

export function PrayerProvider({ children }: { children: ReactNode }) {
  const { language } = useI18n();
  const [prayerEnabled, setPrayerEnabledState] = useState(false);
  const [prayerCountry, setPrayerCountryState] = useState("");
  const [prayerCity, setPrayerCityState] = useState("");
  const [prayerMethod, setPrayerMethodState] = useState(2); // Default ISNA
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerContextType['nextPrayer']>(null);
  const [currentPrayer, setCurrentPrayer] = useState<PrayerContextType['currentPrayer']>(null);
  const [isPrayerTime, setIsPrayerTime] = useState(false);
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const savedEnabled = localStorage.getItem('app-prayer-enabled');
    if (savedEnabled) setPrayerEnabledState(savedEnabled === 'true');

    const savedCountry = localStorage.getItem('app-prayer-country');
    if (savedCountry) setPrayerCountryState(savedCountry);

    const savedCity = localStorage.getItem('app-prayer-city');
    if (savedCity) setPrayerCityState(savedCity);

    const savedMethod = localStorage.getItem('app-prayer-method');
    if (savedMethod) setPrayerMethodState(parseInt(savedMethod, 10));
  }, []);

  const setPrayerEnabled = (enabled: boolean) => {
    setPrayerEnabledState(enabled);
    localStorage.setItem('app-prayer-enabled', String(enabled));
  };

  const setPrayerCountry = (country: string) => {
    setPrayerCountryState(country);
    localStorage.setItem('app-prayer-country', country);
  };

  const setPrayerCity = (city: string) => {
    setPrayerCityState(city);
    localStorage.setItem('app-prayer-city', city);
  };

  const setPrayerMethod = (method: number) => {
    setPrayerMethodState(method);
    localStorage.setItem('app-prayer-method', String(method));
  };

  const fetchTimings = useCallback(async () => {
    if (!prayerCountry || !prayerCity || !prayerEnabled) return;

    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(prayerCity)}&country=${encodeURIComponent(prayerCountry)}&method=${prayerMethod}`
      );
      if (response.ok) {
        const data = await response.json();
        setTimings(data.data.timings);
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error);
    }
  }, [prayerCountry, prayerCity, prayerMethod, prayerEnabled]);

  useEffect(() => {
    fetchTimings();
    const interval = setInterval(fetchTimings, 3600000 * 6); // Refresh every 6 hours
    return () => clearInterval(interval);
  }, [fetchTimings]);

  useEffect(() => {
    if (!timings) return;

    const updatePrayers = () => {
      const now = new Date();
      const prayerNames: PrayerName[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
      
      const parsedPrayers = prayerNames.map(name => {
        const [hours, minutes] = timings[name].split(':').map(Number);
        const date = new Date(now);
        date.setHours(hours, minutes, 0, 0);
        return { name, date };
      });

      // Find next prayer
      let next = parsedPrayers.find(p => p.date > now);
      
      // If all prayers today have passed, next is Fajr tomorrow
      if (!next) {
        const [hours, minutes] = timings["Fajr"].split(':').map(Number);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);
        next = { name: "Fajr" as PrayerName, date: tomorrow };
      }

      setNextPrayer({
        name: next.name,
        time: next.date,
        remainingMs: next.date.getTime() - now.getTime()
      });

      // Find current (last passed) prayer
      let current = [...parsedPrayers].reverse().find(p => p.date <= now);
      if (!current) {
        // If before Fajr, current is Isha yesterday
        const [hours, minutes] = timings["Isha"].split(':').map(Number);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(hours, minutes, 0, 0);
        current = { name: "Isha" as PrayerName, date: yesterday };
      }

      const elapsedMs = now.getTime() - current.date.getTime();
      setCurrentPrayer({
        name: current.name,
        time: current.date,
        elapsedMs
      });

      // Check if it's EXACTLY prayer time (within 1 minute)
      // and we haven't notified for this specific prayer instance yet
      const prayerKey = `${current.name}-${current.date.getTime()}`;
      if (elapsedMs < 60000 && lastNotifiedPrayer !== prayerKey) {
        setIsPrayerTime(true);
        setLastNotifiedPrayer(prayerKey);
      }
    };

    updatePrayers();
    const interval = setInterval(updatePrayers, 1000);
    return () => clearInterval(interval);
  }, [timings, lastNotifiedPrayer]);

  const dismissReminder = () => {
    setIsPrayerTime(false);
  };

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
      timings,
      nextPrayer,
      currentPrayer,
      isPrayerTime,
      dismissReminder
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
