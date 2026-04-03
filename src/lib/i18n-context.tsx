"use client";

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import { translations, LanguageCode, TranslationKeys } from './translations';
import { PrayerProvider } from './prayer-times-context';
import { useUserSettings } from '@/hooks/useUserSettings';
import { detectFromLocation, useAutoLanguageDetection, markLanguageManuallySet, getAutoDetectedLanguage, isLanguageManuallySet } from './language-detect';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  location: string;
  setLocation: (loc: string) => void;
  restrictedMode: boolean;
  setRestrictedMode: (mode: boolean) => void;
  showGregorianDate: boolean;
  setShowGregorianDate: (show: boolean) => void;
    showHijriDate: boolean;
  setShowHijriDate: (show: boolean) => void;
    showRamadanCountdown: boolean;
  setShowRamadanCountdown: (show: boolean) => void;
    hijriOffset: number;
  setHijriOffset: (offset: number) => void;
    loadMode: "auto" | "manual";
  setLoadMode: (mode: "auto" | "manual") => void;
    sidebarMode: "expanded" | "collapsed" | "hidden";
  setSidebarMode: (mode: "expanded" | "collapsed" | "hidden") => void;
    videosPerPage: number;
  setVideosPerPage: (count: number) => void;
    t: (key: string) => string;
  direction: "ltr" | "rtl";
}


const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Synchronously read the user's saved language from localStorage.
 * This eliminates the flash of wrong language on reload by providing
 * the correct language before any async operation completes.
 *
 * Priority: manually-set language > user-settings > auto-detected > 'ar'
 */
function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "ar";

  // 1. Check if user has explicitly set a language
  try {
    const manual = localStorage.getItem("orchids-language-manually-set");
    if (manual && translations[manual as LanguageCode]) return manual as LanguageCode;
  } catch {}

  // 2. Check user settings (for unauthenticated users, this is the source of truth)
  try {
    const stored = localStorage.getItem("orchids-user-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.language && translations[parsed.language as LanguageCode]) {
        return parsed.language as LanguageCode;
      }
    }
  } catch {}

  // 3. Check auto-detected language cache
  try {
    const detected = localStorage.getItem("orchids-language-detected");
    if (detected && translations[detected as LanguageCode]) return detected as LanguageCode;
  } catch {}

  // 4. Fall back to browser locale detection (synchronous)
  try {
    const browserLang = getAutoDetectedLanguage();
    if (browserLang && translations[browserLang]) return browserLang;
  } catch {}

  return "ar";
}

/**
 * Synchronously read initial settings from localStorage.
 * Prevents flash of default values on reload for unauthenticated users.
 */
