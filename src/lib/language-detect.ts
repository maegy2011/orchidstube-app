"use client";

import { useEffect, useState } from "react";
import { LanguageCode } from "@/lib/translations";
import { useUser } from "@/hooks/use-user";

// ═══════════════════════════════════════════════════════
// Language auto-detection based on browser locale and country
// ═══════════════════════════════════════════════════════

const DETECTED_LANG_KEY = "orchids-language-detected";
const MANUAL_LANG_KEY = "orchids-language-manually-set";

/**
 * Maps browser language codes (e.g. "fr-FR", "zh-CN") to our LanguageCode.
 * Returns null if no match.
 */
function matchBrowserLang(lang: string): LanguageCode | null {
  const code = lang.toLowerCase().split("-")[0];
  const map: Record<string, LanguageCode> = {
    ar: "ar",
    en: "en",
    fr: "fr",
    es: "es",
    zh: "zh",
    ja: "ja",
    it: "it",
    de: "de",
    pt: "pt",
    tr: "tr",
  };
  return map[code] ?? null;
}

/**
 * Maps country names/codes to suggested LanguageCode.
 * Tries multiple formats: ISO-3166-1 alpha-2, full name, common variants.
 */
function matchCountryToLang(country: string): LanguageCode | null {
  const c = country.toLowerCase().trim();

  const countryMap: Record<string, LanguageCode> = {
    // Arab countries
    eg: "ar", egypt: "ar", "مصر": "ar", sa: "ar", "saudi arabia": "ar",
    "السعودية": "ar", ae: "ar", "uae": "ar", "الإمارات": "ar",
    ma: "ar", morocco: "ar", "المغرب": "ar", dz: "ar", algeria: "ar",
    "الجزائر": "ar", tn: "ar", tunisia: "ar", "تونس": "ar",
    iq: "ar", iraq: "ar", "العراق": "ar", sy: "ar", syria: "ar",
    "سوريا": "ar", jo: "ar", jordan: "ar", "الأردن": "ar",
    lb: "ar", lebanon: "ar", "لبنان": "ar", kw: "ar", kuwait: "ar",
    "الكويت": "ar", bh: "ar", bahrain: "ar", "البحرين": "ar",
    qa: "ar", qatar: "ar", "قطر": "ar", ye: "ar", yemen: "ar",
    "اليمن": "ar", om: "ar", oman: "ar", "عمان": "ar",
    ps: "ar", palestine: "ar", "فلسطين": "ar",
    mr: "ar", mauritania: "ar", "موريتانيا": "ar",
    sd: "ar", sudan: "ar", "السودان": "ar", so: "ar", somalia: "ar",
    "الصومال": "ar", dj: "ar", djibouti: "ar", "جيبوتي": "ar",
    km: "ar", comoros: "ar", "جزر القمر": "ar",
    ly: "ar", libya: "ar", "ليبيا": "ar",

    // Turkey → Turkish
    tr: "tr", turkey: "tr", turkiye: "tr", "تركيا": "tr",

    // France → French
    fr: "fr", france: "fr",

    // Spain → Spanish
    es: "es", spain: "es",

    // Portugal → Portuguese
    pt: "pt", portugal: "pt",

    // Brazil → Portuguese
    br: "pt", brazil: "pt",

    // Germany → German
    de: "de", germany: "de",

    // Italy → Italian
    it: "it", italy: "it",

    // Japan → Japanese
    jp: "ja", japan: "ja",

    // China → Chinese
    cn: "zh", china: "zh",

    // US/UK → English (fallback, already default)
    us: "en", gb: "en", uk: "en",
  };

  return countryMap[c] ?? null;
}

/**
 * Detect language from browser (navigator.language, Accept-Language).
 * Returns the matched LanguageCode or null.
 */
function detectFromBrowser(): LanguageCode | null {
  if (typeof navigator === "undefined") return null;

  // Try navigator.language first
  if (navigator.language) {
    const match = matchBrowserLang(navigator.language);
    if (match) return match;
  }

  // Try navigator.languages array
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const match = matchBrowserLang(lang);
      if (match) return match;
    }
  }

  return null;
}

/**
 * Detect language from the user's location setting (already stored).
 * Called after I18nProvider is loaded.
 */
export function detectFromLocation(locationStr: string): LanguageCode | null {
  if (!locationStr) return null;
  return matchCountryToLang(locationStr);
}

/**
 * Get the best auto-detected language.
 * Checks localStorage first (to avoid re-detecting on every visit),
 * then browser locale.
 * Returns the detected LanguageCode, or 'ar' as fallback.
 */
export function getAutoDetectedLanguage(): LanguageCode {
  if (typeof window !== "undefined") {
    try {
      const prev = localStorage.getItem(DETECTED_LANG_KEY);
      if (prev) return prev as LanguageCode;
    } catch {}
  }

  const detected = detectFromBrowser();
  if (detected) {
    try { localStorage.setItem(DETECTED_LANG_KEY, detected); } catch {}
    return detected;
  }

  return "ar";
}

/**
 * Fetch user's country from GeoIP API and detect language.
 * Falls back to browser detection if GeoIP fails.
 */
export async function detectLanguageFromGeoIP(signal?: AbortSignal): Promise<LanguageCode | null> {
  try {
    const res = await fetch('/api/geoip', { signal });
    const data = await res.json();
    if (data.code) {
      const match = matchCountryToLang(data.code);
      if (match) return match;
    }
  } catch {
    // Abort or network error — silently fallback
  }
  return null;
}

