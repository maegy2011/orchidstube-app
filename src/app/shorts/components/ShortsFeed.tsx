"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Timer } from 'lucide-react';
import type { ShortVideo } from './ShortsVideo';

interface ShortsFeedProps {
  ptClass: string;
  direction: string;
  currentIndex: number;
  totalVideos: number;
  isPaused: boolean;
  isMuted: boolean;
  showLimitModal: boolean;
  progress: number;
  currentShort: ShortVideo;
  playerRef: React.RefObject<any>;
  dailyShortsCount: number;
  shortsDailyLimit: number | undefined;
  onPrev: () => void;
  onNext: () => void;
  onPlayStateChange: (paused: boolean) => void;
  onVideoEnd: () => void;
  onToggleMute: () => void;
  onShieldTouchStart: (e: React.TouchEvent) => void;
  onShieldTouchMove: (e: React.TouchEvent) => void;
  onShieldTouchEnd: (e: React.TouchEvent) => void;
  onShieldClick: (e: React.MouseEvent) => void;
  t: (key: string) => string;
  renderVideo: () => React.ReactNode;
}

export default function ShortsFeed({
  ptClass,
  direction,
  currentIndex,
  totalVideos,
  showLimitModal,
  progress,
  onPrev,
  onNext,
  renderVideo,
  t,
}: ShortsFeedProps) {
  return (
    <div className={`flex-1 relative flex items-center justify-center ${ptClass}`}>
      {/* Scroll progress bar */}
      <div className="absolute top-2 right-3 z-30 w-1 h-12 rounded-full bg-white/10 overflow-hidden">
        <div className="w-full bg-primary rounded-full transition-all duration-300" style={{ height: `${progress}%` }} />
      </div>

      {/* Video index indicator */}
      <div className="absolute top-3 left-3 z-30">
        <span className="text-[10px] font-bold text-white/50 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
          {currentIndex + 1} / {totalVideos}
        </span>
      </div>

      {renderVideo()}

      {/* Desktop nav arrows (outside the video card) */}
      <div className="hidden sm:flex absolute z-30 gap-3" style={{ [direction === 'rtl' ? 'left' : 'right']: 'calc(50% + 240px)' }}>
        {currentIndex > 0 && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onPrev}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
        {currentIndex < totalVideos - 1 && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onNext}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-white/20 transition-all">
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Limit modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-7 max-w-sm w-full text-center space-y-5">
              <div className="flex justify-center">
                <div className="p-3.5 bg-primary/15 rounded-full">
                  <Timer className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-foreground">{t('dailyLimitReached')}</h2>
                <p className="text-muted-foreground text-sm">{t('shortsLimitReachedDesc')}</p>
              </div>
              <button onClick={() => window.location.href = '/'}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:bg-primary/90">
                {t('back')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
