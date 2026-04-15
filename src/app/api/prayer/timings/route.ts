import { NextRequest, NextResponse } from "next/server";

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(key: string): { data: any; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age < CACHE_DURATION) return { data: entry.data, stale: false };
  // Return stale data if available (fresh request failed)
  if (age < CACHE_DURATION * 2) return { data: entry.data, stale: true };
  // Expire old stale data
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  // Evict expired entries to prevent unbounded memory growth (max 500 entries)
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > CACHE_DURATION * 2) {
        cache.delete(k);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const method = searchParams.get("method") || "3";
  const school = searchParams.get("school") || "0";
  const date = searchParams.get("date"); // YYYY-MM-DD or "today"

  let cacheKey: string;
  let apiUrl: string;

  const timestamp = date || Math.floor(Date.now() / 1000);

  if (latitude && longitude) {
    cacheKey = `coords:${latitude}:${longitude}:${method}:${school}:${timestamp}`;
    apiUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`;
  } else if (city && country) {
    cacheKey = `city:${city}:${country}:${method}:${school}:${timestamp}`;
    apiUrl = `https://api.aladhan.com/v1/timingsByCity/${timestamp}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`;
  } else {
    return NextResponse.json(
      { error: "Either city+country or latitude+longitude is required" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const stale = getCached(cacheKey);
      if (stale) {
        return NextResponse.json({ ...stale.data, _cached: true, _stale: true });
      }
      return NextResponse.json(
        { error: `Aladhan API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return NextResponse.json({ ...data, _cached: false });
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === "AbortError") {
      const stale = getCached(cacheKey);
      if (stale) {
        return NextResponse.json({ ...stale.data, _cached: true, _stale: true });
      }
      return NextResponse.json(
        { error: "Prayer API request timed out" },
        { status: 504 }
      );
    }

    const stale = getCached(cacheKey);
    if (stale) {
      return NextResponse.json({ ...stale.data, _cached: true, _stale: true });
    }

    return NextResponse.json(
      { error: "Failed to fetch prayer times" },
      { status: 500 }
    );
  }
}
