"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Navigation, Compass,
  AlertCircle, Loader2, Settings2,
  RefreshCw, BookOpen, Wand2, Sparkles
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { PRAYER_METHODS, type PrayerTimings, getRecommendedMethod, getRecommendedSchool } from "@/lib/prayer-times-context";
import { cn } from "@/lib/utils";
import SettingsToggle from "./SettingsToggle";
import { MinaretIcon } from "@/components/ui/minaret-icon";
import LocationPicker from "./LocationPicker";
import PrayerTimingsDisplay from "./PrayerTimingsDisplay";

interface PrayerSettingsProps {
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
  countries: string[];
  cities: string[];
  countrySearch: string;
  setCountrySearch: (v: string) => void;
  citySearch: string;
  setCitySearch: (v: string) => void;
  isCountriesLoading: boolean;
  isCitiesLoading: boolean;
  showCountryDropdown: boolean;
  setShowCountryDropdown: (v: boolean) => void;
  showCityDropdown: boolean;
  setShowCityDropdown: (v: boolean) => void;
  isLoading?: boolean;
  error?: string | null;
  hijriDate?: { day: number; month: number; year: number; monthName: string; monthNameAr: string } | null;
  qiblaDirection?: number | null;
  prayerOffsets?: Record<string, number>;
  onSetPrayerOffset?: (prayer: string, offset: number) => void;
  timings?: PrayerTimings | null;
  onRefresh?: () => void;
}

