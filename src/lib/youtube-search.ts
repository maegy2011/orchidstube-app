/**
 * YouTube Search — Vercel-compatible implementation
 * 
 * Uses free public APIs (Piped + Invidious) via standard fetch.
 * NO native dependencies (no cheerio, no yt-search, no puppeteer).
 * Works perfectly on Vercel serverless.
 */

import { formatViews, getDefaultChannelAvatar } from './youtube-utils';

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  isVerified: boolean;
  url: string;
}

// Multiple Piped API instances for redundancy
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.projectsegfau.lt',
];

// Multiple Invidious instances for redundancy
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.fdn.fr',
  'https://vid.puffyan.us',
];

/** Fetch from a URL with timeout */
async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Orchids/1.0' },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Piped API Search ─────────────────────────────────────
async function searchPiped(query: string, limit: number): Promise<VideoResult[]> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetchWithTimeout(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
      );
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.items || data).filter((item: any) =>
        item.type === 'stream' || item.url?.startsWith('/watch')
      );

      if (items.length === 0) continue;

      return items.slice(0, limit).map((item: any) => {
        const videoId = item.url?.replace('/watch?v=', '') || '';
        return {
          id: videoId,
          title: item.title || 'Unknown Title',
          description: item.description || '',
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: formatDuration(item.duration),
          views: item.views ? formatViews(item.views) : '0 views',
          uploadedAt: item.uploaded || item.uploadedDate || '',
          channelName: item.uploaderName || item.uploader || 'Unknown Channel',
          channelAvatar: item.uploaderAvatar || getDefaultChannelAvatar(item.uploaderName),
          channelId: item.uploaderUrl?.replace('/channel/', '') || '',
          isVerified: item.uploaderVerified || false,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });
    } catch {
      continue;
    }
  }
  return [];
}

// ─── Invidious API Search ─────────────────────────────────
async function searchInvidious(query: string, limit: number): Promise<VideoResult[]> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetchWithTimeout(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`,
      );
      if (!res.ok) continue;
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) continue;

      return data
        .filter((item: any) => item.type === 'video')
        .slice(0, limit)
        .map((item: any) => {
          const bestThumb = item.videoThumbnails?.find((t: any) => t.quality === 'medium')
            || item.videoThumbnails?.[0];
          return {
            id: item.videoId,
            title: item.title || 'Unknown Title',
            description: item.description || '',
            thumbnail: bestThumb?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            duration: formatDuration(item.lengthSeconds),
            views: item.viewCount ? formatViews(item.viewCount) : '0 views',
            uploadedAt: item.publishedText || '',
            channelName: item.author || 'Unknown Channel',
            channelAvatar: item.authorThumbnails?.[0]?.url || getDefaultChannelAvatar(item.author),
            channelId: item.authorId || '',
            isVerified: false,
            url: `https://www.youtube.com/watch?v=${item.videoId}`,
          };
        });
    } catch {
      continue;
    }
  }
  return [];
}

// ─── Invidious API Video Details ──────────────────────────
async function getDetailsInvidious(id: string): Promise<any> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`${instance}/api/v1/videos/${id}`, 10000);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Piped API Video Details ──────────────────────────────
async function getDetailsPiped(id: string): Promise<any> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`${instance}/streams/${id}`, 10000);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

/** Format seconds to MM:SS or H:MM:SS */
function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════

/**
 * Search videos using multiple free APIs as fallbacks.
 * Order: Piped → Invidious
 * All APIs use pure fetch — works on Vercel serverless.
 */
export async function fallbackSearch(query: string, limit: number = 30): Promise<VideoResult[]> {
  // 1. Try Piped API (fastest, most reliable)
  const pipedResults = await searchPiped(query, limit);
  if (pipedResults.length > 0) return pipedResults;

  // 2. Try Invidious API
  const invidiousResults = await searchInvidious(query, limit);
  if (invidiousResults.length > 0) return invidiousResults;

  return [];
}

/**
 * Get video details using Invidious API (pure fetch).
 * Falls back to Piped API if Invidious fails.
 */
export async function getVideoDetailsFromAPI(id: string) {
  // 1. Try Invidious (has richer data: keywords, related, etc.)
  const invData = await getDetailsInvidious(id);
  if (invData && invData.title) {
    const bestThumb = invData.videoThumbnails?.find((t: any) => t.quality === 'medium')
      || invData.videoThumbnails?.[0];
    return {
      id: invData.videoId || id,
      title: invData.title || 'Unknown',
      description: invData.description || '',
      thumbnail: bestThumb?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: invData.lengthSeconds || 0,
      views: invData.viewCount ? formatViews(invData.viewCount) : '0',
      likes: invData.likeCount ? formatViews(invData.likeCount) : '0',
      uploadDate: invData.publishedText || '',
      channelName: invData.author || 'Unknown Channel',
      channelAvatar: invData.authorThumbnails?.[0]?.url || '',
      channelId: invData.authorId || '',
      channelSubscribers: invData.subCountText || '',
      isVerified: false,
      keywords: invData.keywords || [],
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      relatedVideos: (invData.recommendedVideos || []).slice(0, 20).map((v: any) => ({
        id: v.videoId,
        title: v.title || '',
        thumbnail: v.videoThumbnails?.[0]?.url || '',
        duration: formatDuration(v.lengthSeconds),
        views: v.viewCount ? formatViews(v.viewCount) : '0',
        channelName: v.author || '',
      })),
      comments: [],
    };
  }

  // 2. Try Piped API
  const pipedData = await getDetailsPiped(id);
  if (pipedData && pipedData.title) {
    return {
      id: pipedData.url?.replace('/watch?v=', '') || id,
      title: pipedData.title || 'Unknown',
      description: pipedData.description || '',
      thumbnail: pipedData.thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: pipedData.duration || 0,
      views: pipedData.views ? formatViews(pipedData.views) : '0',
      likes: pipedData.likes ? formatViews(pipedData.likes) : '0',
      uploadDate: pipedData.uploadDate || '',
      channelName: pipedData.uploaderName || 'Unknown Channel',
      channelAvatar: pipedData.uploaderAvatar || '',
      channelId: pipedData.uploaderUrl?.replace('/channel/', '') || '',
      channelSubscribers: pipedData.uploaderSubscriberCount || '',
      isVerified: pipedData.uploaderVerified || false,
      keywords: [],
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      relatedVideos: (pipedData.relatedStreams || [])
        .filter((r: any) => r.type === 'stream')
        .slice(0, 20)
        .map((r: any) => ({
          id: r.url?.replace('/watch?v=', '') || '',
          title: r.title || '',
          thumbnail: r.thumbnail || '',
          duration: formatDuration(r.duration),
          views: r.views ? formatViews(r.views) : '0',
          channelName: r.uploaderName || '',
        })),
      comments: [],
    };
  }

  return null;
}
