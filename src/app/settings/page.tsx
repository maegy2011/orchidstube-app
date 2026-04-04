"use client";

import { useState, useEffect, useCallback } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { CheckCircle2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { LanguageCode } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { useWellBeing, WellBeingLimits } from "@/lib/well-being-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { useTheme } from "next-themes";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";

import SettingsToggle from "./components/SettingsToggle";
import { LanguagePicker } from "./components/LanguagePicker";
import { ThemePicker, type ThemeId } from "./components/ThemePicker";
import { SidebarModePicker, type SidebarModeId } from "./components/SidebarModePicker";
import PrayerSettingsSection from "./components/PrayerSettingsSection";
import WellBeingSection from "./components/WellBeingSection";
import DateSettingsSection from "./components/DateSettingsSection";
import LocationSection from "./components/LocationSection";
import RestrictedModeSection from "./components/RestrictedModeSection";
import FilterManagementSection from "./components/FilterManagementSection";
import LoadingModeSection from "./components/LoadingModeSection";
import DataManagementSection from "./components/DataManagementSection";

export default function SettingsPage() {
  const router = useRouter();
  const mainPaddingTop = useTopPadding();
  const { marginClass, mounted } = useSidebarLayout();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { setTheme, theme: savedTheme } = useTheme();

  // ─── Theme state (preview before save) ───
  const [tempTheme, setTempTheme] = useState<ThemeId>("system");
  const [originalTheme, setOriginalTheme] = useState<ThemeId | null>(null);

  const themeChanged = originalTheme !== null && originalTheme !== tempTheme;

  // Location search state
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const {
    limits: globalLimits,
    setLimits: setGlobalLimits,
  } = useWellBeing();

  const {
    prayerEnabled: globalPrayerEnabled,
    setPrayerEnabled: setGlobalPrayerEnabled,
    prayerCountry: globalPrayerCountry,
    setPrayerCountry: setGlobalPrayerCountry,
    prayerCity: globalPrayerCity,
    setPrayerCity: setGlobalPrayerCity,
    prayerMethod: globalPrayerMethod,
    setPrayerMethod: setGlobalPrayerMethod,
    prayerSchool: globalPrayerSchool,
    setPrayerSchool: setGlobalPrayerSchool,
    isLoading: prayerIsLoading,
    error: prayerError,
    hijriDate,
    qiblaDirection,
    prayerOffsets,
    setPrayerOffset,
    timings: prayerTimings,
    refetchTimings,
  } = usePrayer();

  const {
    t,
    language,
    direction,
    setLanguage: setGlobalLanguage,
    location: globalLocation,
    setLocation: setGlobalLocation,
    restrictedMode: globalRestrictedMode,
    setRestrictedMode: setGlobalRestrictedMode,
    showGregorianDate: globalShowGregorian,
    setShowGregorianDate: setGlobalShowGregorian,
    showHijriDate: globalShowHijri,
    setShowHijriDate: setGlobalShowHijri,
    showRamadanCountdown: globalShowRamadan,
    setShowRamadanCountdown: setGlobalShowRamadan,
    hijriOffset: globalHijriOffset,
    setHijriOffset: setGlobalHijriOffset,
    loadMode: globalLoadMode,
    setLoadMode: setGlobalLoadMode,
    sidebarMode: globalSidebarMode,
    setSidebarMode: setGlobalSidebarMode,
    videosPerPage: globalVideosPerPage,
    setVideosPerPage: setGlobalVideosPerPage
  } = useI18n();

  const [tempLanguage, setTempLanguage] = useState<LanguageCode>(language);
  const [location, setLocation] = useState(globalLocation);
  const [restrictedMode, setRestrictedMode] = useState(globalRestrictedMode);
  const [showGregorian, setShowGregorian] = useState(globalShowGregorian);
  const [showHijri, setShowHijri] = useState(globalShowHijri);
  const [showRamadan, setShowRamadan] = useState(globalShowRamadan);
  const [hijriOffset, setHijriOffset] = useState(globalHijriOffset);
  const [loadMode, setLoadMode] = useState(globalLoadMode);
  const [tempSidebarMode, setTempSidebarMode] = useState<SidebarModeId>(globalSidebarMode);
  const [tempVideosPerPage, setTempVideosPerPage] = useState(globalVideosPerPage);

  // Prayer local state
  const [prayerEnabled, setPrayerEnabled] = useState(globalPrayerEnabled);
  const [prayerCountry, setPrayerCountry] = useState(globalPrayerCountry);
  const [prayerCity, setPrayerCity] = useState(globalPrayerCity);
  const [prayerMethod, setPrayerMethod] = useState(globalPrayerMethod);
  const [prayerSchool, setPrayerSchool] = useState(globalPrayerSchool);

  // Well-being local state
  const [wbLimits, setWbLimits] = useState<WellBeingLimits>(globalLimits);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // ─── Initialize theme state from saved theme ───
  useEffect(() => {
    if (savedTheme && mounted) {
      const id = (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'boys' || savedTheme === 'girls')
        ? savedTheme as ThemeId
        : 'system';
      setTempTheme(id);
      setOriginalTheme(null); // No change yet
    }
  }, [savedTheme, mounted]);

  const handleThemePreview = useCallback((newTheme: ThemeId) => {
    if (originalTheme === null) {
      setOriginalTheme(tempTheme);
    }
    setTempTheme(newTheme);
  }, [originalTheme, tempTheme]);

  const handleThemeRevert = useCallback(() => {
    if (originalTheme !== null) {
      setTempTheme(originalTheme);
      setOriginalTheme(null);
    }
  }, [originalTheme]);

  // Fetch countries
  useEffect(() => {
    const controller = new AbortController();
    const fetchCountries = async () => {
      setIsCountriesLoading(true);
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries", {
          signal: controller.signal
        });
        const data = await response.json();
        if (!data.error && !controller.signal.aborted) {
          setCountries(data.data.map((c: any) => c.country).sort());
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      } finally {
        if (!controller.signal.aborted) {
          setIsCountriesLoading(false);
        }
      }
    };
    fetchCountries();
    return () => controller.abort();
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (!prayerCountry) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
    const fetchCitiesForCountry = async () => {
      setIsCitiesLoading(true);
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: prayerCountry }),
          signal: controller.signal
        });
        const data = await response.json();
        if (!data.error && !controller.signal.aborted) {
          setCities(data.data.sort());
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      } finally {
        if (!controller.signal.aborted) {
          setIsCitiesLoading(false);
        }
      }
    };
    fetchCitiesForCountry();
    return () => controller.abort();
  }, [prayerCountry]);

  const isRTL = direction === 'rtl';

  // Sync with global settings when context is ready
  useEffect(() => {
    if (mounted) {
      setTempLanguage(language);
      setLocation(globalLocation);
      setRestrictedMode(globalRestrictedMode);
      setShowGregorian(globalShowGregorian);
      setShowHijri(globalShowHijri);
      setShowRamadan(globalShowRamadan);
      setHijriOffset(globalHijriOffset);
      setLoadMode(globalLoadMode);
      setTempSidebarMode(globalSidebarMode);
      setTempVideosPerPage(globalVideosPerPage);
      setWbLimits(globalLimits);
      setPrayerEnabled(globalPrayerEnabled);
      setPrayerCountry(globalPrayerCountry);
      setPrayerCity(globalPrayerCity);
      setPrayerMethod(globalPrayerMethod);
      setPrayerSchool(globalPrayerSchool);
    }
  }, [mounted, language, globalLocation, globalRestrictedMode, globalShowGregorian, globalShowHijri, globalShowRamadan, globalHijriOffset, globalLoadMode, globalSidebarMode, globalVideosPerPage, globalLimits, globalPrayerEnabled, globalPrayerCountry, globalPrayerCity, globalPrayerMethod, globalPrayerSchool]);

  const handleSave = () => {
    // Validation for Prayer Times
    if (prayerEnabled && (!prayerCountry.trim() || !prayerCity.trim())) {
      toast.error(t('locationRequiredForPrayer') || "Country and city are required for prayer times");
      return;
    }

    setIsSaving(true);

    // Commit theme via next-themes (persists to localStorage)
    setTheme(tempTheme);
    setOriginalTheme(null);

    setGlobalLanguage(tempLanguage);
    setGlobalLocation(location);
    setGlobalRestrictedMode(restrictedMode);
    setGlobalShowGregorian(showGregorian);
    setGlobalShowHijri(showHijri);
    setGlobalShowRamadan(showRamadan);
    setGlobalHijriOffset(hijriOffset);
    setGlobalLoadMode(loadMode);
    setGlobalSidebarMode(tempSidebarMode);
    setGlobalVideosPerPage(tempVideosPerPage);

    // Prayer save
    setGlobalPrayerEnabled(prayerEnabled);
    setGlobalPrayerCountry(prayerCountry);
    setGlobalPrayerCity(prayerCity);
    setGlobalPrayerMethod(prayerMethod);
    setGlobalPrayerSchool(prayerSchool);

    // Well-being save
    setGlobalLimits(wbLimits);

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      toast.success(t('savedSuccessfully'), {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  // Handle Cancel: revert theme preview to saved theme
  const handleCancel = useCallback(() => {
    // Revert theme to what's actually saved
    if (originalTheme !== null) {
      setTheme(savedTheme || 'system');
      setTempTheme((savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'boys' || savedTheme === 'girls') ? savedTheme as ThemeId : 'system');
      setOriginalTheme(null);
    }
    router.push('/');
  }, [originalTheme, savedTheme, setTheme, router]);

  // Revert theme on unmount if not saved (e.g. browser back)
  useEffect(() => {
    return () => {
      if (originalTheme !== null) {
        setTheme(savedTheme || 'system');
      }
    };
  }, [originalTheme, savedTheme, setTheme]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
      <Masthead />
      <SidebarGuide />

      <main className={`${marginClass} ${mainPaddingTop} p-4 lg:p-8 transition-all duration-300`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">{t('settings')}</h1>

          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Theme Picker — preview-only, committed on Save */}
            <ThemePicker
              selectedTheme={tempTheme}
              onThemeChange={handleThemePreview}
              hasChanged={themeChanged}
              onRevert={handleThemeRevert}
            />

            {/* Sidebar Mode — visual picker with live preview */}
            <SidebarModePicker
              value={tempSidebarMode}
              onChange={setTempSidebarMode}
            />

            {/* Language */}
            <LanguagePicker
              value={tempLanguage}
              onChange={setTempLanguage}
            />

            {/* Location */}
            <LocationSection
              t={t}
              location={location}
              setLocation={setLocation}
              detectedLocation={detectedLocation}
              setDetectedLocation={setDetectedLocation}
              isCountriesLoading={isCountriesLoading}
              setIsCountriesLoading={setIsCountriesLoading}
              countries={countries}
              cities={cities}
              prayerCountry={prayerCountry}
            />

            {/* Restricted Mode */}
            <RestrictedModeSection
              t={t}
              restrictedMode={restrictedMode}
              setRestrictedMode={setRestrictedMode}
              isRTL={isRTL}
            />

            {/* Filter Management */}
            <FilterManagementSection
              t={t}
              isRTL={isRTL}
              router={router}
            />

            {/* Video Loading Mode */}
            <LoadingModeSection
              t={t}
              loadMode={loadMode}
              setLoadMode={setLoadMode}
              tempVideosPerPage={tempVideosPerPage}
              setTempVideosPerPage={setTempVideosPerPage}
            />

            {/* Prayer Times Settings */}
            <PrayerSettingsSection
              prayerEnabled={prayerEnabled}
              setPrayerEnabled={setPrayerEnabled}
              prayerCountry={prayerCountry}
              setPrayerCountry={setPrayerCountry}
              prayerCity={prayerCity}
              setPrayerCity={setPrayerCity}
              prayerMethod={prayerMethod}
              setPrayerMethod={setPrayerMethod}
              prayerSchool={prayerSchool}
              setPrayerSchool={setPrayerSchool}
              countries={countries}
              cities={cities}
              countrySearch={countrySearch}
              setCountrySearch={setCountrySearch}
              citySearch={citySearch}
              setCitySearch={setCitySearch}
              isCountriesLoading={isCountriesLoading}
              isCitiesLoading={isCitiesLoading}
              showCountryDropdown={showCountryDropdown}
              setShowCountryDropdown={setShowCountryDropdown}
              showCityDropdown={showCityDropdown}
              setShowCityDropdown={setShowCityDropdown}
              isLoading={prayerIsLoading}
              error={prayerError}
              hijriDate={hijriDate}
              qiblaDirection={qiblaDirection}
              prayerOffsets={prayerOffsets}
              onSetPrayerOffset={setPrayerOffset}
              timings={prayerTimings}
              onRefresh={refetchTimings}
            />

            {/* Date Settings */}
            <DateSettingsSection
              showGregorian={showGregorian}
              setShowGregorian={setShowGregorian}
              showHijri={showHijri}
              setShowHijri={setShowHijri}
              showRamadan={showRamadan}
              setShowRamadan={setShowRamadan}
              hijriOffset={hijriOffset}
              setHijriOffset={setHijriOffset}
              isRTL={isRTL}
            />

            {/* Digital Well-being Section */}
            <WellBeingSection
              wbLimits={wbLimits}
              setWbLimits={setWbLimits}
              isRTL={isRTL}
            />

            {/* Data Management Section */}
            <DataManagementSection
              t={t}
              isRTL={isRTL}
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                px-8 py-2.5 rounded-xl font-semibold text-white transition-all flex items-center gap-2
                ${isSaving ? 'bg-muted cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/20'}
              `}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">{t('savedSuccessfully')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
