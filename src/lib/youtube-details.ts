import YouTubeSR from 'youtube-sr';
import ytSearch from 'yt-search';
import youtubeSearchApi from 'youtube-search-api';
import ytubeNoApi from 'ytube-noapi';
import { getDefaultChannelAvatar } from './youtube-utils';
import { getYouTube } from './youtube';

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

export async function getVideoDetails(id: string, lang?: string, location?: string): Promise<VideoDetail | null> {
  // 1. Try youtube-sr first (most reliable for video details)
  try {
    const video = await YouTubeSR.getVideo(`https://www.youtube.com/watch?v=${id}`);
    if (video && video.title) {
      return {
        id: video.id || id,
        title: video.title || 'Unknown',
        description: video.description || '',
        thumbnail: video.thumbnail?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.views?.toLocaleString() || '0',
        likes: '0',
        uploadDate: video.uploadedAt || '',
        channelName: video.channel?.name || 'Unknown Channel',
        channelAvatar: video.channel?.icon?.url || getDefaultChannelAvatar(video.channel?.name || 'Unknown'),
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

  // 2. Try yt-search
  try {
    const result = await ytSearch({ videoId: id });
    if (result && result.title) {
      return {
        id: result.videoId || id,
        title: result.title || 'Unknown',
        description: result.description || '',
        thumbnail: result.thumbnail || result.image || '',
        duration: result.seconds || 0,
        views: result.views?.toLocaleString() || '0',
        likes: '0',
        uploadDate: result.ago || '',
        channelName: result.author?.name || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(result.author?.name || 'Unknown'),
        channelId: result.author?.url?.split('/').pop() || '',
        channelSubscribers: '',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    }
  } catch (e) {
    // yt-search detail failed
  }

  // 3. Fallback to youtube-search-api
  try {
    const result = await youtubeSearchApi.GetVideoDetails(id);
    if (result && result.title) {
      return {
        id: id,
        title: result.title || 'Unknown',
        description: result.description || '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 0,
        views: '0',
        likes: '0',
        uploadDate: '',
        channelName: (result as any).channelTitle || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar((result as any).channelTitle || 'Unknown'),
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

  // 4. Try ytube-noapi (last resort as it's returning empty data)
  try {
    const video = await ytubeNoApi.getVideo(id);
    if (video && video.title && video.title !== 'Unknown') {
      return {
        id: video.id || id,
        title: video.title || 'Unknown',
        description: video.description || '',
        thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: video.duration || 0,
        views: video.viewsFormatted || video.views?.toString() || '0',
        likes: '0',
        uploadDate: video.publishedAt || '',
        channelName: video.channelName || 'Unknown Channel',
        channelAvatar: video.channelThumbnail || getDefaultChannelAvatar(video.channelName || 'Unknown'),
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

  // 5. Try youtubei.js (may have parser issues)
  try {
    const yt = await getYouTube(lang, location);
    if (yt) {
      // Ensure session context is updated
      if (lang) yt.session.context.client.hl = lang;
      if (location) yt.session.context.client.gl = location;

      const video = await yt.getInfo(id);

      const basicInfo = video.basic_info;
      const watchNext = video.watch_next_feed || [];
      const related = watchNext.filter((item: any) => item.type === 'Video') || [];

      let comments: any[] = [];
      try {
        const commentsData = await yt.getComments(id);
        comments = commentsData.contents.map((c: any) => ({
          authorName: c.author?.name || '',
          authorAvatar: c.author?.thumbnails?.[0]?.url || '',
          text: c.content?.toString() || '',
          published: c.published?.toString() || '',
          likes: c.vote_count?.toString() || '0',
        }));
      } catch (e) {
        // Could not fetch comments
      }

      const secondaryInfo = video.secondary_info as any;
      const primaryInfo = video.primary_info as any;

      if (basicInfo && basicInfo.title) {
        return {
          id: basicInfo.id || id,
          title: basicInfo.title || 'Unknown',
          description: (basicInfo as any).description || '',
          thumbnail: basicInfo.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          duration: basicInfo.duration || 0,
          views: basicInfo.view_count?.toString() || '0',
          likes: primaryInfo?.short_view_count?.text || '0',
          uploadDate: primaryInfo?.published?.text || '',
          channelName: basicInfo.author || 'Unknown Channel',
          channelAvatar: secondaryInfo?.author?.thumbnails?.[0]?.url || getDefaultChannelAvatar(basicInfo.author || 'Unknown'),
          channelId: basicInfo.channel_id || '',
          channelSubscribers: secondaryInfo?.author?.subscribe_button?.subscriber_count?.text || '',
          isVerified: secondaryInfo?.author?.is_verified || false,
          keywords: basicInfo.keywords || [],
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
          relatedVideos: related.map((v: any) => ({
            id: v.id,
            title: v.title?.toString() || '',
            thumbnail: v.thumbnails?.[0]?.url || '',
            duration: v.duration?.text || '0:00',
            views: v.view_count?.text || '0',
            channelName: v.author?.name || '',
          })),
          comments: comments,
        };
      }
    }
  } catch (error) {
    // youtubei.js detail failed
  }

  return null;
}
