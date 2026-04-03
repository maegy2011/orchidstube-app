"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { usePlaylistQueue } from "@/lib/playlist-queue-context";
import { useI18n } from "@/lib/i18n-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ChevronDown,
  ChevronUp,
  Clock,
  ListVideo,
} from "lucide-react";

export default function PlaylistQueue() {
  const {
    playlistId,
    playlistName,
    items,
    currentIndex,
    shuffle,
    loop,
    autoplay,
    toggleShuffle,
    toggleLoop,
    toggleAutoplay,
    playFromIndex,
    nextVideo,
    prevVideo,
    clearQueue,
    currentVideoId,
    hasNext,
    hasPrev,
  } = usePlaylistQueue();

  const { t, direction } = useI18n();
  const router = useRouter();

  if (!playlistId || items.length === 0) return null;

  const handleItemClick = (videoId: string, index: number) => {
    playFromIndex(index);
    router.push(`/watch/${videoId}`);
  };

  const handleNext = () => {
    const next = nextVideo();
    if (next) {
      router.push(`/watch/${next.videoId}`);
    }
  };

  const handlePrev = () => {
    const prev = prevVideo();
    if (prev) {
      router.push(`/watch/${prev.videoId}`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ListVideo size={16} className="text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{t("playingFrom")}</p>
            <p className="text-[10px] text-muted-foreground truncate">{playlistName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-lg transition-colors ${
              shuffle
                ? "text-red-500 bg-red-50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={t("shuffle")}
          >
            <Shuffle size={14} />
          </button>
          {/* Loop */}
          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg transition-colors ${
              loop
                ? "text-red-500 bg-red-50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={t("loopPlaylist")}
          >
            <Repeat size={14} />
          </button>
          {/* Close */}
          <button
            onClick={clearQueue}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Navigation Controls ────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-2 px-3 border-b border-border/30">
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`p-2 rounded-full transition-all ${
            hasPrev
              ? "text-foreground hover:bg-muted active:scale-90"
              : "text-muted-foreground/30 cursor-not-allowed"
          }`}
          title={t("prevVideo")}
        >
          <SkipBack size={16} />
        </button>
        <span className="text-xs font-bold text-muted-foreground tabular-nums px-3">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className={`p-2 rounded-full transition-all ${
            hasNext
              ? "text-foreground hover:bg-muted active:scale-90"
              : "text-muted-foreground/30 cursor-not-allowed"
          }`}
          title={t("nextVideo")}
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* ── Video list ─────────────────────────────────────────────────── */}
      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const isCurrent = item.videoId === currentVideoId;
            const isNext = index === currentIndex + 1;

            return (
              <motion.button
                key={item.videoId}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => handleItemClick(item.videoId, index)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-start transition-colors ${
                  isCurrent
                    ? "bg-red-50/80 dark:bg-red-950/20"
                    : isNext
                      ? "bg-muted/40 hover:bg-muted/60"
                      : "hover:bg-muted/40"
                }`}
              >
                {/* Index / Now Playing indicator */}
                <div className="w-6 shrink-0 flex items-center justify-center">
                  {isCurrent ? (
                    <div className="flex items-center gap-0.5">
                      <span className="w-0.5 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="w-0.5 h-4 bg-red-500 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-0.5 h-2 bg-red-500 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground/60 tabular-nums">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="relative w-20 aspect-video rounded-md overflow-hidden bg-muted shrink-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  {item.duration && (
                    <div className="absolute bottom-0.5 end-0.5 px-1 py-px bg-black/70 text-white text-[9px] font-bold rounded-sm flex items-center gap-0.5">
                      <Clock size={7} />
                      {item.duration}
                    </div>
                  )}
                  {!isCurrent && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <Play size={10} className="text-white fill-current" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[11px] font-semibold line-clamp-2 leading-snug ${
                      isCurrent ? "text-red-600" : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </p>
                  {isCurrent && (
                    <p className="text-[9px] text-red-500 font-bold mt-0.5">
                      {t("nowPlaying")}
                    </p>
                  )}
                  {isNext && !isCurrent && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {t("upNext")}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Autoplay toggle footer ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
        <span className="text-[10px] font-medium text-muted-foreground">
          {t("autoplay")}
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={toggleAutoplay}
            className="w-3.5 h-3.5 rounded border-border accent-red-500"
          />
        </label>
      </div>
    </div>
  );
}
