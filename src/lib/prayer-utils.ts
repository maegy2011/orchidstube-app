/**
 * Prayer times utility functions, types, and constants.
 * Pure logic — no React dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export type PrayerName = keyof PrayerTimings;

export interface NextPrayerInfo {
  name: PrayerName;
  remainingMs: number;
  time: string;
}

export interface CurrentPrayerInfo {
  name: PrayerName;
  elapsedMs: number;
  time: string;
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
}

// ─── Constants ────────────────────────────────────────────────────────

export const PRAYER_METHODS = [
  { id: 0, name: "Shia Ithna-Ashari, Jafari" },
  { id: 1, name: "Islamic University of North America (ISNA)" },
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 3, name: "Muslim World League (MWL)" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura" },
  { id: 12, name: "UOIF (France)" },
  { id: 13, name: "Diyanet İşleri Başkanlığı (Turkey)" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia" },
];

/** Recommended method per country/region for accurate prayer times */
export const METHOD_RECOMMENDATIONS: Record<string, number> = {
  egypt: 5,        // Egyptian General Authority of Survey
  saudi: 4,        // Umm Al-Qura University, Makkah
  uae: 3,          // Muslim World League
  morocco: 1,      // University of Islamic Sciences, Karachi (used in Morocco)
  us: 2,           // Islamic Society of North America
  uk: 2,           // Islamic Society of North America
  france: 12,      // UOIF (France)
  spain: 1,        // University of Islamic Sciences, Karachi
  china: 1,        // University of Islamic Sciences, Karachi
  japan: 1,        // University of Islamic Sciences, Karachi
  italy: 1,        // University of Islamic Sciences, Karachi
  germany: 3,      // Muslim World League
  portugal: 3,     // Muslim World League
  turkey: 13,      // Turkey Diyanet (Turkish: 13 = Diyanet İşleri Başkanlığı)
  iran: 0,         // Shia Ithna-Ashari
  // Default for unlisted: 3 (Muslim World League)
};

/** Recommended school per region */
export const SCHOOL_RECOMMENDATIONS: Record<string, string> = {
  turkey: "1",    // Hanafi (majority in Turkey)
  iran: "0",      // Shia uses standard calculation
  iraq: "1",      // Hanafi majority
  pakistan: "1",  // Hanafi majority
  india: "1",     // Hanafi majority
  bangladesh: "1", // Hanafi majority
  egypt: "0",     // Shafi'i majority
  saudi: "0",     // Shafi'i (Maliki) majority
  uae: "0",       // Shafi'i majority
  morocco: "0",   // Maliki
};

// ─── Utility Functions ────────────────────────────────────────────────

/** Apply offset (in minutes) to a time string */
export function applyOffset(time: string, offsetMinutes: number): string {
  if (!time || !time.includes(':')) return time;
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + offsetMinutes;
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

/** Calculate Qibla direction from coordinates */
export function calculateQibla(lat: number, lon: number): number {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  const latRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const dLon = ((kaabaLon - lon) * Math.PI) / 180;
  const x = Math.sin(dLon);
  const y = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLon);
  const qibla = (Math.atan2(x, y) * 180) / Math.PI;
  return ((qibla % 360) + 360) % 360;
}

/** Get recommended method for a location */
export function getRecommendedMethod(country: string): { method: number; reason: string } {
  const normalized = country.toLowerCase().replace(/[^a-z]/g, '');
  const method = METHOD_RECOMMENDATIONS[normalized] ?? 3;
  const methodName = PRAYER_METHODS.find(m => m.id === method)?.name ?? "Muslim World League";
  return { method, reason: methodName };
}

/** Get recommended school for a location */
export function getRecommendedSchool(country: string): { school: string; name: string } {
  const normalized = country.toLowerCase().replace(/[^a-z]/g, '');
  const school = SCHOOL_RECOMMENDATIONS[normalized] ?? "0";
  return {
    school,
    name: school === "1" ? "Hanafi" : "Shafi'i / Standard",
  };
}
