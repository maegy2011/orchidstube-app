import YouTubeSR from 'youtube-sr';
import youtubeSearchApi from 'youtube-search-api';
import ytubeNoApi from 'ytube-noapi';
import { getDefaultChannelAvatar } from './youtube-utils';
import { getVideoDetailsFromAPI } from './youtube-search';

export type VideoDetail = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number | string;
  views: string;
  likes: string;
  uploadDate: string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  channelSubscribers: string;
  isVerified: boolean;
  keywords: string[];
  embedUrl: string;
  relatedVideos: any[];
  comments: any[];
};

// In-memory cache for channel avatar URLs keyed by channel name
const avatarCache = new Map<string, string>();

/**
 * Fetch a real channel avatar using ytube-noapi search (same method as the homepage).
 * The homepage uses `ytubeNoApi.searchVideos()` which returns real `channelThumbnail` URLs
 * scraped from YouTube HTML. We search by channel name, grab the thumbnail from the first
 * result that has one, and cache it for subsequent requests.
 */
async function fetchChannelAvatarFromSearch(channelName: string): Promise<string> {
  if (!channelName || channelName === 'Unknown Channel') return '';

  // Check cache first
  const cached = avatarCache.get(channelName);
  if (cached) return cached;

  try {
    const results = await ytubeNoApi.searchVideos(channelName, 3);
    if (!results) return '';

    // Find the first result with a channelThumbnail (same channel or close match)
    const match = results.find((v: any) =>
      v.channelThumbnail &&
      (v.channelName?.toLowerCase() === channelName.toLowerCase())
    ) || results.find((v: any) => v.channelThumbnail);

    if (match?.channelThumbnail) {
      avatarCache.set(channelName, match.channelThumbnail);
      // Also cache by any alternate channel name spelling
      if (match.channelName && match.channelName !== channelName) {
        avatarCache.set(match.channelName, match.channelThumbnail);
      }
      return match.channelThumbnail;
    }
  } catch {
    // Search failed silently
  }

  return '';
}

/**
 * Ensure we have a real channel avatar URL.
 * Uses ytube-noapi search (homepage method) if the current avatar is missing/invalid.
 */
async function ensureChannelAvatar(channelName: string, currentAvatar: string): Promise<string> {
  // Already have a valid-looking URL
  if (currentAvatar && currentAvatar.startsWith('http')) return currentAvatar;

  // Try ytube-noapi search (same method as homepage)
  return fetchChannelAvatarFromSearch(channelName) || currentAvatar;
}

export async function getVideoDetails(id: string, lang?: string, location?: string): Promise<VideoDetail | null> {
  // 1. Try Piped/Invidious API (pure fetch, no native deps, works on Vercel)
  try {
    const apiResult = await getVideoDetailsFromAPI(id);
    if (apiResult) {
      // Ensure we have a real channel avatar
      if (!apiResult.channelAvatar || !apiResult.channelAvatar.startsWith('http')) {
        apiResult.channelAvatar = await ensureChannelAvatar(apiResult.channelName, apiResult.channelAvatar);
      }
      return apiResult;
    }
  } catch {
    // API detail failed
  }

  // 2. Try youtube-sr (npm package)
  try {
    const video = await YouTubeSR.getVideo(`https://www.youtube.com/watch?v=${id}`);
    if (video && video.title) {
      const channelName = video.channel?.name || 'Unknown Channel';
      const channelAvatar = await ensureChannelAvatar(channelName, video.channel?.icon?.url || '');
      return {
        id: video.id || id,
        title: video.title || 'Unknown',
        description: video.description || '',
        thumbnail: video.thumbnail?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.views?.toLocaleString() || '0',
        likes: '0',
        uploadDate: video.uploadedAt || '',
        channelName,
        channelAvatar,
        channelId: video.channel?.id || '',
        channelSubscribers: '',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (error) {
    // youtube-sr detail failed
  }

  // 3. Fallback to youtube-search-api
  try {
    const result = await youtubeSearchApi.GetVideoDetails(id);
    if (result && result.title) {
      const channelName = (result as any).channelTitle || 'Unknown Channel';
      const channelAvatar = await ensureChannelAvatar(channelName, '');
      return {
        id: id,
        title: result.title || 'Unknown',
        description: result.description || '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 0,
        views: '0',
        likes: '0',
        uploadDate: '',
        channelName,
        channelAvatar,
        channelId: result.channelId || '',
        channelSubscribers: '',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (error) {
    // youtube-search-api detail failed
  }

  // 4. Try ytube-noapi
  try {
    const video = await ytubeNoApi.getVideo(id);
    if (video && video.title && video.title !== 'Unknown') {
      const channelName = video.channelName || 'Unknown Channel';
      const channelAvatar = await ensureChannelAvatar(channelName, video.channelThumbnail || '');
      return {
        id: video.id || id,
        title: video.title || 'Unknown',
        description: video.description || '',
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.viewsFormatted || video.views?.toString() || '0',
        likes: '0',
        uploadDate: video.publishedAt || '',
        channelName,
        channelAvatar,
        channelId: video.channelId || '',
        channelSubscribers: '',
        isVerified: false,
        keywords: video.keywords || [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (error) {
    // ytube-noapi detail failed
  }

  return null;
}
