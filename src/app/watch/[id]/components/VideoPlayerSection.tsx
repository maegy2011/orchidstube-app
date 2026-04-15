"use client";

import React from 'react';
import { Quote, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CleanYouTubePlayer } from '@/components/ui/clean-youtube-player';
import { VideoNote } from '@/lib/types';
import type { UseVideoPlayerReturn } from '../types';

interface VideoPlayerSectionProps {
  videoId: string;
  startTime: string | null;
  isWatchLocked: boolean;
  setIsWatchLocked: (v: boolean) => void;
  theaterMode: boolean;
  setTheaterMode: (v: boolean) => void;
  player: UseVideoPlayerReturn;
  activeSubtitleNote: VideoNote | undefined;
  language: string;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function VideoPlayerSection({
  videoId,
  startTime,
  isWatchLocked,
  setIsWatchLocked,
  theaterMode,
  setTheaterMode,
  player,
  activeSubtitleNote,
  language,
  videoContainerRef,
}: VideoPlayerSectionProps) {
  return (
    <div ref={videoContainerRef} className="lg:sticky lg:top-[72px] z-[50] relative w-full aspect-video bg-black rounded-none lg:rounded-2xl overflow-hidden mb-4 shadow-2xl group/player">
      <div className="relative w-full h-full">
        <CleanYouTubePlayer
          videoId={videoId}
          startTime={startTime ? parseInt(startTime) : 0}
          onReady={player.onPlayerReady}
          onStateChange={player.onPlayerStateChange}
          isLocked={isWatchLocked}
          onLockToggle={setIsWatchLocked}
        />
      </div>

      {/* Theater Mode Toggle */}
      <button
        onClick={() => setTheaterMode(!theaterMode)}
        className="absolute top-3 right-3 z-30 p-2 rounded-xl backdrop-blur-md transition-all duration-300 border border-white/20 bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover/player:opacity-100"
        title={language === 'ar' ? (theaterMode ? 'إلغاء وضع المسرح' : 'وضع المسرح') : (theaterMode ? 'Exit Theater' : 'Theater Mode')}
      >
        {theaterMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      {/* Theater Mode Indicator */}
      <AnimatePresence>
        {theaterMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-bold border border-white/10 pointer-events-none"
          >
            <Maximize2 size={10} />
            {language === 'ar' ? 'المسرح' : 'Theater'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Subtitle Note Overlay */}
      <AnimatePresence>
        {activeSubtitleNote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-14 left-0 right-0 z-30 px-4 pointer-events-none"
          >
            <div className="max-w-xl mx-auto">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/80 flex items-center justify-center shrink-0">
                  <Quote size={12} className="text-white" />
                </div>
                <p className="text-white text-sm font-medium leading-relaxed text-center break-words">
                  {activeSubtitleNote.content}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
