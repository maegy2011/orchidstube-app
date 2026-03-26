import { Innertube, UniversalCache, YTNodes } from 'youtubei.js';
import ytSearch from 'yt-search';
import YouTubeSR from 'youtube-sr';
import youtubeSearchApi from 'youtube-search-api';
import { search as ytSearchNoApi } from 'youtube-search-without-api-key';
import ytubeNoApi from 'ytube-noapi';

let innertube: Innertube | null = null;

// Format views to a readable string
function formatViews(views: string | number): string {
  if (!views) return '0 views';
  if (typeof views === 'number') {
    return views.toLocaleString() + ' views';
  }
  const viewsStr = views.toString();
  if (viewsStr.includes('views') || viewsStr.includes('مشاهدة')) {
    return viewsStr;
  }
  // Try to parse as number
  const num = parseInt(viewsStr.replace(/[^0-9]/g, ''));
  if (!isNaN(num)) {
    return num.toLocaleString() + ' views';
  }
  return viewsStr + ' views';
}

// Generate a default avatar URL based on channel name
function getDefaultChannelAvatar(channelName: string): string {
  if (!channelName) return '';
  const initial = channelName.charAt(0).toUpperCase();
  const bgColors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const colorIndex = channelName.length % bgColors.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=${bgColors[colorIndex]}&color=fff&size=100`;
}

export async function getYouTube(lang?: string, location?: string) {
  if (!innertube) {
    try {
      innertube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        location: location || 'US',
        language: lang || 'en'
      });
    } catch (error) {
      console.error('Failed to create Innertube instance:', error);
      return null;
    }
  } else {
    // Update existing session context if needed
    if (lang) innertube.session.context.client.hl = lang;
    if (location) innertube.session.context.client.gl = location;
  }
  return innertube;
}

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

export async function searchVideos(query: string, limit: number = 30, lang?: string, location?: string) {
  const result = await searchVideosWithContinuation(query, undefined, location, lang);
  return result.videos.slice(0, limit);
}

export async function searchVideosWithContinuation(query: string, token?: string, region?: string, lang?: string) {
  // Check if we should skip youtubei.js due to known issues
  const SKIP_YOUTUBEI_JS = true; // Temporarily disable due to YouTube API changes

  if (SKIP_YOUTUBEI_JS) {
    console.log('Skipping youtubei.js and using fallback methods directly');
    const videos = await fallbackSearch(query);
    return {
      videos,
      hasMore: videos.length >= 10,
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
          console.error('Continuation fetch failed:', e);
        }
      }

      // Initial search with region and language support
      try {
        search = await yt.search(query, {
          type: 'video',
          location: region, // Innertube supports location/region
          language: lang // Innertube supports language
        });
      } catch (searchError) {
        console.error('youtubei.js search query failed:', searchError);
        throw searchError; // Re-throw to trigger fallback
      }

      // Check if search.videos exists and is an array
      if (!search.videos || !Array.isArray(search.videos) || search.videos.length === 0) {
        console.warn('youtubei.js returned no videos, falling back to alternative methods');
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
    console.error('youtubei.js search failed:', error);
  }

  // Fallback to existing logic if youtubei.js fails or not initialized
  const videos = await fallbackSearch(query);
  // If we have videos from fallback, we can still allow some pagination by returning hasMore: true
  // although we don't have a real token. The API will handle variations if no token is provided.
  return { 
    videos, 
    hasMore: videos.length >= 10, 
    continuationToken: null 
  };
}

async function fallbackSearch(query: string, limit: number = 30) {
  console.log(`Using fallback search for query: "${query}"`);

  // 0. Try ytube-noapi (User requested)
  try {
    const results = await ytubeNoApi.searchVideos(query, limit);
    if (results && results.length > 0) {
      console.log(`ytube-noapi returned ${results.length} results`);
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
    console.error('ytube-noapi search failed:', error);
  }

  // 1. Try youtube-sr
  try {
    const results = await YouTubeSR.search(query, {
      limit: limit,
      type: 'video',
      safeSearch: false
    });

    if (results && results.length > 0) {
      console.log(`youtube-sr returned ${results.length} results`);
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
    console.error('youtube-sr failed:', error);
  }

  // 2. Try youtube-search-api
  try {
    const results = await youtubeSearchApi.GetListByKeyword(query, false, limit);
    if (results && results.items && results.items.length > 0) {
      console.log(`youtube-search-api returned ${results.items.length} results`);
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
    console.error('youtube-search-api failed:', error);
  }

  // 3. Try youtube-search-without-api-key
  try {
    const results = await ytSearchNoApi(query);
    if (results && results.length > 0) {
      console.log(`youtube-search-without-api-key returned ${results.length} results`);
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
    console.error('youtube-search-without-api-key failed:', error);
  }

  // 4. Try yt-search
  try {
    const results = await ytSearch(query);
    const videos = results.videos.slice(0, limit);

    if (videos.length > 0) {
      console.log(`yt-search returned ${videos.length} results`);
      return videos.map(v => ({
        id: v.videoId,
        title: v.title || 'Unknown Title',
        description: v.description || '',
        thumbnail: v.thumbnail || v.image || '',
        duration: v.timestamp || '0:00',
        views: formatViews(v.views) || '0 views',
        uploadedAt: v.ago || '',
        channelName: v.author?.name || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(v.author?.name || 'Unknown'),
        channelId: v.author?.url?.split('/').pop() || '',
        isVerified: false,
        url: v.url,
      }));
    }
  } catch (error) {
    console.error('yt-search failed:', error);
  }

  console.warn(`All fallback methods failed for query: "${query}"`);
  return [];
}

export async function getVideoDetails(id: string, lang?: string, location?: string): Promise<VideoDetail | null> {
  console.log(`getVideoDetails called for ID: ${id}, lang: ${lang}, location: ${location}`);

  // 1. Try youtube-sr first (most reliable for video details)
  try {
    console.log(`Trying youtube-sr for video ID: ${id}`);
    const video = await YouTubeSR.getVideo(`https://www.youtube.com/watch?v=${id}`);
    if (video && video.title) {
      console.log(`youtube-sr succeeded for ${id}: ${video.title}`);
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
    } else {
      console.warn(`youtube-sr returned empty or null data for ${id}`);
    }
  } catch (error) {
    console.error('youtube-sr detail failed:', error);
  }

  // 2. Try yt-search
  try {
    console.log(`Trying yt-search for video ID: ${id}`);
    const result = await ytSearch({ videoId: id });
    if (result && result.title) {
      console.log(`yt-search succeeded for ${id}: ${result.title}`);
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
    } else {
      console.warn(`yt-search returned empty or null data for ${id}`);
    }
  } catch (e) {
    console.error('yt-search detail failed:', e);
  }

  // 3. Fallback to youtube-search-api
  try {
    console.log(`Trying youtube-search-api for video ID: ${id}`);
    const result = await youtubeSearchApi.GetVideoDetails(id);
    if (result && result.title) {
      console.log(`youtube-search-api succeeded for ${id}: ${result.title}`);
      return {
        id: id,
        title: result.title || 'Unknown',
        description: result.description || '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: 0,
        views: '0',
        likes: '0',
        uploadDate: '',
        channelName: result.channelTitle || 'Unknown Channel',
        channelAvatar: getDefaultChannelAvatar(result.channelTitle || 'Unknown'),
        channelId: result.channelId || '',
        channelSubscribers: '',
        isVerified: false,
        keywords: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        relatedVideos: [],
        comments: [],
      };
    } else {
      console.warn(`youtube-search-api returned empty or null data for ${id}`);
    }
  } catch (error) {
    console.error('youtube-search-api detail failed:', error);
  }

  // 4. Try ytube-noapi (last resort as it's returning empty data)
  try {
    console.log(`Trying ytube-noapi for video ID: ${id}`);
    const video = await ytubeNoApi.getVideo(id);
    if (video && video.title && video.title !== 'Unknown') {
      console.log(`ytube-noapi succeeded for ${id}: ${video.title}`);
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
    } else {
      console.warn(`ytube-noapi returned empty or null data for ${id}`);
    }
  } catch (error) {
    console.error('ytube-noapi detail failed:', error);
  }

  // 5. Try youtubei.js (may have parser issues)
  try {
    console.log(`Trying youtubei.js for video ID: ${id}`);
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
        console.warn('Could not fetch comments:', e);
      }

      const secondaryInfo = video.secondary_info as any;
      const primaryInfo = video.primary_info as any;

      if (basicInfo && basicInfo.title) {
        console.log(`youtubei.js succeeded for ${id}: ${basicInfo.title}`);
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
      } else {
        console.warn(`youtubei.js returned empty or null data for ${id}`);
      }
    }
  } catch (error) {
    console.error('youtubei.js detail failed:', error);
  }

  console.error(`All methods failed for video ID: ${id}`);
  return null;
}
