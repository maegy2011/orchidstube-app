"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { useIncognito } from '@/lib/incognito-context';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Playlist {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

interface LocalPlaylistData {
  playlists: Playlist[];
  items: Record<string, PlaylistItem[]>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLAYLISTS_STORAGE_KEY = 'orchids-playlists';

// ── localStorage helpers (unauthenticated users only) ──────────────────────────

function loadLocalData(): LocalPlaylistData {
  try {
    const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LocalPlaylistData;
      // Ensure every playlist has a videoCount computed from items
      const playlists = (parsed.playlists || []).map(p => ({
        ...p,
        videoCount: (parsed.items?.[p.id] || []).length,
      }));
      return { playlists, items: parsed.items || {} };
    }
  } catch { /* ignore */ }
  return { playlists: [], items: {} };
}

function saveLocalData(data: LocalPlaylistData) {
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Server response mapping ────────────────────────────────────────────────────

function mapServerPlaylist(item: any): Playlist {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    thumbnail: item.thumbnail || '',
    videoCount: item.videoCount ?? 0,
    createdAt: item.created_at || '',
    updatedAt: item.updated_at || '',
  };
}

function mapServerPlaylistItem(item: any): PlaylistItem {
  return {
    id: item.id,
    playlistId: item.playlist_id,
    videoId: item.video_id,
    title: item.title || '',
    thumbnail: item.thumbnail || '',
    channelName: item.channel_name || '',
    duration: item.duration || '',
    addedAt: item.created_at || new Date().toISOString(),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePlaylists() {
  const { userId, isAuthenticated } = useUser();
  const { isIncognito } = useIncognito();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, PlaylistItem[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load data on mount / auth change ────────────────────────────────────────

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (isAuthenticated && userId) {
        // ── Authenticated: API is sole source of truth ──
        try {
          const response = await fetch('/api/playlists', { signal: controller.signal });
          if (response.ok) {
            const serverData = await response.json();
            const serverPlaylists: Playlist[] = (serverData || []).map(mapServerPlaylist);
            setPlaylists(serverPlaylists);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      } else {
        // ── Unauthenticated: localStorage only ──
        const local = loadLocalData();
        setPlaylists(local.playlists);
        setItemsMap(local.items);
      }

      setIsLoaded(true);
    };

    loadData();
    return () => controller.abort();
  }, [isAuthenticated, userId]);

  // ── Local storage sync (unauthenticated) ────────────────────────────────────

  const persistLocal = useCallback((updatedPlaylists: Playlist[], updatedItems: Record<string, PlaylistItem[]>) => {
    if (isAuthenticated) return;
    saveLocalData({ playlists: updatedPlaylists, items: updatedItems });
  }, [isAuthenticated]);

  // ── createPlaylist ──────────────────────────────────────────────────────────

  const createPlaylist = useCallback((name: string, description?: string): Playlist | undefined => {
    const now = new Date().toISOString();
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      thumbnail: '',
      videoCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    setPlaylists(prev => [...prev, newPlaylist]);
    setItemsMap(prev => ({ ...prev, [newPlaylist.id]: [] }));

    if (isAuthenticated && userId) {
      fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      }).catch(() => {});
    } else {
      persistLocal([...playlists, newPlaylist], { ...itemsMap, [newPlaylist.id]: [] });
    }

    return newPlaylist;
  }, [isAuthenticated, userId, playlists, itemsMap, persistLocal]);

  // ── updatePlaylist ──────────────────────────────────────────────────────────

  const updatePlaylist = useCallback((id: string, updates: { name?: string; description?: string; thumbnail?: string }) => {
    const now = new Date().toISOString();

    setPlaylists(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: now } : p
      );
      if (!isAuthenticated) {
        saveLocalData({ playlists: updated, items: itemsMap });
      }
      return updated;
    });

    if (isAuthenticated && userId) {
      fetch('/api/playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => {});
    }
  }, [isAuthenticated, userId, itemsMap]);

  // ── deletePlaylist ──────────────────────────────────────────────────────────

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (!isAuthenticated) {
        const { [id]: _, ...restItems } = itemsMap;
        saveLocalData({ playlists: updated, items: restItems });
      }
      return updated;
    });

    setItemsMap(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });

    if (isAuthenticated && userId) {
      fetch('/api/playlists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
  }, [isAuthenticated, userId, itemsMap]);

  // ── addToPlaylist ───────────────────────────────────────────────────────────

  const addToPlaylist = useCallback((playlistId: string, video: { videoId: string; title: string; thumbnail?: string; channelName?: string; duration?: string }) => {
    if (isIncognito) return; // Blocked in incognito mode

    // Check if already in playlist
    const existing = itemsMap[playlistId] || [];
    if (existing.some(item => item.videoId === video.videoId)) return;

    const now = new Date().toISOString();
    const newItem: PlaylistItem = {
      id: crypto.randomUUID(),
      playlistId,
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail || '',
      channelName: video.channelName || '',
      duration: video.duration || '',
      addedAt: now,
    };

    // Update items map
    setItemsMap(prev => {
      const updated = {
        ...prev,
        [playlistId]: [...(prev[playlistId] || []), newItem],
      };
      if (!isAuthenticated) {
        const updatedPlaylists = playlists.map(p =>
          p.id === playlistId ? { ...p, videoCount: (updated[playlistId] || []).length } : p
        );
        saveLocalData({ playlists: updatedPlaylists, items: updated });
      }
      return updated;
    });

    // Update videoCount on playlist
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, videoCount: p.videoCount + 1 } : p
    ));

    if (isAuthenticated && userId) {
      fetch('/api/playlists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, ...video }),
      }).catch(() => {});
    }
  }, [isIncognito, isAuthenticated, userId, itemsMap, playlists]);

  // ── removeFromPlaylist ──────────────────────────────────────────────────────

  const removeFromPlaylist = useCallback((playlistId: string, videoId: string) => {
    // Update items map
    setItemsMap(prev => {
      const updated = {
        ...prev,
        [playlistId]: (prev[playlistId] || []).filter(item => item.videoId !== videoId),
      };
      if (!isAuthenticated) {
        const updatedPlaylists = playlists.map(p =>
          p.id === playlistId ? { ...p, videoCount: (updated[playlistId] || []).length } : p
        );
        saveLocalData({ playlists: updatedPlaylists, items: updated });
      }
      return updated;
    });

    // Update videoCount on playlist
    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, videoCount: Math.max(0, p.videoCount - 1) } : p
    ));

    if (isAuthenticated && userId) {
      fetch('/api/playlists/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, videoId }),
      }).catch(() => {});
    }
  }, [isAuthenticated, userId, playlists]);

  // ── isInPlaylist ────────────────────────────────────────────────────────────

  const isInPlaylist = useCallback((playlistId: string, videoId: string): boolean => {
    return (itemsMap[playlistId] || []).some(item => item.videoId === videoId);
  }, [itemsMap]);

  // ── getPlaylistsForVideo ────────────────────────────────────────────────────

  const getPlaylistsForVideo = useCallback((videoId: string): Playlist[] => {
    const result: Playlist[] = [];
    for (const playlist of playlists) {
      const items = itemsMap[playlist.id] || [];
      if (items.some(item => item.videoId === videoId)) {
        result.push(playlist);
      }
    }
    return result;
  }, [playlists, itemsMap]);

  // ── refreshPlaylist ─────────────────────────────────────────────────────────

  const refreshPlaylist = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/playlists/${id}`);
      if (response.ok) {
        const data = await response.json();

        // Update the playlist itself
        if (data.playlist) {
          const mapped = mapServerPlaylist(data.playlist);
          setPlaylists(prev => prev.map(p => p.id === id ? mapped : p));
        }

        // Update items for this playlist
        if (data.items) {
          const serverItems: PlaylistItem[] = (data.items || []).map(mapServerPlaylistItem);
          setItemsMap(prev => ({ ...prev, [id]: serverItems }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  return {
    playlists,
    isLoaded,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
    getPlaylistsForVideo,
    refreshPlaylist,
  };
}
