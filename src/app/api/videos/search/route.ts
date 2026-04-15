import { NextRequest, NextResponse } from 'next/server';
import { searchVideosWithContinuation } from '@/lib/youtube';
import { filterContent, loadFilterConfig } from '@/lib/content-filter';

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  education: ['تعليم', 'شرح', 'درس', 'كورس', 'تعلم', 'دورة تدريبية', 'محاضرات', 'محاضرة', 'ملخص'],
  quran: ['قرآن', 'تلاوة خاشعة', 'تجويد', 'سورة كاملة', 'المصحف المرتل', 'القرآن الكريم'],
  programming: ['برمجة', 'تعلم البرمجة', 'كورس برمجة', 'تطوير الويب', 'جافا سكريبت', 'بايثون'],
  science: ['علوم', 'وثائقي علمي', 'ناشيونال جيوغرافيك', 'حقائق علمية', 'تجربة علمية'],
  documentary: ['وثائقي', 'فيلم وثائقي', 'قصة حقيقية', 'تاريخي وثائقي', 'أسرار العالم'],
  kids: ['أطفال', 'تعليم أطفال', 'أناشيد أطفال', 'قصص للأطفال', 'كرتون تعليمي'],
  language: ['تعلم اللغة', 'تعلم الإنجليزية', 'محادثة إنجليزية', 'قواعد اللغة', 'نطق صحيح'],
  history: ['تاريخ', 'وثائقي تاريخي', 'حضارات قديمة', 'ملوك وأباطرة', 'قصص من التاريخ'],
  health: ['صحة', 'طب', 'تمارين رياضية', 'نظام غذائي', 'فوائد صحية', 'علاج طبيعي'],
  mathematics: ['رياضيات', 'حساب', 'جبر', 'هندسة', 'شرح رياضيات', 'مسائل رياضية'],
  business: ['أعمال', 'تسويق', 'ريادة أعمال', 'إدارة مشاريع', 'نصائح تجارية', 'اقتصاد'],
  cooking: ['طبخ', 'وصفات طعام', 'مطبخ عربي', 'حلويات', 'أكلات سريعة', 'طريقة عمل'],
  crafts: ['حرف يدوية', 'diy', 'فنون', 'رسم', 'تصميم', 'أفكار إبداعية'],
  nature: ['طبيعة', 'حيوانات', 'وثائقي طبيعة', 'جمال الطبيعة', 'عالم الحيوان'],
  tech: ['تقنية', 'مراجعة هواتف', 'كمبيوتر', 'تكنولوجيا', 'أحدث الاختراعات', 'برامج'],
  ai: ['ذكاء اصطناعي', 'ai', 'مستقبل التقنية', 'روبوتات', 'شات جي بي تي'],
};

// Deterministic seeded shuffle for consistent variation per page
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = ((seed * 2654435761) >>> 0) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
    seed = (seed * 2654435761 + 1) >>> 0;
  }
  return result;
}

function enhanceQueryForAllowedContent(query: string, allowedCategories: string[]): string[] {
  const queries: string[] = [query];
  const shuffledCategories = [...allowedCategories].sort(() => 0.5 - Math.random());
  const selectedCategories = shuffledCategories.slice(0, 3);
  
  for (const category of selectedCategories) {
    const terms = CATEGORY_SEARCH_TERMS[category];
    if (terms && terms.length > 0) {
      const randomTerm = terms[Math.floor(Math.random() * terms.length)];
      queries.push(`${query} ${randomTerm}`);
    }
  }
  
  return queries;
}

/**
 * Generate diverse, page-specific query variations.
 * Each page gets a different set of variations to maximize unique results.
 */
