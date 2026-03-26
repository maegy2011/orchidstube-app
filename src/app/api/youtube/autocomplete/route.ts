import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const hl = searchParams.get('hl') || 'en';

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    // Using the direct Google suggestions API for better language matching and encoding reliability
    // client=firefox returns a clean JSON array: ["query", ["suggestion1", "suggestion2", ...]]
    // hl parameter ensures suggestions match the application language
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=${hl}&q=${encodeURIComponent(q)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': hl,
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`YouTube suggestions API returned ${response.status}`);
    }

    const data = await response.json();
    const suggestions = Array.isArray(data) && data[1] ? data[1] : [];
    
    // Ensure all suggestions are strings and limit to top 10
    const formattedSuggestions = suggestions
      .filter((s: any) => typeof s === 'string')
      .slice(0, 10);

    return new NextResponse(JSON.stringify(formattedSuggestions), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });
  } catch (error) {
    console.error('Error fetching YouTube suggestions:', error);
    // Return empty array on error to prevent frontend crashes
    return NextResponse.json([]);
  }
}