export default function PrayerSettingsSection({
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
  countries,
  cities,
  countrySearch,
  setCountrySearch,
  citySearch,
  setCitySearch,
  isCountriesLoading,
  isCitiesLoading,
  showCountryDropdown,
  setShowCountryDropdown,
  showCityDropdown,
  setShowCityDropdown,
  isLoading,
  error,
  hijriDate,
  qiblaDirection,
  prayerOffsets = {},
  onSetPrayerOffset,
  timings,
  onRefresh,
}: PrayerSettingsProps) {
  const { t, direction } = useI18n();
  const [isDetecting, setIsDetecting] = useState(false);

  const isRTL = direction === 'rtl';

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    return countries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countries, countrySearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    return cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [cities, citySearch]);

  const handleGeoDetect = async () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      // Coordinates will be picked up by the geocode effect in the context
      setIsDetecting(false);
    } catch {
      setIsDetecting(false);
    }
  };

  const adjustOffset = (prayer: string, delta: number) => {
    const current = prayerOffsets[prayer] || 0;
    const newOffset = Math.max(-60, Math.min(60, current + delta));
    onSetPrayerOffset?.(prayer, newOffset);
  };

  const qiblaRotation = qiblaDirection ?? 0;

  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <MinaretIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">{t('prayerSettings')}</h3>
              <p className="text-sm text-muted-foreground">{t('enablePrayerTimes')}</p>
            </div>
          </div>
          <SettingsToggle
            enabled={prayerEnabled}
            onToggle={() => setPrayerEnabled(!prayerEnabled)}
            isRTL={isRTL}
            activeColor="bg-emerald-600"
            ringColor="focus:ring-emerald-500"
          />
        </div>

        <AnimatePresence>
          {prayerEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {/* Hijri Date + Qibla Row */}
              {(hijriDate || qiblaDirection !== null && qiblaDirection !== undefined) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hijriDate && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                      <span className="text-xl">🌙</span>
                      <div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t('hijriDate')}</p>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                          {hijriDate.day} {t('hijri_month_' + hijriDate.month)} {hijriDate.year}
                        </p>
                      </div>
                    </div>
                  )}
                  {qiblaDirection !== null && qiblaDirection !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                      <div className="relative w-10 h-10 shrink-0">
                        <Compass className="w-10 h-10 text-amber-600" />
                        <Navigation
                          className="w-4 h-4 text-red-500 absolute top-1/2 left-1/2"
                          style={{ transform: `translate(-50%, -50%) rotate(${qiblaRotation}deg)` }}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{t('qiblaDirection')}</p>
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{qiblaRotation.toFixed(1)}°</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error state */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-sm text-destructive"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                    {onRefresh && (
                      <button onClick={onRefresh} className="ms-auto p-1 hover:bg-destructive/10 rounded-lg transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Country */}
              <LocationPicker
                label={t('prayerCountry')}
                icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                value={prayerCountry}
                options={filteredCountries}
                searchQuery={countrySearch}
                onSearchChange={setCountrySearch}
                onSelect={(c) => {
                  setPrayerCountry(c);
                  setPrayerCity("");
                  setShowCountryDropdown(false);
                  setCountrySearch("");
                }}
                isLoading={isCountriesLoading}
                isOpen={showCountryDropdown}
                onToggle={() => {
                  setShowCountryDropdown(!showCountryDropdown);
                  setShowCityDropdown(false);
                }}
                placeholder={t('selectCountry')}
                isRTL={isRTL}
                noResultsText={t('noResults') || "No countries found"}
                searchPlaceholder={t('search') + "..."}
              />

              {/* City */}
              <LocationPicker
                label={t('prayerCity')}
                icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                value={prayerCity}
                options={filteredCities}
                searchQuery={citySearch}
                onSearchChange={setCitySearch}
                onSelect={(c) => {
                  setPrayerCity(c);
                  setShowCityDropdown(false);
                  setCitySearch("");
                }}
                isLoading={isCitiesLoading}
                isOpen={showCityDropdown}
                onToggle={() => {
                  if (!prayerCountry) return;
                  setShowCityDropdown(!showCityDropdown);
                  setShowCountryDropdown(false);
                }}
                disabled={!prayerCountry}
                placeholder={t('selectCity')}
                isRTL={isRTL}
                noResultsText={t('noResults') || "No cities found"}
                searchPlaceholder={t('search') + "..."}
              />

              {/* Auto-detect */}
              <button
                onClick={handleGeoDetect}
                disabled={isDetecting}
                className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
              >
                {isDetecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {t('autoDetectLocation') || 'Auto-detect my location'}
              </button>

              {/* Apply recommended settings for location */}
              {prayerCountry && (
                <button
                  onClick={() => {
                    const rec = getRecommendedMethod(prayerCountry);
                    const school = getRecommendedSchool(prayerCountry);
                    setPrayerMethod(rec.method);
                    setPrayerSchool(school.school);
                  }}
                  className="flex items-center gap-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/30 transition-colors w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('applyRecommendedSettings')}
                </button>
              )}

              {/* Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  {t('prayerMethod')}
                </label>
                <select
                  value={prayerMethod}
                  onChange={(e) => setPrayerMethod(parseInt(e.target.value))}
                  className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {PRAYER_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Method recommendation */}
              {prayerCountry && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {t('recommendedForLocation').replace('{method}', getRecommendedMethod(prayerCountry).reason)}
                  </span>
                </div>
              )}

              {/* Asr Calculation School */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>{t('asrCalculationSchool')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPrayerSchool("0")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      prayerSchool === "0"
                        ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "border-border hover:border-emerald-500/20 bg-background"
                    }`}
                  >
                    <div className="text-sm font-bold">{t('shafiiStandard')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t('shafiiDesc')}</div>
                  </button>
                  <button
                    onClick={() => setPrayerSchool("1")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      prayerSchool === "1"
                        ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "border-border hover:border-emerald-500/20 bg-background"
                    }`}
                  >
                    <div className="text-sm font-bold">{t('hanafi')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t('hanafiDesc')}</div>
                  </button>
                </div>
              </div>

              {/* Prayer times display + offset adjustments */}
              {timings && (
                <PrayerTimingsDisplay
                  timings={timings}
                  prayerOffsets={prayerOffsets}
                  onAdjustOffset={adjustOffset}
                  onRefresh={onRefresh}
                  isLoading={isLoading}
                  t={t}
                />
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('loading')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
