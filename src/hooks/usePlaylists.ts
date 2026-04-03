"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { useIncognito } from '@/lib/incognito-context';
import { toast } from 'sonner';

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

  // Refs to avoid stale closures
  const playlistsRef = useRef(playlists);
  const itemsMapRef = useRef(itemsMap);
  playlistsRef.current = playlists;
  itemsMapRef.current = itemsMap;

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

            // Fetch items for ALL playlists so isInPlaylist works
            const itemsResponses = await Promise.allSettled(
              serverPlaylists.map(p =>
                fetch(`/api/playlists/${p.id}`, { signal: controller.signal }).then(r => r.ok ? r.json() : null)
              )
            );

            const newItemsMap: Record<string, PlaylistItem[]> = {};
            for (let i = 0; i < serverPlaylists.length; i++) {
              const result = itemsResponses[i];
              if (result.status === 'fulfilled' && result.value?.items) {
                newItemsMap[serverPlaylists[i].id] = result.value.items.map(mapServerPlaylistItem);
              } else {
                newItemsMap[serverPlaylists[i].id] = [];
              }
            }
            setItemsMap(newItemsMap);
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

    setPlaylists(prev => [...prev, newPlaylist]);
    setItemsMap(prev => ({ ...prev, [newPlaylist.id]: [] }));

    if (isAuthenticated && userId) {
      fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      }).catch(() => {
        toast.error('Failed to create playlist');
        setPlaylists(prev => prev.filter(p => p.id !== newPlaylist.id));
      });
    } else {
      const updatedPlaylists = [...playlistsRef.current, newPlaylist];
      const updatedItems = { ...itemsMapRef.current, [newPlaylist.id]: [] };
      persistLocal(updatedPlaylists, updatedItems);
    }

    return newPlaylist;
  }, [isAuthenticated, userId, persistLocal]);

  // ── updatePlaylist ──────────────────────────────────────────────────────────

  const updatePlaylist = useCallback((id: string, updates: { name?: string; description?: string; thumbnail?: string }) => {
    const now = new Date().toISOString();

    setPlaylists(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: now } : p
      );
      if (!isAuthenticated) {
        saveLocalData({ playlists: updated, items: itemsMapRef.current });
      }
      return updated;
    });

    if (isAuthenticated && userId) {
      fetch('/api/playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => {
        toast.error('Failed to update playlist');
      });
    }
  }, [isAuthenticated, userId]);

  // ── deletePlaylist ──────────────────────────────────────────────────────────

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (!isAuthenticated) {
        const { [id]: _, ...restItems } = itemsMapRef.current;
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
      }).catch(() => {
        toast.error('Failed to delete playlist');
      });
    }
  }, [isAuthenticated, userId]);

  // ── addToPlaylist ───────────────────────────────────────────────────────────

  const addToPlaylist = useCallback((playlistId: string, video: { videoId: string; title: string; thumbnail?: string; channelName?: string; duration?: string }) => {
    if (isIncognito) return;

    // Check if already in playlist
    const existing = itemsMapRef.current[playlistId] || [];
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
        const updatedPlaylists = playlistsRef.current.map(p =>
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

    // Auto-set thumbnail if playlist has none and video has one
    const playlist = playlistsRef.current.find(p => p.id === playlistId);
    if (playlist && !playlist.thumbnail && video.thumbnail) {
      setPlaylists(prev => prev.map(p =>
        p.id === playlistId ? { ...p, thumbnail: video.thumbnail || '' } : p
      ));
    }

    if (isAuthenticated && userId) {
      fetch('/api/playlists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, ...video }),
      }).catch(() => {
        toast.error('Failed to add to playlist');
        // Revert optimistic update
        setItemsMap(prev => ({
          ...prev,
          [playlistId]: (prev[playlistId] || []).filter(i => i.videoId !== video.videoId),
        }));
        setPlaylists(prev => prev.map(p =>
          p.id === playlistId ? { ...p, videoCount: Math.max(0, p.videoCount - 1) } : p
        ));
      });
    }
  }, [isIncognito, isAuthenticated, userId]);

  // ── removeFromPlaylist ──────────────────────────────────────────────────────

  const removeFromPlaylist = useCallback((playlistId: string, videoId: string) => {
    // Update items map
    setItemsMap(prev => {
      const updated = {
        ...prev,
        [playlistId]: (prev[playlistId] || []).filter(item => item.videoId !== videoId),
      };
      if (!isAuthenticated) {
        const updatedPlaylists = playlistsRef.current.map(p =>
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
      }).catch(() => {
        toast.error('Failed to remove from playlist');
      });
    }
  }, [isAuthenticated, userId]);

  // ── isInPlaylist ────────────────────────────────────────────────────────────

  const isInPlaylist = useCallback((playlistId: string, videoId: string): boolean => {
    return (itemsMapRef.current[playlistId] || []).some(item => item.videoId === videoId);
  }, []);

  // ── getPlaylistsForVideo ────────────────────────────────────────────────────

  const getPlaylistsForVideo = useCallback((videoId: string): Playlist[] => {
    const result: Playlist[] = [];
    for (const playlist of playlistsRef.current) {
      const items = itemsMapRef.current[playlist.id] || [];
      if (items.some(item => item.videoId === videoId)) {
        result.push(playlist);
      }
    }
    return result;
  }, []);

  // ── refreshPlaylist ─────────────────────────────────────────────────────────

  const refreshPlaylist = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/playlists/${id}`);
      if (response.ok) {
        const data = await response.json();

        if (data.playlist) {
          const mapped = mapServerPlaylist(data.playlist);
          setPlaylists(prev => prev.map(p => p.id === id ? mapped : p));
        }

        if (data.items) {
          const serverItems: PlaylistItem[] = (data.items || []).map(mapServerPlaylistItem);
          setItemsMap(prev => ({ ...prev, [id]: serverItems }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  return {
    playlists,
    itemsMap,
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
