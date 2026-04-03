import { Innertube, UniversalCache } from 'youtubei.js';
import { fallbackSearch, type VideoResult } from './youtube-search';
import { type VideoDetail, getVideoDetails } from './youtube-details';
import { formatViews, getDefaultChannelAvatar } from './youtube-utils';

// Re-export types
export type { VideoResult } from './youtube-search';
export type { VideoDetail } from './youtube-details';

// Re-export utilities
export { formatViews, getDefaultChannelAvatar } from './youtube-utils';

// Re-export search and detail functions
export { fallbackSearch } from './youtube-search';
export { getVideoDetails } from './youtube-details';

// Innertube singleton
let innertube: Innertube | null = null;

export async function getYouTube(lang?: string, location?: string) {
  if (!innertube) {
    try {
      innertube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        location: location || 'US',
      } as any);
    } catch (error) {
      return null;
    }
  } else {
    // Update existing session context if needed
    if (lang) innertube.session.context.client.hl = lang;
    if (location) innertube.session.context.client.gl = location;
  }
  return innertube;
}

export async function searchVideos(query: string, limit: number = 30, lang?: string, location?: string) {
  const result = await searchVideosWithContinuation(query, undefined, location, lang);
  return result.videos.slice(0, limit);
}

export async function searchVideosWithContinuation(query: string, token?: string, region?: string, lang?: string, limit?: number) {
  // Check if we should skip youtubei.js due to known issues
  const SKIP_YOUTUBEI_JS = true; // Temporarily disable due to YouTube API changes

  if (SKIP_YOUTUBEI_JS) {
    const videos = await fallbackSearch(query, limit || 20);
    return {
      videos,
      // Signal hasMore if we got a decent number — the API can try variations for more
      hasMore: videos.length >= 3,
      continuationToken: null
    };
  }

  try {
    const yt = await getYouTube(lang, region);
    if (yt) {
      let search;
      if (token) {
        // If we have a token, we can use it to get the next page
        try {
          // Ensure session context is updated
          if (lang) yt.session.context.client.hl = lang;
          if (region) yt.session.context.client.gl = region;

          const response = await yt.actions.execute('/search', {
            continuation: token,
            parse: true
          });

          const contents = (response as any).on_response_received_endpoints?.[0]?.append_continuation_items_action?.continuation_items;

          if (contents) {
            const videos = contents
              .filter((item: any) => item.type === 'Video')
                .map((v: any) => ({
                  id: v.id,
                  title: v.title?.toString() || '',
                  description: v.description?.toString() || '',
                  thumbnail: v.thumbnails?.[0]?.url || '',
                  duration: v.duration?.text || '0:00',
                  views: v.view_count?.text || '0',
                  uploadedAt: v.published?.text || '',
                  channelName: v.author?.name || '',
                  channelAvatar: v.author?.thumbnails?.[0]?.url || '',
                  channelId: v.author?.id || '',
                  isVerified: v.author?.is_verified || false,
                  url: `https://www.youtube.com/watch?v=${v.id}`,
                }));


            const nextToken = contents.find((item: any) => item.type === 'ContinuationItem')?.endpoint?.payload?.token;

            return {
              videos,
              hasMore: !!nextToken,
              continuationToken: nextToken || null
            };
          }
        } catch (e) {
          // Continuation fetch failed, will fall through to initial search
        }
      }

      // Initial search with region and language support
      try {
        search = await yt.search(query, {
          type: 'video',
          location: region,
          language: lang
        } as any);
      } catch (searchError) {
        throw searchError; // Re-throw to trigger fallback
      }

      // Check if search.videos exists and is an array
      if (!search.videos || !Array.isArray(search.videos) || search.videos.length === 0) {
        throw new Error('No videos from youtubei.js');
      }

      const videos = search.videos.map((v: any) => ({
        id: v.id,
        title: v.title?.toString() || 'Unknown',
        description: v.description?.toString() || '',
        thumbnail: v.thumbnails?.[0]?.url || '',
        duration: v.duration?.text || '0:00',
        views: v.view_count?.text || '0',
        uploadedAt: v.published?.text || '',
        channelName: v.author?.name || 'Unknown',
        channelAvatar: v.author?.thumbnails?.[0]?.url || '',
        channelId: v.author?.id || '',
        isVerified: v.author?.is_verified || false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));

      return {
        videos,
        hasMore: search.has_continuation,
        continuationToken: (search as any).continuation || null
      };
    }
  } catch (error) {
    // youtubei.js search failed, fall through to fallback
  }

  // Fallback to existing logic if youtubei.js fails or not initialized
  const videos = await fallbackSearch(query, limit || 20);
  return { 
    videos, 
    hasMore: videos.length >= 3, 
    continuationToken: null 
  };
}
