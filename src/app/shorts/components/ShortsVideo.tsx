"use client";

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Play, Volume2, VolumeX, MessageCircle, Share2, Music2, ThumbsUp, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaPlayer, MediaProvider, MediaPlayerInstance } from '@vidstack/react';
import '@vidstack/react/player/styles/base.css';
import { Loader2 } from 'lucide-react';
import SafeAvatar from '@/app/watch/[id]/components/SafeAvatar';

export interface ShortVideo {
  id: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  views: string;
}

export interface ShortsPlayerHandle {
  play: () => void;
  pause: () => void;
}

const SafeShortsPlayer = forwardRef<ShortsPlayerHandle, {
  video: ShortVideo;
  isMuted: boolean;
  onEnded: () => void;
  onPlayStateChange: (paused: boolean) => void;
}>(({ video, isMuted, onEnded, onPlayStateChange }, ref) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [mounted, setMounted] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(`youtube/${video.id}`);
  const aliveRef = useRef(true);
  const mountedRef = useRef(false);

  useEffect(() => {
    const src = `youtube/${video.id}`;
    if (src !== currentSrc) {
      setCurrentSrc(src);
    }
  }, [video.id, currentSrc]);

  useImperativeHandle(ref, () => ({
    play: () => {
      try {
        if (!aliveRef.current || !mountedRef.current) return;
        if (playerRef.current && !playerRef.current.paused) return;
        playerRef.current?.play().catch(() => {});
      } catch {}
    },
    pause: () => {
      try {
        if (!aliveRef.current || !mountedRef.current) return;
        if (playerRef.current && playerRef.current.paused) return;
        playerRef.current?.pause().catch(() => {});
      } catch {}
    },
  }));

  useEffect(() => {
    setMounted(false);
    mountedRef.current = false;
    const t = setTimeout(() => {
      if (aliveRef.current) {
        setMounted(true);
        mountedRef.current = true;
      }
    }, 150);
    return () => {
      clearTimeout(t);
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      mountedRef.current = false;
      setMounted(false);
      try {
        const p = playerRef.current;
        if (p) {
          (p.pause() as any)?.catch?.(() => {});
          (p.destroy?.() as any)?.catch?.(() => {});
        }
      } catch {}
    };
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-white/15 animate-spin" />
      </div>
    );
  }

  return (
    <MediaPlayer
      ref={playerRef}
      title={video.title}
      src={currentSrc}
      autoplay
      playsInline
      muted={isMuted}
      onEnded={onEnded}
      onPlay={() => onPlayStateChange(false)}
      onPause={() => onPlayStateChange(true)}
      className="w-full h-full pointer-events-none"
      onError={(e: any) => {
        const msg = (e?.detail as any)?.message ?? '';
        if (msg.includes('destroyed') || msg.includes('aborted') || msg.includes('waiting')) return;
      }}
    >
      <MediaProvider className="w-full h-full" />
    </MediaPlayer>
  );
});
SafeShortsPlayer.displayName = 'SafeShortsPlayer';

interface ShortsVideoProps {
  video: ShortVideo;
  isPaused: boolean;
  isMuted: boolean;
  playerRef: React.RefObject<ShortsPlayerHandle | null>;
  direction: string;
  dailyShortsCount: number;
  shortsDailyLimit: number | undefined;
  onPlayStateChange: (paused: boolean) => void;
  onVideoEnd: () => void;
  onToggleMute: () => void;
  onShieldTouchStart: (e: React.TouchEvent) => void;
  onShieldTouchMove: (e: React.TouchEvent) => void;
  onShieldTouchEnd: (e: React.TouchEvent) => void;
  onShieldClick: (e: React.MouseEvent) => void;
  t: (key: string) => string;
}

export default function ShortsVideo({
  video,
  isPaused,
  isMuted,
  playerRef,
  direction,
  dailyShortsCount,
  shortsDailyLimit,
  onPlayStateChange,
  onVideoEnd,
  onToggleMute,
  onShieldTouchStart,
  onShieldTouchMove,
  onShieldTouchEnd,
  onShieldClick,
  t,
}: ShortsVideoProps) {
  return (
    <div className="relative w-full max-w-[420px] aspect-[9/16] bg-[#0a0a0a] sm:rounded-2xl overflow-hidden shadow-2xl">

      {/* z-0: Player (non-interactive) */}
      <div className="absolute inset-0 z-0">
        <SafeShortsPlayer
          ref={playerRef}
          video={video}
          isMuted={isMuted}
          onEnded={onVideoEnd}
          onPlayStateChange={onPlayStateChange}
        />
      </div>

      {/* z-10: Gradient + info (purely visual) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={video.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-5">

            {/* Top bar */}
            <div className="flex justify-between items-start">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10"
              >
                <Timer className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[11px] font-bold text-white">{dailyShortsCount} / {shortsDailyLimit || '∞'}</span>
              </motion.div>
            </div>

            {/* Bottom info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <SafeAvatar
                    src={video.channelAvatar}
                    name={video.channelName}
                    size={36}
                    className="border border-white/15"
                  />
                  <span className="font-semibold text-white text-xs truncate">{video.channelName}</span>
                  <button className="bg-white text-foreground text-[10px] font-bold px-3 py-1 rounded-full hover:bg-white/90 transition-colors active:scale-95">
                    {t('subscribe')}
                  </button>
                </div>
                <p className="text-white text-sm line-clamp-2 leading-relaxed">{video.title}</p>
                <div className="flex items-center gap-1.5 text-white/60 text-[11px]">
                  <Music2 className="w-3 h-3 animate-[spin_3s_linear_infinite]" />
                  <span className="truncate">Original Sound - {video.channelName}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* z-20: Pause indicator (purely visual) */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Play className="w-7 h-7 text-white ms-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* z-30: INTERACTION SHIELD — captures all touch/click */}
      <div
        className="absolute inset-0 z-30"
        onTouchStart={onShieldTouchStart}
        onTouchMove={onShieldTouchMove}
        onTouchEnd={onShieldTouchEnd}
        onClick={onShieldClick}
      />

      {/* z-40: Interactive buttons (above the shield) */}
      {/* Mute button (top-right) */}
      <div className="absolute top-5 z-40 flex items-center justify-end p-5 pt-0"
        style={{ [direction === 'rtl' ? 'left' : 'right']: '0' }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="p-2 bg-black/25 backdrop-blur-md rounded-full text-white border border-white/10"
        >
          {isMuted ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
        </motion.button>
      </div>

      {/* Side action buttons */}
      <div className={`absolute bottom-24 z-40 flex flex-col items-center gap-5 ${direction === 'rtl' ? 'left-4' : 'right-4'}`}>
        {[
          { icon: <ThumbsUp className="w-5 h-5" />, label: video.views, delay: 0.4 },
          { icon: <MessageCircle className="w-5 h-5" />, label: '', delay: 0.5 },
          { icon: <Share2 className="w-5 h-5" />, label: '', delay: 0.6 },
        ].map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: direction === 'rtl' ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: action.delay }}
            className="flex flex-col items-center gap-1"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => e.stopPropagation()}
              className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 transition-all hover:bg-white/20"
            >
              {action.icon}
            </motion.button>
            {action.label && <span className="text-[10px] font-semibold text-white/80">{action.label}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