function generatePaginationVariations(
  query: string, 
  page: number, 
  attempt: number, 
  allowedCategories: string[]
): string[] {
  const variations: string[] = [];
  const allCategoryKeys = Object.keys(CATEGORY_SEARCH_TERMS);
  const seed = (page - 1) * 10 + attempt;

  // Strategy 1: Category term combinations — use different categories per page
  const shuffledCategories = seededShuffle(allCategoryKeys, seed);
  for (let i = 0; i < Math.min(3, shuffledCategories.length); i++) {
    const cat = shuffledCategories[i];
    const terms = CATEGORY_SEARCH_TERMS[cat];
    if (terms && terms.length > 0) {
      const termIdx = (seed + i) % terms.length;
      variations.push(`${query} ${terms[termIdx]}`);
    }
  }

  // Strategy 2: Allowed-category specific terms
  if (allowedCategories.length > 0) {
    const shuffled = seededShuffle(allowedCategories, seed + 100);
    for (let i = 0; i < Math.min(2, shuffled.length); i++) {
      const cat = shuffled[i];
      const terms = CATEGORY_SEARCH_TERMS[cat];
      if (terms && terms.length > 0) {
        const termIdx = (seed + i + 50) % terms.length;
        variations.push(`${query} ${terms[termIdx]}`);
      }
    }
  }

  // Strategy 3: Qualifiers and modifiers
  const qualifiers = [
    'latest', 'new', 'popular', 'top', 'best', 'trending', 
    'recommended', 'recent', 'official', 'full', 'complete',
    'حديث', 'جديد', 'مميز', 'الأفضل', 'الأكثر مشاهدة', 'مختار',
  ];
  const qualStart = seed % qualifiers.length;
  variations.push(`${query} ${qualifiers[qualStart]}`);
  variations.push(`${query} ${qualifiers[(qualStart + 3) % qualifiers.length]}`);

  // Strategy 4: Numeric suffixes for different result sets
  const numOffset = (page - 1) * 3 + attempt;
  variations.push(`${query} ${numOffset + 1}`);
  if (attempt > 0) {
    variations.push(`${query} ${numOffset + 2}`);
  }

  // Strategy 5: "Part N" pattern
  if (page > 1) {
    variations.push(`${query} part ${page}`);
    variations.push(`${query} episode ${page}`);
    variations.push(`${query} حلقة ${page}`);
  }

  // Deduplicate and remove original query
  const seen = new Set<string>();
  return variations.filter(v => {
    if (v === query || seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const token = searchParams.get('token');
  const location = searchParams.get('location') || undefined;
  const language = searchParams.get('language') || undefined;
  const restricted = searchParams.get('restricted') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
  // Client can pass already-known video IDs to exclude for better pagination
  const excludeIdsParam = searchParams.get('excludeIds');
  const excludeIds = new Set(excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : []);

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ 
      error: 'يرجى إدخال كلمة للبحث',
      videos: [], 
      totalResults: 0 
    }, { status: 400 });
  }

  try {
    const config = loadFilterConfig();
    const isPaginationRequest = page > 1 && !token;
    const searchQueries = (restricted && config.defaultDeny && !isPaginationRequest)
      ? enhanceQueryForAllowedContent(query, config.allowedCategories)
      : [query];
    
    // Map location to YouTube region code
    const regionMap: Record<string, string> = {
      'egypt': 'EG', 'saudi': 'SA', 'uae': 'AE', 'morocco': 'MA',
      'us': 'US', 'uk': 'GB', 'france': 'FR', 'spain': 'ES',
      'china': 'CN', 'japan': 'JP', 'italy': 'IT', 'germany': 'DE',
      'portugal': 'PT', 'turkey': 'TR', 'iran': 'IR',
      'مصر': 'EG', 'السعودية': 'SA', 'الإمارات': 'AE', 'المغرب': 'MA',
      'إيران': 'IR', 'تركيا': 'TR'
    };
    const region = location ? regionMap[location] : undefined;

    const allResults: Map<string, any> = new Map();
    let currentToken: string | null = token;
    let hasMore = true;
    const filteredVideos: any[] = [];
    let fetchCount = 0;
    const MAX_FETCH_ATTEMPTS = 6;
    // Track which variation strings we've already tried to avoid re-querying
    const usedVariationStrings = new Set<string>([query]);

    while (filteredVideos.length < limit && hasMore && fetchCount < MAX_FETCH_ATTEMPTS) {
      const batchResults: any[] = [];
      
      if (currentToken) {
        // Fetch more via continuation token
        const result = await searchVideosWithContinuation(query, currentToken, region, language, limit);
        batchResults.push(...result.videos);
        currentToken = result.continuationToken;
        hasMore = result.hasMore;
      } else if (!isPaginationRequest && fetchCount === 0) {
        // ═══════════════════════════════════════════════════════
        // FIRST PAGE: Initial multi-query search
        // ═══════════════════════════════════════════════════════
        for (const sQ of searchQueries) {
          usedVariationStrings.add(sQ);
          try {
            const result = await searchVideosWithContinuation(sQ, undefined, region, language, limit);
            batchResults.push(...result.videos);
            if (sQ === query) {
              currentToken = result.continuationToken;
              hasMore = result.hasMore;
            }
          } catch (err) {
            console.error(`Search query "${sQ}" failed:`, err);
          }
        }
      } else {
        // ═══════════════════════════════════════════════════════
        // PAGINATION / EXHAUSTED: Query variation strategy
        // ═══════════════════════════════════════════════════════
        const variations = generatePaginationVariations(
          query, 
          isPaginationRequest ? page : fetchCount + 1, 
          fetchCount, 
          config.allowedCategories
        );

        // Filter out variations we've already tried
        const freshVariations = variations.filter(v => !usedVariationStrings.has(v));

        if (freshVariations.length === 0) {
          hasMore = false;
          break;
        }

        // Try up to 3 variations per fetch attempt (parallel for speed)
        const variationsToTry = freshVariations.slice(0, 3);
        for (const variation of variationsToTry) {
          usedVariationStrings.add(variation);
          try {
            const result = await searchVideosWithContinuation(variation, undefined, region, language, limit);
            batchResults.push(...result.videos);
            if (batchResults.length >= limit) break;
          } catch (err) {
            console.error(`Variation "${variation}" failed:`, err);
          }
        }

        // Keep trying if we got results but not enough
        if (batchResults.length > 0) {
          hasMore = true;
        } else if (freshVariations.length <= 3) {
          // No more fresh variations to try
          hasMore = false;
        }
      }

      // Filter the new batch: skip excluded IDs, dedup, and content-filter
      for (const video of batchResults) {
        if (allResults.has(video.id)) continue;
        if (excludeIds.has(video.id)) continue;
        allResults.set(video.id, video);

        const filterResult = filterContent(
          video.id,
          'video',
          video.title,
          video.description,
          [],
          video.channelId,
          restricted
        );
        
        if (filterResult.allowed) {
          filteredVideos.push({
            ...video,
            filterReason: filterResult.reason,
          });
        }
      }

      fetchCount++;
      // Stop if no new raw results and no token
      if (!currentToken && batchResults.length === 0 && fetchCount > 1) hasMore = false;
    }

    const gotEnough = filteredVideos.length >= limit;
    const hasContinuation = !!currentToken;

    return NextResponse.json({ 
      videos: filteredVideos.slice(0, limit), 
      continuationToken: currentToken,
      hasMore: hasContinuation || gotEnough || (filteredVideos.length > 0 && fetchCount < MAX_FETCH_ATTEMPTS),
      page,
      query: query,
      totalFetched: filteredVideos.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.', 
      videos: [], 
      totalResults: 0 
    }, { status: 500 });
  }
}
