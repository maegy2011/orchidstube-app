"use client";

import { useState, useEffect, useRef } from 'react';
import type { VideoDetails } from '@/lib/types';
import type { UseVideoDataOptions, UseVideoDataReturn } from '../types';
import { useIncognito } from '@/lib/incognito-context';

export function useVideoData({
  videoId,
  userId,
  language,
  location,
  t,
  initialVideo,
  initialError,
  initialBlocked,
  initialBlockReason,
}: UseVideoDataOptions): UseVideoDataReturn {
  const [video, setVideo] = useState<VideoDetails | null>(initialVideo);
  const [loading, setLoading] = useState(!initialVideo && !initialError && !initialBlocked);
  const [error, setError] = useState<string | null>(initialError);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [blockReason, setBlockReason] = useState<string | null>(initialBlockReason);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const isMounted = useRef(false);
  const { isIncognito } = useIncognito();

  // Video fetch effect — with AbortController
  useEffect(() => {
    if (!videoId) return;

    const controller = new AbortController();

    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL(`/api/videos/${videoId}`, window.location.origin);
        url.searchParams.set("language", language);
        url.searchParams.set("location", location);

        const response = await fetch(url.toString(), { signal: controller.signal });

        if (!response.ok) {
          let errorMsg = t('error_fetching_video');
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
            if (response.status === 403 && errorData.blocked) {
              setBlocked(true);
              setBlockReason(errorData.reason || t('content_blocked'));
              setLoading(false);
              return;
            }
          } catch (e) {
          }
          throw new Error(errorMsg);
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          throw new Error(t('retry'));
        }

        if (!data) {
          throw new Error(t('video_not_found'));
        }

        if (isMounted.current) {
          setVideo(data);
          setBlocked(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : t('retry'));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    isMounted.current = true;
    fetchVideo();

    return () => {
      controller.abort();
      isMounted.current = false;
    };
  }, [videoId, language, location, t]);

  // Subscription check effect — with AbortController
  useEffect(() => {
    if (!userId || !video) return;

    const controller = new AbortController();

    const checkSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions`, { signal: controller.signal });
        const subs = await response.json();
        if (controller.signal.aborted) return;
        const isSub = Array.isArray(subs) && subs.some((s: any) => s.channelId === video.channelId);
        if (isMounted.current) {
          setIsSubscribed(isSub);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
      }
    };

    checkSubscription();

    return () => controller.abort();
  }, [userId, video]);

  // History recording effect — disabled in incognito mode
  useEffect(() => {
    if (!userId || !video || isIncognito) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: videoId,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail,
          }),
        });
      } catch (err) {
        // Silent fail — history recording is non-critical
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [userId, video, videoId, isIncognito]);

  const toggleSubscription = async () => {
    if (!userId || !video || subscribing || isIncognito) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: video.channelId }),
        });
        setIsSubscribed(false);
      } else {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: video.channelId,
            channelTitle: video.channelName,
            channelThumbnail: video.channelAvatar,
          }),
        });
        setIsSubscribed(true);
      }
    } catch (err) {
    } finally {
      setSubscribing(false);
    }
  };

  return {
    video,
    setVideo,
    loading,
    error,
    blocked,
    blockReason,
    isSubscribed,
    subscribing,
    toggleSubscription,
    isMounted,
  };
}
