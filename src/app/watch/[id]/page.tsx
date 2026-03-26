import { Metadata, ResolvingMetadata } from 'next';
import { cache } from 'react';
import { getVideoDetails } from '@/lib/youtube';
import { filterContent } from '@/lib/content-filter';
import WatchDynamic from './WatchDynamic';

import * as nextHeaders from 'next/headers';

interface Props {
  params: Promise<{ id: string }>;
}

const fetchVideoData = cache(async (id: string) => {
  try {
    const headersList = await nextHeaders.headers();
    const acceptLanguage = headersList.get('accept-language');
    const language = acceptLanguage ? acceptLanguage.split(',')[0].split('-')[0] : 'ar';
    
    const videoData = await getVideoDetails(id, language);
    if (!videoData) return { video: null, error: 'Video not found', blocked: false };

    const filterResult = filterContent(
      videoData.id,
      'video',
      videoData.title,
      videoData.description,
      videoData.keywords,
      videoData.channelId
    );

    if (!filterResult.allowed) {
      return { 
        video: null, 
        error: 'Content not allowed', 
        blocked: true, 
        reason: filterResult.reason 
      };
    }

    return { video: videoData, error: null, blocked: false };
  } catch (err) {
    console.error('Error fetching video for SEO:', err);
    return { video: null, error: 'An error occurred while fetching video data', blocked: false };
  }
});

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const { video } = await fetchVideoData(id);

  if (!video) {
    return {
      title: 'Video Unavailable',
      description: 'This video is currently unavailable',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: video.title,
    description: video.description?.slice(0, 160) || `Watch ${video.title} on our platform with Smart Notes`,
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 160),
      url: `https://yourdomain.com/watch/${id}`,
      siteName: 'Smart Watch Platform',
      images: [
        {
          url: video.thumbnail,
          width: 1280,
          height: 720,
          alt: video.title,
        },
        ...previousImages,
      ],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description: video.description?.slice(0, 160),
      images: [video.thumbnail],
    },
    alternates: {
      canonical: `/watch/${id}`,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const { video, error, blocked, reason } = await fetchVideoData(id);

  return (
    <WatchDynamic 
      initialVideo={video} 
      initialError={error} 
      initialBlocked={blocked} 
      initialBlockReason={reason || null}
    />
  );
}
