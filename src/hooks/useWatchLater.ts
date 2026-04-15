"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { useIncognito } from '@/lib/incognito-context';

export interface WatchLaterItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

const WATCH_LATER_STORAGE_KEY = 'youtube-watch-later';

/** Load from localStorage (unauthenticated users only) */
function loadLocalWatchLater(): WatchLaterItem[] {
  try {
    const stored = localStorage.getItem(WATCH_LATER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalWatchLater(items: WatchLaterItem[]) {
  try { localStorage.setItem(WATCH_LATER_STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function useWatchLater() {
  const { userId, isAuthenticated } = useUser();
  const { isIncognito } = useIncognito();
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (isAuthenticated && userId) {
        // ── Authenticated: SQLite is sole source of truth ──
        try {
          const response = await fetch('/api/watch-later', { signal: controller.signal });
          if (response.ok) {
            const serverData = await response.json();
            const serverItems: WatchLaterItem[] = (serverData || []).map((item: any) => ({
              id: item.id,
              videoId: item.video_id,
              title: item.title,
              thumbnail: item.thumbnail || '',
              channelName: item.channel_name || '',
              duration: item.duration || '',
              addedAt: item.created_at || new Date().toISOString(),
            }));
            setWatchLater(serverItems);
            setIsSynced(true);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      } else {
        // ── Unauthenticated: localStorage only ──
        setWatchLater(loadLocalWatchLater());
      }

      setIsLoaded(true);
    };

    loadData();
    return () => controller.abort();
  }, [isAuthenticated, userId]);

  const addToWatchLater = useCallback((video: Omit<WatchLaterItem, 'id' | 'addedAt'>) => {
    if (isIncognito) return undefined; // Blocked in incognito mode
    const newItem: WatchLaterItem = {
      ...video,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };

    if (isAuthenticated && userId) {
      setWatchLater(prev => {
        if (prev.some(item => item.videoId === video.videoId)) return prev;
        return [newItem, ...prev];
      });
      fetch('/api/watch-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...video }),
      }).catch(() => {});
    } else {
      setWatchLater(prev => {
        if (prev.some(item => item.videoId === video.videoId)) return prev;
        const updated = [newItem, ...prev];
        saveLocalWatchLater(updated);
        return updated;
      });
    }
    return newItem;
  }, [isAuthenticated, userId, isIncognito]);

  const removeFromWatchLater = useCallback((videoId: string) => {
    if (isAuthenticated && userId) {
      setWatchLater(prev => prev.filter(item => item.videoId !== videoId));
      fetch('/api/watch-later', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    } else {
      setWatchLater(prev => {
        const updated = prev.filter(item => item.videoId !== videoId);
        saveLocalWatchLater(updated);
        return updated;
      });
    }
  }, [isAuthenticated, userId]);

  const toggleWatchLater = useCallback((video: Omit<WatchLaterItem, 'id' | 'addedAt'>) => {
    const exists = watchLater.some(item => item.videoId === video.videoId);
    if (exists) {
      removeFromWatchLater(video.videoId);
      return false;
    } else {
      addToWatchLater(video);
      return true;
    }
  }, [watchLater, addToWatchLater, removeFromWatchLater]);

  const isInWatchLater = useCallback((videoId: string) => {
    return watchLater.some(item => item.videoId === videoId);
  }, [watchLater]);

  const getAllWatchLater = useCallback(() => {
    return [...watchLater].sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [watchLater]);

  return {
    watchLater,
    isLoaded,
    isSynced,
    addToWatchLater,
    removeFromWatchLater,
    toggleWatchLater,
    isInWatchLater,
    getAllWatchLater,
  };
}
