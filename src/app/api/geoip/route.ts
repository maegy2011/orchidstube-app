import { NextResponse } from "next/server";

interface GeoIPData {
  country: string | null;
  code: string | null;
  city: string | null;
}

const cache: { data: GeoIPData; timestamp: number } = {
  data: { country: null, code: null, city: null },
  timestamp: 0,
};

const CACHE_DURATION = 24 * 60 * 60 * 1000;

export async function GET() {
  if (cache.data.country && Date.now() - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  try {
    // Use ip-api.com with more fields
    const res = await fetch("http://ip-api.com/json/?fields=status,countryCode,country,city,regionName", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    
    if (data.status === "success") {
      Object.assign(cache.data, {
        country: data.country || null,
        code: data.countryCode?.toLowerCase() || null,
        city: data.city || null,
      });
      cache.timestamp = Date.now();
    }
    return NextResponse.json(cache.data);
  } catch {
    return NextResponse.json(cache.data);
  }
}
