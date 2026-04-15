"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseVideoPlayerOptions, UseVideoPlayerReturn } from '../types';

export function useVideoPlayer({
  videoId,
  activeNoteRangeRef: externalActiveNoteRangeRef,
  loopNoteEnabledRef: externalLoopNoteEnabledRef,
  videoLoopEnabledRef: externalVideoLoopEnabledRef,
  isPrayerTime,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState<number>(-1);

  const requestRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);

  const isPlayerInteractive = useCallback(() => {
    return playerRef.current &&
      typeof playerRef.current.getCurrentTime === 'function' &&
      typeof playerRef.current.seekTo === 'function';
  }, []);

  const animate = useCallback(() => {
    if (isPlayerInteractive()) {
      try {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const now = performance.now();

        if (typeof time === 'number' && !isNaN(time)) {
          // Throttle state updates to ~4fps
          if (now - lastUpdateTimeRef.current >= 250) {
            setCurrentTime(time);
            lastUpdateTimeRef.current = now;
          }

          // Still check loop logic every frame for responsiveness
          const activeRange = externalActiveNoteRangeRef.current;
          const videoLoop = externalVideoLoopEnabledRef.current;
          const noteLoop = externalLoopNoteEnabledRef.current;

          if (activeRange) {
            if (time >= activeRange.end - 0.1) {
              if (noteLoop) {
                playerRef.current.seekTo(activeRange.start, true);
                playerRef.current.playVideo();
              } else {
                if (typeof playerRef.current.getPlayerState === 'function' && playerRef.current.getPlayerState() === 1) {
                  playerRef.current.pauseVideo();
                  playerRef.current.seekTo(activeRange.end, true);
                }
              }
            }
          } else if (videoLoop && duration > 0 && time >= duration - 0.2) {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          }
        }
      } catch (e) {
        // Silently catch errors if player is destroyed during animation
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlayerInteractive, externalActiveNoteRangeRef, externalLoopNoteEnabledRef, externalVideoLoopEnabledRef]);

  // Reset player state when video changes
  useEffect(() => {
    setPlayerReady(false);
    playerRef.current = null;
  }, [videoId]);

  // Pause video when prayer time starts
  useEffect(() => {
    if (isPrayerTime && isPlayerInteractive()) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {}
    }
  }, [isPrayerTime, isPlayerInteractive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, []);

  const onPlayerReady = useCallback((event: any) => {
    playerRef.current = event.target;
    setPlayerReady(true);

    if (isPlayerInteractive() && typeof playerRef.current.unMute === 'function') {
      try {
        playerRef.current.unMute();
      } catch (e) {}
    }

    if (isPlayerInteractive()) {
      try {
        playerRef.current.playVideo();
      } catch (e) {}
    }

    if (isPlayerInteractive()) {
      try {
        setPlayerState(playerRef.current.getPlayerState());
      } catch (e) {}
    }

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlayerInteractive, animate]);

  const onPlayerStateChange = useCallback((event: any) => {
    setPlayerState(event.data);
    if (event.data === 1) { // Playing
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(animate);
    } else if (event.data === 0) { // Ended
      if (externalVideoLoopEnabledRef.current && isPlayerInteractive() && !externalActiveNoteRangeRef.current) {
        try {
          playerRef.current.seekTo(0, true);
          playerRef.current.playVideo();
        } catch (e) {}
      }
    }
  }, [isPlayerInteractive, animate, externalVideoLoopEnabledRef, externalActiveNoteRangeRef]);

  const onPlaybackQualityChange = useCallback((_event: any) => {
    // No-op
  }, []);

  const getCurrentPlayerTime = useCallback(() => {
    let time = currentTime;
    if (isPlayerInteractive()) {
      try {
        const playerTime = playerRef.current.getCurrentTime();
        if (typeof playerTime === 'number' && !isNaN(playerTime)) {
          time = playerTime;
          setCurrentTime(time);
        }
      } catch (e) {}
    }
    return time;
  }, [currentTime, isPlayerInteractive]);

  return {
    playerRef,
    currentTime,
    playerState,
    playerReady,
    onPlayerReady,
    onPlayerStateChange,
    onPlaybackQualityChange,
    getCurrentPlayerTime,
    isPlayerInteractive,
  };
}
