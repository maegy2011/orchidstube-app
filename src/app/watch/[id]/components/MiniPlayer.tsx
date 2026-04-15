"use client";

import React from 'react';
import { X, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoDetails } from '@/lib/types';
import type { UseVideoPlayerReturn } from '../types';

interface MiniPlayerProps {
  video: VideoDetails;
  videoId: string;
  player: UseVideoPlayerReturn;
  showMiniPlayer: boolean;
  setShowMiniPlayer: (v: boolean) => void;
  setMiniPlayerDismissed: (v: boolean) => void;
  scrollToPlayer: () => void;
}

export default function MiniPlayer({
  video,
  videoId,
  showMiniPlayer,
  setShowMiniPlayer,
  setMiniPlayerDismissed,
  scrollToPlayer,
}: MiniPlayerProps) {
  return (
    <AnimatePresence>
      {showMiniPlayer && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 end-4 z-[80] w-[320px] rounded-xl overflow-hidden shadow-2xl border border-border/60 bg-card"
        >
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer"
              title={video.title}
            />
            {/* Close button */}
            <button
              onClick={() => { setMiniPlayerDismissed(true); setShowMiniPlayer(false); }}
              className="absolute top-2 end-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors z-10"
            >
              <X size={14} />
            </button>
          </div>
          {/* Title bar */}
          <button
            onClick={scrollToPlayer}
            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-start"
          >
            <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center shrink-0">
              <ArrowUp size={10} className="text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground line-clamp-1 flex-1">{video.title}</p>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
