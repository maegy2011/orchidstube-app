"use client";

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef, ReactNode } from 'react';
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
 * Synchronously read ALL settings from localStorage.
 * Prevents flash of default values on reload by initializing every
 * useState with the user's saved value instead of hardcoded defaults.
 */
function getInitialSettings(): {
  language?: string;
  location?: string;
  restrictedMode?: string;
  showGregorianDate?: string;
  showHijriDate?: string;
  showRamadanCountdown?: string;
  hijriOffset?: string;
  loadMode?: string;
  sidebarMode?: string;
  videosPerPage?: string;
} {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("orchids-user-settings");
    if (stored) {
      return JSON.parse(stored);
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
  const [restrictedMode, setRestrictedModeState] = useState<boolean>(initialSettings.restrictedMode === 'true');
  const [showGregorianDate, setShowGregorianDateState] = useState<boolean>(initialSettings.showGregorianDate !== 'false');
  const [showHijriDate, setShowHijriDateState] = useState<boolean>(initialSettings.showHijriDate !== 'false');
  const [showRamadanCountdown, setShowRamadanCountdownState] = useState<boolean>(initialSettings.showRamadanCountdown !== 'false');
  const [hijriOffset, setHijriOffsetState] = useState<number>(parseInt(initialSettings.hijriOffset, 10) || 0);
  const [loadMode, setLoadModeState] = useState<"auto" | "manual">((initialSettings.loadMode as "auto" | "manual") || "auto");
  const [sidebarMode, setSidebarModeState] = useState<"expanded" | "collapsed" | "hidden">((initialSettings.sidebarMode as "expanded" | "collapsed" | "hidden") || "expanded");
  const [videosPerPage, setVideosPerPageState] = useState<number>(parseInt(initialSettings.videosPerPage, 10) || 12);

  // Track whether we've already applied the initial sync to avoid
  // re-applying the same values on every `settings` reference change.
  const hasSyncedRef = useRef(false);

  // Sync from user settings when loaded (batched for performance).
  // Only applies values that DIFFER from the current state to avoid
  // unnecessary re-renders that cause visible layout shifts.
  useEffect(() => {
    if (!settingsLoaded) return;

    // On first sync, the state already has the correct values from
    // localStorage (via getInitialSettings/getInitialLanguage).
    // For unauthenticated users, settings === localStorage — skip entirely.
    // For authenticated users, only apply if server has a truly different value.
    if (hasSyncedRef.current) {
      // Subsequent syncs: only apply values that actually changed
      const manuallySet = isLanguageManuallySet();
      if (!manuallySet && settings.language && translations[settings.language as LanguageCode] && settings.language !== language) {
        React.startTransition(() => setLanguageState(settings.language as LanguageCode));
      }
      return;
    }
    hasSyncedRef.current = true;

    // First sync: compare each setting against current state
    // and only queue updates for values that actually differ.
    const updates: Record<string, any> = {};

    // Language: never override if manually set (localStorage is the truth)
    const manuallySet = isLanguageManuallySet();
    if (!manuallySet && settings.language && translations[settings.language as LanguageCode] && settings.language !== language) {
      updates.language = settings.language as LanguageCode;
    }
    if (settings.location && settings.location !== location) {
      updates.location = settings.location;
    }
    if (settings.restrictedMode !== undefined) {
      const val = settings.restrictedMode === 'true';
      if (val !== restrictedMode) updates.restrictedMode = val;
    }
    if (settings.showGregorianDate !== undefined) {
      const val = settings.showGregorianDate === 'true';
      if (val !== showGregorianDate) updates.showGregorianDate = val;
    }
    if (settings.showHijriDate !== undefined) {
      const val = settings.showHijriDate === 'true';
      if (val !== showHijriDate) updates.showHijriDate = val;
    }
    if (settings.showRamadanCountdown !== undefined) {
      const val = settings.showRamadanCountdown === 'true';
      if (val !== showRamadanCountdown) updates.showRamadanCountdown = val;
    }
    if (settings.hijriOffset !== undefined) {
      const val = parseInt(settings.hijriOffset, 10);
      if (!isNaN(val) && val !== hijriOffset) updates.hijriOffset = val;
    }
    if (settings.loadMode) {
      const val = settings.loadMode as "auto" | "manual";
      if (val !== loadMode) updates.loadMode = val;
    }
    if (settings.sidebarMode) {
      const val = settings.sidebarMode as "expanded" | "collapsed" | "hidden";
      if (val !== sidebarMode) updates.sidebarMode = val;
    }
    if (settings.videosPerPage) {
      const val = parseInt(settings.videosPerPage, 10);
      if (!isNaN(val) && val !== videosPerPage) updates.videosPerPage = val;
    }

    // If nothing changed, skip re-render entirely
    if (Object.keys(updates).length === 0) return;

    // Apply only the changed values in a single batch
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

      const appName = t('appName');
      if (appName) {
        document.title = appName;
      }
    }
  }, [language]);

  // ─── Reveal body ONLY after hydration + first paint are complete ───
  // useLayoutEffect fires before paint but React hydration mismatch fixes
  // may not be fully committed. Using requestAnimationFrame guarantees
  // the reveal happens on the next frame, after all DOM patches are applied.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-lang-ready', '');
    }
  }, []);

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
