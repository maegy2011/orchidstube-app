/**
 * YouTube Search — Vercel-compatible, NO Piped/Invidious
 *
 * Sources (in order):
 * 1. YouTube Data API v3     — if YOUTUBE_API_KEY env var is set (most reliable)
 * 2. Direct YouTube scrape  — fetch HTML + parse ytInitialData JSON (no cheerio)
 * 3. youtube-sr             — npm package
 * 4. youtube-search-api     — npm package
 * 5. youtube-search-without-api-key — npm package
 * 6. ytube-noapi            — npm package
 *
 * Zero native dependencies. Works on Vercel serverless.
 */

import YouTubeSR from 'youtube-sr';
import youtubeSearchApi from 'youtube-search-api';
import { search as ytSearchNoApi } from 'youtube-search-without-api-key';
import ytubeNoApi from 'ytube-noapi';
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

// ─── Helpers ──────────────────────────────────────────────

function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function formatDurationSec(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── 1. YouTube Data API v3 ───────────────────────────────
async function searchYouTubeAPI(query: string, limit: number): Promise<VideoResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${Math.min(limit, 24)}&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items?.length) return [];

    // Fetch video stats (duration, views) in batch via videos endpoint
    const ids = data.items.map((i: any) => i.id.videoId).join(',');
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${apiKey}`;
    const statsRes = await fetchWithTimeout(statsUrl);
    const statsData = statsRes.ok ? await statsRes.json() : { items: [] };
    const statsMap = new Map<string, any>();
    for (const item of statsData.items || []) {
      statsMap.set(item.id, item);
    }

    return data.items.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = statsMap.get(videoId);
      const durationText = stats?.contentDetails?.duration || '';
      // Parse ISO 8601 duration (PT1H2M30S)
      const seconds = parseISO8601Duration(durationText);

      return {
        id: videoId,
        title: item.snippet?.title || 'Unknown Title',
        description: item.snippet?.description || '',
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: formatDurationSec(seconds),
        views: stats?.statistics?.viewCount ? formatViews(Number(stats.statistics.viewCount)) : '0 views',
        uploadedAt: item.snippet?.publishedAt || '',
        channelName: item.snippet?.channelTitle || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(item.snippet?.channelTitle),
        channelId: item.snippet?.channelId || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
  } catch {
    return [];
  }
}

function parseISO8601Duration(iso: string): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

// ─── 2. Direct YouTube HTML scrape ─────────────────────────
async function searchYouTubeScrape(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, 12000);
    if (!res.ok) return [];

    const html = await res.text();

    // Extract ytInitialData JSON from the page
    const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
    if (!match) return [];

    const data = JSON.parse(match[1]);

    // Navigate the YouTube response structure to find video items
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;

    if (!Array.isArray(contents)) return [];

    const videos: VideoResult[] = [];

    for (const item of contents) {
      if (videos.length >= limit) break;

      const renderer = item.videoRenderer;
      if (!renderer?.videoId) continue;

      const videoId = renderer.videoId;
      const thumb = renderer.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      // Extract duration from runs: "10:30" or "1:02:30"
      let duration = '0:00';
      const lengthText = renderer.lengthText?.simpleText || '';
      if (lengthText) duration = lengthText;

      videos.push({
        id: videoId,
        title: renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || 'Unknown Title',
        description: renderer.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
        thumbnail: thumb,
        duration,
        views: renderer.viewCountText?.simpleText || renderer.shortViewCountText?.simpleText || '0 views',
        uploadedAt: renderer.publishedTimeText?.simpleText || '',
        channelName: renderer.ownerText?.runs?.[0]?.text || renderer.longBylineText?.runs?.[0]?.text || 'Unknown Channel',
        channelAvatar: renderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
          ?.thumbnail?.thumbnails?.[0]?.url || getDefaultChannelAvatar(renderer.ownerText?.runs?.[0]?.text),
        channelId: renderer.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
        isVerified: renderer.ownerBadges?.some((b: any) => b.metadataBadgeRenderer?.tooltip === 'Verified') || false,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    return videos;
  } catch {
    return [];
  }
}

// ─── 3. youtube-sr ────────────────────────────────────────
async function searchYoutubeSR(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const results = await YouTubeSR.search(query, { limit, type: 'video', safeSearch: false });
    if (!results?.length) return [];
    return results.map((v: any) => ({
      id: v.id,
      title: v.title || 'Unknown Title',
      description: v.description || '',
      thumbnail: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      duration: v.durationFormatted || '0:00',
      views: formatViews(v.views) || '0 views',
      uploadedAt: v.uploadedAt || '',
      channelName: v.channel?.name || 'Unknown Channel',
      channelAvatar: v.channel?.icon?.url || getDefaultChannelAvatar(v.channel?.name),
      channelId: v.channel?.id || '',
      isVerified: false,
      url: `https://www.youtube.com/watch?v=${v.id}`,
    }));
  } catch {
    return [];
  }
}

