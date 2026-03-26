"use client";

import { useState, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { 
  CheckCircle2, Moon, Globe, Shield, MapPin, Save, Sun, Calendar, 
  Sparkles, Monitor, Gamepad2, Heart, Trash2, ArrowRight, Clock,
  Timer, Moon as MoonIcon, ShieldCheck, PlayCircle, Bell, Map,
  Search, ChevronDown, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n-context";
import { LanguageCode } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { useWellBeing, WellBeingLimits } from "@/lib/well-being-context";
import ConfirmModal from "@/components/ui/confirm-modal";
import { usePrayer, PRAYER_METHODS } from "@/lib/prayer-times-context";
import { cn } from "@/lib/utils";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";
import { MinaretIcon } from "@/components/ui/minaret-icon";

export default function SettingsPage() {
  const router = useRouter();
  const mainPaddingTop = useTopPadding();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { marginClass, mounted } = useSidebarLayout(sidebarOpen);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

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
    nextPrayer,
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
    defaultQuality: globalDefaultQuality,
    setDefaultQuality: setGlobalDefaultQuality
  } = useI18n();
  
  const [tempLanguage, setTempLanguage] = useState<LanguageCode>(language);
  const [location, setLocation] = useState(globalLocation);
  const [restrictedMode, setRestrictedMode] = useState(globalRestrictedMode);
  const [showGregorian, setShowGregorian] = useState(globalShowGregorian);
  const [showHijri, setShowHijri] = useState(globalShowHijri);
  const [showRamadan, setShowRamadan] = useState(globalShowRamadan);
  const [hijriOffset, setHijriOffset] = useState(globalHijriOffset);
  const [loadMode, setLoadMode] = useState(globalLoadMode);
  const [tempSidebarMode, setTempSidebarMode] = useState<"expanded" | "collapsed" | "hidden">(globalSidebarMode);
  const [tempDefaultQuality, setTempDefaultQuality] = useState(globalDefaultQuality);

  // Prayer local state
  const [prayerEnabled, setPrayerEnabled] = useState(globalPrayerEnabled);
  const [prayerCountry, setPrayerCountry] = useState(globalPrayerCountry);
  const [prayerCity, setPrayerCity] = useState(globalPrayerCity);
  const [prayerMethod, setPrayerMethod] = useState(globalPrayerMethod);

  // Well-being local state
  const [wbLimits, setWbLimits] = useState<WellBeingLimits>(globalLimits);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

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
        if ((error as Error).name !== 'AbortError') {
          console.error("Error fetching countries:", error);
        }
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
        if ((error as Error).name !== 'AbortError') {
          console.error("Error fetching cities:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCitiesLoading(false);
        }
      }
    };
    fetchCitiesForCountry();
    return () => controller.abort();
  }, [prayerCountry]);

  const filteredCountries = countries.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = cities.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

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
      setTempDefaultQuality(globalDefaultQuality);
      setWbLimits(globalLimits);
      setPrayerEnabled(globalPrayerEnabled);
      setPrayerCountry(globalPrayerCountry);
      setPrayerCity(globalPrayerCity);
      setPrayerMethod(globalPrayerMethod);
    }
  }, [mounted, language, globalLocation, globalRestrictedMode, globalShowGregorian, globalShowHijri, globalShowRamadan, globalHijriOffset, globalLoadMode, globalSidebarMode, globalDefaultQuality, globalLimits, globalPrayerEnabled, globalPrayerCountry, globalPrayerCity, globalPrayerMethod]);

  const handleThemeChange = (newTheme: string) => {
    document.documentElement.classList.add('no-transitions')
    setTheme(newTheme);
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions')
    }, 50)
  };

  const handleSave = () => {
    // Validation for Prayer Times
    if (prayerEnabled && (!prayerCountry.trim() || !prayerCity.trim())) {
      toast.error(t('locationRequiredForPrayer') || "Country and city are required for prayer times");
      return;
    }

    setIsSaving(true);
    
    setGlobalLanguage(tempLanguage);
    setGlobalLocation(location);
    setGlobalRestrictedMode(restrictedMode);
    setGlobalShowGregorian(showGregorian);
    setGlobalShowHijri(showHijri);
    setGlobalShowRamadan(showRamadan);
    setGlobalHijriOffset(hijriOffset);
    setGlobalLoadMode(loadMode);
    setGlobalSidebarMode(tempSidebarMode);
    setGlobalDefaultQuality(tempDefaultQuality);

    // Prayer save
    setGlobalPrayerEnabled(prayerEnabled);
    setGlobalPrayerCountry(prayerCountry);
    setGlobalPrayerCity(prayerCity);
    setGlobalPrayerMethod(prayerMethod);

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

  const handleToggleGregorian = () => {
    if (showGregorian && !showHijri) {
      toast.error(t('atLeastOneDateEnabled'));
      return;
    }
    setShowGregorian(!showGregorian);
  };

  const handleToggleHijri = () => {
    if (showHijri && !showGregorian) {
      toast.error(t('atLeastOneDateEnabled'));
      return;
    }
    setShowHijri(!showHijri);
  };

  const handleClearCache = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      if (typeof window !== 'undefined' && window.indexedDB) {
        // Check if databases() is supported (e.g., not in Firefox yet)
        if (window.indexedDB.databases) {
          try {
            const databases = await window.indexedDB.databases();
            databases.forEach(db => {
              if (db.name) window.indexedDB.deleteDatabase(db.name);
            });
          } catch (e) {
            console.error("Error clearing indexedDB databases:", e);
          }
        }
      }

      if (typeof window !== 'undefined' && window.caches) {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        } catch (e) {
          console.error("Error clearing caches:", e);
        }
      }

      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      toast.success(t('savedSuccessfully'));
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear some cache data");
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  if (!mounted) return null;

  const languages = [
    { code: 'ar', name: 'العربية (مصر)' },
    { code: 'en', name: 'English (US)' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '简体中文' },
    { code: 'ja', name: '日本語' },
    { code: 'it', name: 'Italiano' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'fa', name: 'فارسی' },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
        <Masthead 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={`${marginClass} ${mainPaddingTop} p-4 lg:p-8 transition-all duration-300`}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">{t('settings')}</h1>

          
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Appearance */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      {resolvedTheme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('appearance')}</h3>
                      <p className="text-sm text-muted-foreground">{t('themeLight')} / {t('themeDark')}</p>
                    </div>
                  </div>
                  
                    <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                      <div className="flex min-w-max gap-1">
                        {[
                          { id: 'light', label: t('themeLight'), icon: Sun, color: 'text-orange-500' },
                          { id: 'dark', label: t('themeDark'), icon: Moon, color: 'text-blue-400' },
                          { id: 'system', label: t('themeSystem'), icon: Monitor, color: 'text-muted-foreground' },
                          { id: 'boys', label: t('themeBoys'), icon: Gamepad2, color: 'text-blue-500' },
                          { id: 'girls', label: t('themeGirls'), icon: Heart, color: 'text-pink-500' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleThemeChange(item.id)}
                            className={`
                              flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                              ${theme === item.id 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                            `}
                          >
                            <item.icon className={`w-4 h-4 ${theme === item.id ? item.color : ''}`} />
                            <span className="whitespace-nowrap">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Mode */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('sidebarMode')}</h3>
                    <p className="text-sm text-muted-foreground">{t('hidden')} / {t('collapsed')} / {t('expanded')}</p>
                  </div>
                </div>
                
                <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <div className="flex min-w-max gap-1">
                    {[
                      { id: 'hidden', label: t('hidden') },
                      { id: 'collapsed', label: t('collapsed') },
                      { id: 'expanded', label: t('expanded') }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTempSidebarMode(item.id as any)}
                        className={`
                          flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${tempSidebarMode === item.id 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                        `}
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('language')}</h3>
                    <p className="text-sm text-muted-foreground">{t('language')}</p>
                  </div>
                </div>
                <select 
                  value={tempLanguage}
                  onChange={(e) => setTempLanguage(e.target.value as LanguageCode)}
                  className="bg-muted border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-red-500 transition-all outline-none cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('location')}</h3>
                    <p className="text-sm text-muted-foreground">{t('location')}</p>
                  </div>
                </div>
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-muted border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-red-500 transition-all outline-none cursor-pointer"
                >
                  <option value="egypt">{t('egypt')}</option>
                  <option value="saudi">{t('saudi')}</option>
                  <option value="uae">{t('uae')}</option>
                  <option value="morocco">{t('morocco')}</option>
                  <option value="us">{t('us')}</option>
                  <option value="uk">{t('uk')}</option>
                  <option value="france">{t('france')}</option>
                  <option value="spain">{t('spain')}</option>
                  <option value="china">{t('china')}</option>
                  <option value="japan">{t('japan')}</option>
                  <option value="italy">{t('italy')}</option>
                  <option value="germany">{t('germany')}</option>
                  <option value="portugal">{t('portugal')}</option>
                  <option value="turkey">{t('turkey')}</option>
                  <option value="iran">{t('iran')}</option>
                </select>
              </div>
            </div>

            {/* Restricted Mode */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('restrictedMode')}</h3>
                    <p className="text-sm text-muted-foreground">{t('restrictedMode')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRestrictedMode(!restrictedMode)}
                  className={`
                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
                    ${restrictedMode ? 'bg-red-600' : 'bg-muted'}
                  `}
                >
                  <span className={`
                    ${restrictedMode ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                    inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                  `} />
                </button>
              </div>
            </div>

            {/* Filter Management */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push('/admin/filter')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('filterManagement')}</h3>
                    <p className="text-sm text-muted-foreground">{t('filterManagement')}</p>
                  </div>
                </div>
                <div className="p-2 rounded-full hover:bg-muted transition-colors">
                  <ArrowRight size={20} className={cn("text-muted-foreground", isRTL && "rotate-180")} />
                </div>
              </div>
            </div>

            {/* Video Loading Mode */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('loadMode') || "طريقة تحميل الفيديوهات"}</h3>
                    <p className="text-sm text-muted-foreground">{t('loadMode') || "اختر بين التمرير اللانهائي أو زر التحميل"}</p>
                  </div>
                </div>
                <div className="flex bg-muted p-1 rounded-xl">
                  <button
                    onClick={() => setLoadMode("auto")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${loadMode === 'auto' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('autoLoad') || "تلقائي"}
                  </button>
                  <button
                    onClick={() => setLoadMode("manual")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${loadMode === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {t('manualLoad') || "يدوي"}
                  </button>
                </div>
              </div>
            </div>

            {/* Default Video Quality */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <PlayCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('defaultVideoQuality')}</h3>
                    <p className="text-sm text-muted-foreground">{t('quality240p')}</p>
                  </div>
                </div>
                <select 
                  value={tempDefaultQuality}
                  onChange={(e) => setTempDefaultQuality(e.target.value)}
                  className="bg-muted border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-red-500 transition-all outline-none cursor-pointer"
                >
                  <option value="auto">{t('qualityAuto')}</option>
                  <option value="240">{t('quality240p')}</option>
                  <option value="360">{t('quality360p')}</option>
                  <option value="720">{t('quality720p')}</option>
                  <option value="1080">{t('quality1080p')}</option>
                </select>
              </div>
            </div>

            {/* Prayer Times Settings */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="space-y-6">
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
                  <button 
                    onClick={() => setPrayerEnabled(!prayerEnabled)}
                    className={`
                      relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500
                      ${prayerEnabled ? 'bg-emerald-600' : 'bg-muted'}
                    `}
                  >
                    <span className={`
                      ${prayerEnabled ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                      inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                    `} />
                  </button>
                </div>

                {prayerEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Country Search */}
                      <div className="space-y-2 relative">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Map className="w-4 h-4 text-muted-foreground" />
                          {t('prayerCountry')}
                        </label>
                        <div className="relative">
                            <button
                              onClick={() => {
                                setShowCountryDropdown(!showCountryDropdown);
                                setShowCityDropdown(false);
                              }}
                              className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/80 transition-all"
                            >
                              <span className={cn(prayerCountry ? "text-foreground" : "text-muted-foreground", isRTL && "text-right w-full")}>
                                {prayerCountry || t('selectCountry')}
                              </span>
                              {isCountriesLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showCountryDropdown && "rotate-180")} />
                              )}
                            </button>

                          
                          <AnimatePresence>
                            {showCountryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[300px]"
                              >
                                <div className="p-2 border-b border-border bg-muted/30">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                      autoFocus
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder={t('search') + "..."}
                                      className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar">
                                  {filteredCountries.length > 0 ? (
                                    filteredCountries.map((c) => (
                                      <button
                                        key={c}
                                        onClick={() => {
                                          setPrayerCountry(c);
                                          setPrayerCity("");
                                          setShowCountryDropdown(false);
                                          setCountrySearch("");
                                        }}
                                        className={cn(
                                          "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                                          prayerCountry === c && "bg-emerald-500/10 text-emerald-600 font-semibold"
                                        )}
                                      >
                                        {c}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      {t('noResults') || "No countries found"}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* City Search */}
                      <div className="space-y-2 relative">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {t('prayerCity')}
                        </label>
                        <div className="relative">
                            <button
                              disabled={!prayerCountry}
                              onClick={() => {
                                setShowCityDropdown(!showCityDropdown);
                                setShowCountryDropdown(false);
                              }}
                              className={cn(
                                "w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/80 transition-all",
                                !prayerCountry && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span className={cn(prayerCity ? "text-foreground" : "text-muted-foreground", isRTL && "text-right w-full")}>
                                {prayerCity || t('selectCity')}
                              </span>
                              {isCitiesLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showCityDropdown && "rotate-180")} />
                              )}
                            </button>

                          
                          <AnimatePresence>
                            {showCityDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-[300px]"
                              >
                                <div className="p-2 border-b border-border bg-muted/30">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                      autoFocus
                                      type="text"
                                      value={citySearch}
                                      onChange={(e) => setCitySearch(e.target.value)}
                                      placeholder={t('search') + "..."}
                                      className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto custom-scrollbar">
                                  {filteredCities.length > 0 ? (
                                    filteredCities.map((c) => (
                                      <button
                                        key={c}
                                        onClick={() => {
                                          setPrayerCity(c);
                                          setShowCityDropdown(false);
                                          setCitySearch("");
                                        }}
                                        className={cn(
                                          "w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors",
                                          prayerCity === c && "bg-emerald-500/10 text-emerald-600 font-semibold"
                                        )}
                                      >
                                        {c}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      {t('noResults') || "No cities found"}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('prayerMethod')}</label>
                      <select 
                        value={prayerMethod}
                        onChange={(e) => setPrayerMethod(parseInt(e.target.value))}
                        className="w-full bg-muted border border-border/50 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {PRAYER_METHODS.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Date Settings */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t('dateSettings')}</h3>
                    <p className="text-sm text-muted-foreground">{t('hijriOffsetDesc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <span className="text-sm font-medium">{t('showGregorian')}</span>
                    <button 
                      onClick={handleToggleGregorian}
                      className={`
                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
                        ${showGregorian ? 'bg-red-600' : 'bg-muted'}
                      `}
                    >
                      <span className={`
                        ${showGregorian ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                        inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                      `} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <span className="text-sm font-medium">{t('showHijri')}</span>
                    <button 
                      onClick={handleToggleHijri}
                      className={`
                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
                        ${showHijri ? 'bg-red-600' : 'bg-muted'}
                      `}
                    >
                      <span className={`
                        ${showHijri ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                        inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                      `} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{t('showRamadanCountdown')}</span>
                    </div>
                    <button 
                      onClick={() => setShowRamadan(prev => !prev)}
                      className={`
                        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
                        ${showRamadan ? 'bg-emerald-600' : 'bg-muted'}
                      `}
                    >
                      <span className={`
                        ${showRamadan ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                        inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                      `} />
                    </button>
                  </div>

                  <div className="col-span-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="space-y-1">
                      <span className="text-sm font-medium">{t('hijriOffset')}</span>
                      <p className="text-xs text-muted-foreground">{t('hijriOffsetDesc')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setHijriOffset(prev => Math.max(-2, prev - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-muted transition-colors font-bold text-lg disabled:opacity-50"
                        disabled={hijriOffset <= -2}
                      >
                        -
                      </button>
                      <div className="w-16 h-10 flex items-center justify-center bg-card border border-border rounded-lg font-bold">
                        {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset}
                      </div>
                      <button 
                        onClick={() => setHijriOffset(prev => Math.min(2, prev + 1))}
                        className="w-10 h-10 flex items-center justify-center bg-card border border-border rounded-lg hover:bg-muted transition-colors font-bold text-lg disabled:opacity-50"
                        disabled={hijriOffset >= 2}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Well-being Section */}
            <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('digitalWellbeing')}</h3>
                      <p className="text-sm text-muted-foreground">{t('parentalControls')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Daily Watch Limit */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Timer className="w-4 h-4 text-orange-500" />
                        <span>{t('dailyTimeLimit')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="480" 
                          step="15"
                          value={wbLimits.dailyTimeLimit}
                          onChange={(e) => setWbLimits({...wbLimits, dailyTimeLimit: parseInt(e.target.value)})}
                          className="flex-1 accent-primary"
                        />
                        <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                          {wbLimits.dailyTimeLimit === 0 ? "Off" : `${wbLimits.dailyTimeLimit}m`}
                        </div>
                      </div>
                    </div>

                    {/* Daily Shorts Limit */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <PlayCircle className="w-4 h-4 text-red-500" />
                        <span>{t('shortsDailyLimit')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5"
                          value={wbLimits.shortsDailyLimit}
                          onChange={(e) => setWbLimits({...wbLimits, shortsDailyLimit: parseInt(e.target.value)})}
                          className="flex-1 accent-primary"
                        />
                        <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                          {wbLimits.shortsDailyLimit === 0 ? "Off" : `${wbLimits.shortsDailyLimit}`}
                        </div>
                      </div>
                    </div>

                    {/* Break Interval */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        <span>{t('breakInterval')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="120" 
                          step="10"
                          value={wbLimits.breakInterval}
                          onChange={(e) => setWbLimits({...wbLimits, breakInterval: parseInt(e.target.value)})}
                          className="flex-1 accent-primary"
                        />
                        <div className="w-20 px-2 py-1 bg-muted rounded-lg text-center text-sm font-bold">
                          {wbLimits.breakInterval === 0 ? "Off" : `${wbLimits.breakInterval}m`}
                        </div>
                      </div>
                    </div>

                    {/* Bedtime Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2">
                        <MoonIcon className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium">{t('bedtimeMode')}</span>
                      </div>
                      <button 
                        onClick={() => setWbLimits({...wbLimits, bedtimeEnabled: !wbLimits.bedtimeEnabled})}
                        className={`
                          relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary
                          ${wbLimits.bedtimeEnabled ? 'bg-primary' : 'bg-muted'}
                        `}
                      >
                        <span className={`
                          ${wbLimits.bedtimeEnabled ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
                          inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
                        `} />
                      </button>
                    </div>

                    {/* Bedtime Times */}
                    {wbLimits.bedtimeEnabled && (
                      <div className="col-span-full grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">{t('bedtimeStart')}</label>
                          <input 
                            type="time" 
                            value={wbLimits.bedtimeStart}
                            onChange={(e) => setWbLimits({...wbLimits, bedtimeStart: e.target.value})}
                            className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">{t('bedtimeEnd')}</label>
                          <input 
                            type="time" 
                            value={wbLimits.bedtimeEnd}
                            onChange={(e) => setWbLimits({...wbLimits, bedtimeEnd: e.target.value})}
                            className="w-full bg-muted border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced / System Section */}
              <div className="p-6 hover:bg-muted/50 transition-colors">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-600">{t('clearCache')}</h3>
                      <p className="text-sm text-muted-foreground">{t('clearCacheConfirm')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowClearCacheModal(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30"
                  >
                    <Trash2 className="w-5 h-5" />
                    {t('clearCache')}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
          <button 
            onClick={() => router.push('/')}
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

      <ConfirmModal
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        onConfirm={handleClearCache}
        title={t('clearCache')}
        description={t('clearCacheConfirm')}
        confirmText={t('clearAll')}
        cancelText={t('back')}
        variant="danger"
      />
    </div>
  );
}
