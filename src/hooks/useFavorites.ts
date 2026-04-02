"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';

export interface FavoriteItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

const FAVORITES_STORAGE_KEY = 'youtube-favorites';
const DENIED_STORAGE_KEY = 'youtube-denied-videos';
const MAX_DENIED = 1000;

/** Load from localStorage (unauthenticated users only) */
function loadLocalFavorites(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalFavorites(items: FavoriteItem[]) {
  try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function loadLocalDenied(): string[] {
  try {
    const stored = localStorage.getItem(DENIED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalDenied(items: string[]) {
  try { localStorage.setItem(DENIED_STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function useFavorites() {
  const { userId, isAuthenticated } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [deniedVideos, setDeniedVideos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (isAuthenticated && userId) {
        // ── Authenticated: SQLite is sole source of truth ──
        try {
          const [favRes, deniedRes] = await Promise.all([
            fetch('/api/favorites', { signal: controller.signal }),
            fetch('/api/denied-videos', { signal: controller.signal }),
          ]);

          if (favRes.ok) {
            const serverData = await favRes.json();
            const serverFavorites: FavoriteItem[] = (serverData || []).map((item: any) => ({
              id: item.id,
              videoId: item.video_id,
              title: item.title,
              thumbnail: item.thumbnail || '',
              channelName: item.channel_name || '',
              duration: item.duration || '',
              addedAt: item.created_at || new Date().toISOString(),
            }));
            setFavorites(serverFavorites);
            setIsSynced(true);
          }

          if (deniedRes.ok) {
            const serverDenied: string[] = await deniedRes.json();
            setDeniedVideos(serverDenied);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      } else {
        // ── Unauthenticated: localStorage only ──
        setFavorites(loadLocalFavorites());
        setDeniedVideos(loadLocalDenied());
      }

      setIsLoaded(true);
    };

    loadData();
    return () => controller.abort();
  }, [isAuthenticated, userId]);

  const addFavorite = useCallback((video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    const newFavorite: FavoriteItem = {
      ...video,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };

    if (isAuthenticated && userId) {
      // Optimistic update
      setFavorites(prev => {
        if (prev.some(f => f.videoId === video.videoId)) return prev;
        return [...prev, newFavorite];
      });
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...video }),
      }).catch(() => {});
    } else {
      setFavorites(prev => {
        if (prev.some(f => f.videoId === video.videoId)) return prev;
        const updated = [...prev, newFavorite];
        saveLocalFavorites(updated);
        return updated;
      });
    }
    return newFavorite;
  }, [isAuthenticated, userId]);

  const removeFavorite = useCallback((videoId: string) => {
    if (isAuthenticated && userId) {
      setFavorites(prev => prev.filter(f => f.videoId !== videoId));
      fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    } else {
      setFavorites(prev => {
        const updated = prev.filter(f => f.videoId !== videoId);
        saveLocalFavorites(updated);
        return updated;
      });
    }
  }, [isAuthenticated, userId]);

  const toggleFavorite = useCallback((video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    const exists = favorites.some(f => f.videoId === video.videoId);
    if (exists) {
      removeFavorite(video.videoId);
      return false;
    } else {
      addFavorite(video);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((videoId: string) => {
    return favorites.some(f => f.videoId === videoId);
  }, [favorites]);

  const denyVideo = useCallback((videoId: string) => {
    removeFavorite(videoId);

    if (isAuthenticated && userId) {
      setDeniedVideos(prev => {
        if (prev.includes(videoId)) return prev;
        if (prev.length >= MAX_DENIED) return [...prev.slice(1), videoId];
        return [...prev, videoId];
      });
      fetch('/api/denied-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    } else {
      setDeniedVideos(prev => {
        if (prev.includes(videoId)) return prev;
        const updated = prev.length >= MAX_DENIED ? [...prev.slice(1), videoId] : [...prev, videoId];
        saveLocalDenied(updated);
        return updated;
      });
    }
  }, [removeFavorite, isAuthenticated, userId]);

  const undenyVideo = useCallback((videoId: string) => {
    if (isAuthenticated && userId) {
      setDeniedVideos(prev => prev.filter(id => id !== videoId));
      fetch('/api/denied-videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      }).catch(() => {});
    } else {
      setDeniedVideos(prev => {
        const updated = prev.filter(id => id !== videoId);
        saveLocalDenied(updated);
        return updated;
      });
    }
  }, [isAuthenticated, userId]);

  const isDenied = useCallback((videoId: string) => {
    return deniedVideos.includes(videoId);
  }, [deniedVideos]);

  const getAllFavorites = useCallback(() => {
    return favorites.sort((a, b) =>
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [favorites]);

  return {
    favorites,
    deniedVideos,
    isLoaded,
    isSynced,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    denyVideo,
    undenyVideo,
    isDenied,
    getAllFavorites,
  };
}
