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

export async function fallbackSearch(query: string, limit: number = 30): Promise<VideoResult[]> {
  // 0. Try ytube-noapi (User requested)
  try {
    const results = await ytubeNoApi.searchVideos(query, limit);
    if (results && results.length > 0) {
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
          channelAvatar: v.channelThumbnail || getDefaultChannelAvatar(v.channelName || 'Unknown'),
          channelId: v.channelId || '',
          isVerified: v.verified || false,
          url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
        }));
    }
  } catch (error) {
    // ytube-noapi search failed
  }

  // 1. Try youtube-sr
  try {
    const results = await YouTubeSR.search(query, {
      limit: limit,
      type: 'video',
      safeSearch: false
    });

    if (results && results.length > 0) {
      return results.map((v: any) => ({
        id: v.id,
        title: v.title || 'Unknown Title',
        description: v.description || '',
        thumbnail: v.thumbnail?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        duration: v.durationFormatted || '0:00',
        views: formatViews(v.views) || '0 views',
        uploadedAt: v.uploadedAt || '',
        channelName: v.channel?.name || 'Unknown Channel',
        channelAvatar: v.channel?.icon?.url || getDefaultChannelAvatar(v.channel?.name || 'Unknown'),
        channelId: v.channel?.id || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));
    }
  } catch (error) {
    // youtube-sr failed
  }

  // 2. Try youtube-search-api
  try {
    const results = await youtubeSearchApi.GetListByKeyword(query, false, limit);
    if (results && results.items && results.items.length > 0) {
      return results.items.map((v: any) => ({
        id: v.id,
        title: v.title || 'Unknown Title',
        description: v.description || '',
        thumbnail: v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        duration: v.length?.simpleText || '0:00',
        views: formatViews(v.viewCount?.short) || '0 views',
        uploadedAt: v.publishedAt || '',
        channelName: v.channelTitle || v.author?.name || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(v.channelTitle || v.author?.name || 'Unknown'),
        channelId: v.channelId || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id}`,
      }));
    }
  } catch (error) {
    // youtube-search-api failed
  }

  // 3. Try youtube-search-without-api-key
  try {
    const results = await ytSearchNoApi(query);
    if (results && results.length > 0) {
      return results.slice(0, limit).map((v: any) => ({
        id: v.id.videoId,
        title: v.snippet.title || 'Unknown Title',
        description: v.snippet.description || '',
        thumbnail: v.snippet.thumbnails.high.url || '',
        duration: '0:00',
        views: '0 views',
        uploadedAt: v.snippet.publishedAt || '',
        channelName: v.snippet.channelTitle || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(v.snippet.channelTitle || 'Unknown'),
        channelId: v.snippet.channelId || '',
        isVerified: false,
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      }));
    }
  } catch (error) {
    // youtube-search-without-api-key failed
  }

  return [];
}
