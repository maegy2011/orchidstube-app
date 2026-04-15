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

export async function searchVideos(query: string, limit: number = 30, lang?: string, location?: string) {
  const result = await searchVideosWithContinuation(query, undefined, location, lang);
  return result.videos.slice(0, limit);
}

export async function searchVideosWithContinuation(query: string, token?: string, region?: string, lang?: string, limit?: number) {
  const videos = await fallbackSearch(query, limit || 20);
  return {
    videos,
    hasMore: videos.length >= 3,
    continuationToken: null
  };
}
