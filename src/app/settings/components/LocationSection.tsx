"use client";

import { MapPin } from "lucide-react";
import { toast } from "sonner";

interface LocationSectionProps {
  t: (key: string) => string;
  location: string;
  setLocation: (v: string) => void;
  detectedLocation: string | null;
  setDetectedLocation: (v: string | null) => void;
  isCountriesLoading: boolean;
  setIsCountriesLoading: (v: boolean) => void;
  countries: string[];
  cities: string[];
  prayerCountry: string;
}

export default function LocationSection({
  t,
  location,
  setLocation,
  detectedLocation,
  setDetectedLocation,
  isCountriesLoading,
  setIsCountriesLoading,
  countries,
  cities,
  prayerCountry,
}: LocationSectionProps) {
  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">{t('location')}</h3>
              <p className="text-sm text-muted-foreground">{t('videosPerPageDesc').replace('videos', 'location')}</p>
            </div>
          </div>
        </div>
        
        {/* Auto-detect button */}
        <button
          onClick={async () => {
            setIsCountriesLoading(true);
            try {
              const res = await fetch('/api/geoip');
              const data = await res.json();
              if (data.code) {
                const { mapCountryCodeToLocation } = await import('@/lib/language-detect');
                const detected = mapCountryCodeToLocation(data.code);
                if (detected) {
                  setLocation(detected);
                  setDetectedLocation(data.country || detected);
                  toast.success(t('locationAutoDetected').replace('{location}', data.country || detected));
                } else {
                  setLocation("auto");
                  setDetectedLocation(data.country || data.code);
                }
              }
            } catch {
              toast.error(t('locationDetectFailed'));
            } finally {
              setIsCountriesLoading(false);
            }
          }}
          disabled={isCountriesLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 font-medium transition-all text-sm"
        >
          <MapPin size={16} />
          {isCountriesLoading ? t('locationDetecting') : t('locationAutoDetect')}
        </button>

        {detectedLocation && (
          <p className="text-xs text-center text-green-600 dark:text-green-400">
            ✓ {t('locationAutoDetected').replace('{location}', detectedLocation)}
          </p>
        )}

        {/* Manual selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{t('locationManual')}:</span>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setDetectedLocation(null);
            }}
            className="flex-1 bg-muted border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all outline-none cursor-pointer"
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
          </select>
        </div>
      </div>
    </div>
  );
}
