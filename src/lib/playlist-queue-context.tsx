"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { PlaylistItem } from '@/hooks/usePlaylists';

interface PlaylistQueueState {
  playlistId: string | null;
  playlistName: string | null;
  items: PlaylistItem[];
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  loop: boolean;
  autoplay: boolean;
}

interface PlaylistQueueContextType extends PlaylistQueueState {
  playPlaylist: (playlistId: string, playlistName: string, items: PlaylistItem[], startIndex?: number) => void;
  playFromIndex: (index: number) => void;
  nextVideo: () => PlaylistItem | null;
  prevVideo: () => PlaylistItem | null;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  toggleAutoplay: () => void;
  clearQueue: () => void;
  removeItem: (videoId: string) => void;
  currentVideoId: string | null;
  hasNext: boolean;
  hasPrev: boolean;
  shuffledOrder: number[];
}

const PlaylistQueueContext = createContext<PlaylistQueueContextType | null>(null);

export function PlaylistQueueProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlaylistQueueState>({
    playlistId: null,
    playlistName: null,
    items: [],
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    loop: false,
    autoplay: true,
  });

  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const stateRef = useRef<PlaylistQueueState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Generate shuffled order using Fisher-Yates
  const generateShuffle = useCallback((length: number, currentIdx: number): number[] => {
    const indices = Array.from({ length }, (_, i) => i);
    // Remove current index, shuffle rest, prepend current
    const rest = indices.filter(i => i !== currentIdx);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return [currentIdx, ...rest];
  }, []);

  const playPlaylist = useCallback((playlistId: string, playlistName: string, items: PlaylistItem[], startIndex = 0) => {
    const safeIndex = Math.min(startIndex, items.length - 1);
    setState({
      playlistId,
      playlistName,
      items,
      currentIndex: safeIndex,
      isPlaying: true,
      shuffle: false,
      loop: false,
      autoplay: true,
    });
    setShuffledOrder(generateShuffle(items.length, safeIndex));
  }, [generateShuffle]);

  const playFromIndex = useCallback((index: number) => {
    setState(prev => {
      if (index < 0 || index >= prev.items.length) return prev;
      return { ...prev, currentIndex: index, isPlaying: true };
    });
  }, []);

  const nextVideo = useCallback((): PlaylistItem | null => {
    const s = stateRef.current;
    if (!s || !s.items.length || s.currentIndex < 0) return null;

    if (s.shuffle) {
      // Find current position in shuffled order
      const currentShufflePos = shuffledOrder.indexOf(s.currentIndex);
      if (currentShufflePos < shuffledOrder.length - 1) {
        const nextIdx = shuffledOrder[currentShufflePos + 1];
        setState(prev => ({ ...prev, currentIndex: nextIdx }));
        return s.items[nextIdx];
      } else if (s.loop) {
        const nextIdx = shuffledOrder[0];
        setState(prev => ({ ...prev, currentIndex: nextIdx }));
        return s.items[nextIdx];
      }
      return null;
    }

    if (s.currentIndex < s.items.length - 1) {
      const nextIdx = s.currentIndex + 1;
      setState(prev => ({ ...prev, currentIndex: nextIdx }));
      return s.items[nextIdx];
    } else if (s.loop) {
      setState(prev => ({ ...prev, currentIndex: 0 }));
      return s.items[0];
    }
    return null;
  }, [shuffledOrder]);

  const prevVideo = useCallback((): PlaylistItem | null => {
    const s = stateRef.current;
    if (!s || !s.items.length || s.currentIndex <= 0) return null;
    const prevIdx = s.currentIndex - 1;
    setState(prev => ({ ...prev, currentIndex: prevIdx }));
    return s.items[prevIdx];
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => {
      const newShuffle = !prev.shuffle;
      if (newShuffle) {
        setShuffledOrder(generateShuffle(prev.items.length, prev.currentIndex));
      }
      return { ...prev, shuffle: newShuffle };
    });
  }, [generateShuffle]);

  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, loop: !prev.loop }));
  }, []);

  const toggleAutoplay = useCallback(() => {
    setState(prev => ({ ...prev, autoplay: !prev.autoplay }));
  }, []);

  const clearQueue = useCallback(() => {
    setState({
      playlistId: null,
      playlistName: null,
      items: [],
      currentIndex: -1,
      isPlaying: false,
      shuffle: false,
      loop: false,
      autoplay: true,
    });
    setShuffledOrder([]);
  }, []);

  const removeItem = useCallback((videoId: string) => {
    setState(prev => {
      const itemIndex = prev.items.findIndex(item => item.videoId === videoId);
      if (itemIndex === -1) return prev;
      const newItems = prev.items.filter(item => item.videoId !== videoId);
      let newIndex = prev.currentIndex;
      const isCurrentVideo = prev.items[prev.currentIndex]?.videoId === videoId;
      if (isCurrentVideo && newItems.length > 0) {
        newIndex = Math.min(prev.currentIndex, newItems.length - 1);
      } else if (itemIndex < prev.currentIndex) {
        newIndex = prev.currentIndex - 1;
      }
      return { ...prev, items: newItems, currentIndex: newIndex };
    });
  }, []);

  const currentVideoId = state.items.length > 0 && state.currentIndex >= 0
    ? state.items[state.currentIndex]?.videoId
    : null;

  const hasNext = state.items.length > 0 && (
    state.shuffle
      ? shuffledOrder.indexOf(state.currentIndex) < shuffledOrder.length - 1 || state.loop
      : state.currentIndex < state.items.length - 1 || state.loop
  );

  const hasPrev = state.items.length > 0 && state.currentIndex > 0;

  return (
    <PlaylistQueueContext.Provider value={{
      ...state,
      playPlaylist,
      playFromIndex,
      nextVideo,
      prevVideo,
      toggleShuffle,
      toggleLoop,
      toggleAutoplay,
      clearQueue,
      removeItem,
      currentVideoId,
      hasNext,
      hasPrev,
      shuffledOrder,
    }}>
      {children}
    </PlaylistQueueContext.Provider>
  );
}

export function usePlaylistQueue() {
  const ctx = useContext(PlaylistQueueContext);
  if (!ctx) throw new Error('usePlaylistQueue must be used within PlaylistQueueProvider');
  return ctx;
}
