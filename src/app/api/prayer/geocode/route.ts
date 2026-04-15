import { NextRequest, NextResponse } from "next/server";

const GEO_CACHE = new Map<
  string,
  { lat: number; lon: number; timestamp: number }
>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const country = searchParams.get("country");

    if (!city || !country) {
      return NextResponse.json(
        { error: "City and country required" },
        { status: 400 }
      );
    }

    const cacheKey = `geo-${city}-${country}`;
    const cached = GEO_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return NextResponse.json({
        latitude: cached.lat,
        longitude: cached.lon,
      });
    }

    const response = await fetch(
      `https://api.aladhan.com/v1/cityInfo?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }

    const data = await response.json();
    const lat = data?.data?.latitude;
    const lon = data?.data?.longitude;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 404 }
      );
    }

    GEO_CACHE.set(cacheKey, { lat, lon, timestamp: Date.now() });
    // Evict expired entries to prevent unbounded memory growth (max 200 entries)
    if (GEO_CACHE.size > 200) {
      const now = Date.now();
      for (const [k, v] of GEO_CACHE) {
        if (now - v.timestamp > 48 * 60 * 60 * 1000) {
          GEO_CACHE.delete(k);
        }
      }
    }
    return NextResponse.json({ latitude: lat, longitude: lon });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