function getInitialSettings(): { language?: string; location?: string } {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("orchids-user-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        language: parsed.language,
        location: parsed.location,
      };
    }
  } catch {}
  return {};
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, isLoaded: settingsLoaded, setSetting } = useUserSettings();

  // ─── Synchronous initialization from localStorage ───
  // This eliminates the flash by reading saved language before any async load
  const initialLang = getInitialLanguage();
  const initialSettings = getInitialSettings();

  const [language, setLanguageState] = useState<LanguageCode>(initialLang);
  const [location, setLocationState] = useState<string>(initialSettings.location || 'مصر');
  const [restrictedMode, setRestrictedModeState] = useState<boolean>(false);
  const [showGregorianDate, setShowGregorianDateState] = useState<boolean>(true);
  const [showHijriDate, setShowHijriDateState] = useState<boolean>(true);
  const [showRamadanCountdown, setShowRamadanCountdownState] = useState<boolean>(true);
  const [hijriOffset, setHijriOffsetState] = useState<number>(0);
  const [loadMode, setLoadModeState] = useState<"auto" | "manual">("auto");
  const [sidebarMode, setSidebarModeState] = useState<"expanded" | "collapsed" | "hidden">("expanded");
  const [videosPerPage, setVideosPerPageState] = useState<number>(12);

  // Sync from user settings when loaded (batched for performance)
  useEffect(() => {
    if (!settingsLoaded) return;

    const updates: Record<string, any> = {};
    if (settings.language && translations[settings.language as LanguageCode]) updates.language = settings.language as LanguageCode;
    if (settings.location) updates.location = settings.location;
    if (settings.restrictedMode !== undefined) updates.restrictedMode = settings.restrictedMode === 'true';
    if (settings.showGregorianDate !== undefined) updates.showGregorianDate = settings.showGregorianDate === 'true';
    if (settings.showHijriDate !== undefined) updates.showHijriDate = settings.showHijriDate === 'true';
    if (settings.showRamadanCountdown !== undefined) updates.showRamadanCountdown = settings.showRamadanCountdown === 'true';
    if (settings.hijriOffset !== undefined) updates.hijriOffset = parseInt(settings.hijriOffset, 10);
    if (settings.loadMode) updates.loadMode = settings.loadMode as "auto" | "manual";
    if (settings.sidebarMode) updates.sidebarMode = settings.sidebarMode as "expanded" | "collapsed" | "hidden";
    if (settings.videosPerPage) updates.videosPerPage = parseInt(settings.videosPerPage, 10);

    // Apply all updates in a single batch using startTransition
    React.startTransition(() => {
      if (updates.language) setLanguageState(updates.language);
      if (updates.location) setLocationState(updates.location);
      if (updates.restrictedMode !== undefined) setRestrictedModeState(updates.restrictedMode);
      if (updates.showGregorianDate !== undefined) setShowGregorianDateState(updates.showGregorianDate);
      if (updates.showHijriDate !== undefined) setShowHijriDateState(updates.showHijriDate);
      if (updates.showRamadanCountdown !== undefined) setShowRamadanCountdownState(updates.showRamadanCountdown);
      if (updates.hijriOffset !== undefined) setHijriOffsetState(updates.hijriOffset);
      if (updates.loadMode) setLoadModeState(updates.loadMode);
      if (updates.sidebarMode) setSidebarModeState(updates.sidebarMode);
      if (updates.videosPerPage) setVideosPerPageState(updates.videosPerPage);
    });
  }, [settingsLoaded, settings]);

  // ─── Auto-detect language on first visit ───
  // Uses GeoIP → browser locale → fallback to 'ar'
  // Only detects if user hasn't manually set a language before.
  const { detectedLang, isDetecting: _isDetecting } = useAutoLanguageDetection(settings.language, settingsLoaded);

  useEffect(() => {
    if (!detectedLang) return;
    // Only apply if user hasn't set a language explicitly
    if (!settings.language) {
      setLanguageState(detectedLang);
    }
  }, [detectedLang, settings.language]);

  // useLayoutEffect runs synchronously after DOM mutations but BEFORE the browser paints.
  // This prevents the flash of wrong language by setting lang/dir/data-lang-ready
  // in the same frame as hydration, before the user sees anything.
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = translations[language]?.direction || (language === 'ar' ? 'rtl' : 'ltr');
      // Signal that the client-side language is ready — reveals the body (CSS: html:not([data-lang-ready])>body)
      document.documentElement.setAttribute('data-lang-ready', '');

      const appName = t('appName');
      if (appName) {
        document.title = appName;
      }
    }
  }, [language]);

  // ─── Cross-tab language sync ───
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'orchids-language-manually-set' && e.newValue) {
        const newLang = e.newValue as LanguageCode;
        if (translations[newLang]) {
          setLanguageState(newLang);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    setSetting('language', lang);
    // Mark that user explicitly chose this language
    markLanguageManuallySet(lang);
  };

  const setLocation = (loc: string) => {
    setLocationState(loc);
    setSetting('location', loc);
  };

  const setRestrictedMode = (mode: boolean) => {
    setRestrictedModeState(mode);
    setSetting('restrictedMode', String(mode));
  };

  const setShowGregorianDate = (show: boolean) => {
    setShowGregorianDateState(show);
    setSetting('showGregorianDate', String(show));
  };

  const setShowHijriDate = (show: boolean) => {
    setShowHijriDateState(show);
    setSetting('showHijriDate', String(show));
  };

  const setShowRamadanCountdown = (show: boolean) => {
    setShowRamadanCountdownState(show);
    setSetting('showRamadanCountdown', String(show));
  };

    const setHijriOffset = (offset: number) => {
      setHijriOffsetState(offset);
      setSetting('hijriOffset', String(offset));
    };

      const setLoadMode = (mode: "auto" | "manual") => {
        setLoadModeState(mode);
        setSetting('loadMode', mode);
      };

        const setSidebarMode = (mode: "expanded" | "collapsed" | "hidden") => {
          setSidebarModeState(mode);
          setSetting('sidebarMode', mode);
        };

        const setVideosPerPage = (count: number) => {
          setVideosPerPageState(count);
          setSetting('videosPerPage', String(count));
        };

        const t = (key: string): string => {
    const langData = (translations[language] || translations['en']) as Record<string, string>;
    const enData = translations['en'] as Record<string, string>;
    const translation = langData[key] || enData[key];
    return translation || key;
  };

  const direction = (translations[language]?.direction || (language === 'ar' ? 'rtl' : 'ltr')) as "ltr" | "rtl";

  return (
    <I18nContext.Provider value={{
      language,
      setLanguage,
      location,
      setLocation,
      restrictedMode,
      setRestrictedMode,
      showGregorianDate,
      setShowGregorianDate,
        showHijriDate,
        setShowHijriDate,
        showRamadanCountdown,
        setShowRamadanCountdown,
            hijriOffset,
            setHijriOffset,
            loadMode,
            setLoadMode,
            sidebarMode,
            setSidebarMode,
            videosPerPage,
            setVideosPerPage,
            t,
            direction
          }}>

      <PrayerProvider>
        <div dir={direction} className="min-h-screen">
          {children}
        </div>
      </PrayerProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