/**
 * Mark that the user has manually changed language,
 * so auto-detection won't override it.
 * For auth users, this is handled by setSetting('language', lang) in I18nProvider.
 * For unauthenticated users, we store in localStorage.
 */
export function markLanguageManuallySet(lang: LanguageCode): void {
  try {
    localStorage.setItem(MANUAL_LANG_KEY, lang);
    localStorage.setItem(DETECTED_LANG_KEY, lang);
  } catch {}
}

/**
 * Check if the user has a manually-set language (vs auto-detected).
 */
export function isLanguageManuallySet(): boolean {
  try {
    return localStorage.getItem(MANUAL_LANG_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Clear manual language preference, allowing auto-detection to run again.
 */
export function clearManualLanguagePreference(): void {
  try {
    localStorage.removeItem(MANUAL_LANG_KEY);
    localStorage.removeItem(DETECTED_LANG_KEY);
  } catch {}
}

/**
 * Map country code from GeoIP to app's location identifier.
 */
export function mapCountryCodeToLocation(code: string): string | null {
  const map: Record<string, string> = {
    eg: "egypt",
    sa: "saudi",
    ae: "uae",
    ma: "morocco",
    us: "us",
    gb: "uk",
    fr: "france",
    es: "spain",
    cn: "china",
    jp: "japan",
    it: "italy",
    de: "germany",
    pt: "portugal",
    tr: "turkey",
    ir: "iran",
    dz: "algeria",
    tn: "tunisia",
    iq: "iraq",
    sy: "syria",
    jo: "jordan",
    lb: "lebanon",
    kw: "kuwait",
    bh: "bahrain",
    qa: "qatar",
    ye: "yemen",
    om: "oman",
    ps: "palestine",
    sd: "sudan",
    ly: "libya",
    mr: "mauritania",
    so: "somalia",
    dj: "djibouti",
    km: "comoros",
    br: "brazil",
    in: "india",
    pk: "pakistan",
    id: "indonesia",
    my: "malaysia",
    ng: "nigeria",
    za: "southafrica",
    ca: "canada",
    au: "australia",
    mx: "mexico",
    ru: "russia",
  };
  return map[code.toLowerCase()] || null;
}

/**
 * Map app location identifier to display country name.
 */
export function mapLocationToCountryName(loc: string): string {
  const map: Record<string, string> = {
    egypt: "Egypt",
    saudi: "Saudi Arabia",
    uae: "UAE",
    morocco: "Morocco",
    us: "United States",
    uk: "United Kingdom",
    france: "France",
    spain: "Spain",
    china: "China",
    japan: "Japan",
    italy: "Italy",
    germany: "Germany",
    portugal: "Portugal",
    turkey: "Turkey",
    iran: "Iran",
  };
  return map[loc] || loc;
}

/**
 * Hook: Auto-detect language on first visit if no saved language exists.
 * Uses proper React state instead of window globals.
 * Detection priority: GeoIP → browser locale.
 * For auth users: detection result is stored in userSettings via I18nProvider.
 * For unauthenticated users: cached in localStorage.
 *
 * Usage in I18nProvider:
 *   const { detectedLang, isDetecting } = useAutoLanguageDetection(savedLanguage, isLoaded);
 *   if (detectedLang) setLanguage(detectedLang);
 */
export function useAutoLanguageDetection(
  savedLanguage: string | undefined,
  isLoaded: boolean
): { detectedLang: LanguageCode | null; isDetecting: boolean } {
  const [detectedLang, setDetectedLang] = useState<LanguageCode | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    // If user has explicitly set language before, skip detection
    if (isLanguageManuallySet()) return;

    // If there's already a saved language preference in userSettings, skip detection
    if (savedLanguage) return;

    // Check localStorage cache first (for unauthenticated users)
    try {
      const cached = localStorage.getItem(DETECTED_LANG_KEY);
      if (cached) {
        setDetectedLang(cached as LanguageCode);
        return;
      }
    } catch {}

    // Run detection
    setIsDetecting(true);
    let cancelled = false;
    
    const detect = async () => {
      let controller: AbortController | null = null;

      try {
        // Priority 1: GeoIP
        controller = new AbortController();
        const geoipLang = await detectLanguageFromGeoIP(controller.signal);
        if (cancelled) return;
        if (geoipLang) {
          localStorage.setItem(DETECTED_LANG_KEY, geoipLang);
          setDetectedLang(geoipLang);
          setIsDetecting(false);
          return;
        }

        // Priority 2: Browser locale
        const browserLang = detectFromBrowser();
        if (browserLang) {
          localStorage.setItem(DETECTED_LANG_KEY, browserLang);
          setDetectedLang(browserLang);
        }
      } catch {
        if (cancelled) return;
        // Priority 3: Browser locale fallback
        try {
          const browserLang = detectFromBrowser();
          if (browserLang) {
            localStorage.setItem(DETECTED_LANG_KEY, browserLang);
            setDetectedLang(browserLang);
          }
        } catch {}
      } finally {
        if (!cancelled) setIsDetecting(false);
      }
    };

    detect();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, savedLanguage]);

  return { detectedLang, isDetecting };
}