// ─── 4. youtube-search-api ────────────────────────────────
async function searchYoutubeSearchApi(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const results = await youtubeSearchApi.GetListByKeyword(query, false, limit);
    if (!results?.items?.length) return [];
    return results.items.map((v: any) => ({
      id: v.id,
      title: v.title || 'Unknown Title',
      description: v.description || '',
      thumbnail: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
      duration: v.length?.simpleText || '0:00',
      views: formatViews(v.viewCount?.short) || '0 views',
      uploadedAt: v.publishedAt || '',
      channelName: v.channelTitle || 'Unknown Channel',
      channelAvatar: getDefaultChannelAvatar(v.channelTitle),
      channelId: v.channelId || '',
      isVerified: false,
      url: `https://www.youtube.com/watch?v=${v.id}`,
    }));
  } catch {
    return [];
  }
}

// ─── 5. youtube-search-without-api-key ────────────────────
async function searchWithoutApiKey(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const results = await ytSearchNoApi(query);
    if (!results?.length) return [];
    return results.slice(0, limit).map((v: any) => ({
      id: v.id.videoId,
      title: v.snippet.title || 'Unknown Title',
      description: v.snippet.description || '',
      thumbnail: v.snippet.thumbnails.high.url || '',
      duration: '0:00',
      views: '0 views',
      uploadedAt: v.snippet.publishedAt || '',
      channelName: v.snippet.channelTitle || 'Unknown Channel',
      channelAvatar: getDefaultChannelAvatar(v.snippet.channelTitle),
      channelId: v.snippet.channelId || '',
      isVerified: false,
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
    }));
  } catch {
    return [];
  }
}

// ─── 6. ytube-noapi ───────────────────────────────────────
async function searchYtubeNoApi(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const results = await ytubeNoApi.searchVideos(query, limit);
    if (!results?.length) return [];
    return results
      .filter((v: any) => v.type === 'video')
      .map((v: any) => ({
        id: v.id,
        title: v.title || 'Unknown Title',
        description: v.description || '',
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        duration: v.duration || '0:00',
        views: formatViews(v.views) || '0 views',
        uploadedAt: v.publishedTime || '',
        channelName: v.channelName || 'Unknown Channel',
        channelAvatar: v.channelThumbnail || getDefaultChannelAvatar(v.channelName),
        channelId: v.channelId || '',
        isVerified: v.verified || false,
        url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
      }));
  } catch {
    return [];
  }
}

// ─── YouTube Data API v3 — Video Details ──────────────────
async function getDetailsYouTubeAPI(id: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${id}&key=${apiKey}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      title: item.snippet?.title || 'Unknown',
      description: item.snippet?.description || '',
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: parseISO8601Duration(item.contentDetails?.duration) || 0,
      views: item.statistics?.viewCount ? formatViews(Number(item.statistics.viewCount)) : '0',
      likes: item.statistics?.likeCount ? formatViews(Number(item.statistics.likeCount)) : '0',
      uploadDate: item.snippet?.publishedAt || '',
      channelName: item.snippet?.channelTitle || 'Unknown Channel',
      channelAvatar: item.snippet?.thumbnails?.high?.url || '',
      channelId: item.snippet?.channelId || '',
      channelSubscribers: '',
      isVerified: false,
      keywords: [],
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      relatedVideos: [],
      comments: [],
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════

export async function fallbackSearch(query: string, limit: number = 30): Promise<VideoResult[]> {
  // 1. YouTube Data API v3 (most reliable — needs YOUTUBE_API_KEY env var)
  const apiResults = await searchYouTubeAPI(query, limit);
  if (apiResults.length > 0) return apiResults;

  // 2. Direct YouTube scrape (no deps, pure fetch + JSON parse)
  const scrapeResults = await searchYouTubeScrape(query, limit);
  if (scrapeResults.length > 0) return scrapeResults;

  // 3. youtube-sr
  const srResults = await searchYoutubeSR(query, limit);
  if (srResults.length > 0) return srResults;

  // 4. youtube-search-api
  const ytApiResults = await searchYoutubeSearchApi(query, limit);
  if (ytApiResults.length > 0) return ytApiResults;

  // 5. youtube-search-without-api-key
  const noKeyResults = await searchWithoutApiKey(query, limit);
  if (noKeyResults.length > 0) return noKeyResults;

  // 6. ytube-noapi
  const ytubeResults = await searchYtubeNoApi(query, limit);
  if (ytubeResults.length > 0) return ytubeResults;

  return [];
}

export async function getVideoDetailsFromAPI(id: string) {
  // 1. YouTube Data API v3 (best data quality)
  const apiResult = await getDetailsYouTubeAPI(id);
  if (apiResult) return apiResult;

  return null;
}
