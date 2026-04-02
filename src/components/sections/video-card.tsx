"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Clock, CheckCircle2, Check, MoreVertical, Share2, Flag, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  channelName: string;
  channelAvatar: string;
  isVerified: boolean;
}

interface VideoCardProps {
  video: Video;
  index: number;
  isInWatchLater: boolean;
  onToggleWatchLater: (e: React.MouseEvent, video: Video) => void;
  videoRef?: (el: HTMLDivElement | null) => void;
}

const VideoCard = memo(function VideoCard({
  video,
  index,
  isInWatchLater,
  onToggleWatchLater,
  videoRef,
}: VideoCardProps) {
  const { t, direction } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const viewsText = React.useMemo(() => {
    const v = video.views;
    if (!v) return `0 ${t("views")}`;
    return `${v} ${t("views")}`;
  }, [video.views, t]);

  return (
    <motion.div
      ref={videoRef}
      data-video-id={video.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: (index % 20) * 0.04,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group"
    >
      <Link href={`/watch/${video.id}`} className="flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted shadow-md">
          {/* Shimmer placeholder when image hasn't loaded */}
          {!imgError && (
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-0">
              <div className="w-full h-full bg-muted rounded-2xl" />
            </div>
          )}

          <img
            src={imgError ? `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title.slice(0, 20))}&background=random&size=640x360&format=svg` : video.thumbnail}
            alt={video.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgError && "opacity-30"
            )}
            loading="lazy"
            onError={() => setImgError(true)}
          />

          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Duration badge */}
          {video.duration && video.duration !== "0:00" && (
            <div className={cn(
              "absolute bottom-2 bg-black/85 backdrop-blur-sm text-white text-[11px] font-bold px-1.5 py-0.5 rounded-md",
              direction === "rtl" ? "left-2" : "right-2"
            )}>
              {video.duration}
            </div>
          )}

          {/* Watch Later button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onToggleWatchLater(e, video)}
            className={cn(
              "absolute top-2 p-1.5 rounded-lg transition-all duration-300 z-10",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              isInWatchLater
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm",
              direction === "rtl" ? "right-2" : "right-2"
            )}
            title={t("watchLater")}
            aria-label={isInWatchLater ? t("added_to_watch_later") : t("watchLater")}
          >
            <AnimatePresence mode="wait">
              {isInWatchLater ? (
                <motion.div
                  key="checked"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check size={16} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Clock size={16} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-300 shadow-xl">
              <Play className="text-white ml-0.5" size={24} fill="currentColor" />
            </div>
          </div>

          {/* Hover progress bar effect */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/0 group-hover:bg-white/20 transition-all duration-300">
            <div className="h-full w-0 group-hover:w-1/3 bg-primary transition-all duration-700 ease-out" />
          </div>
        </div>

        {/* Info section */}
        <div className="flex gap-3 min-h-[58px]">
          {/* Channel avatar */}
          <div className="shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-border/60 hover:border-primary/40 transition-colors duration-300">
              <img
                src={video.channelAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName)}&background=random&size=64`}
                alt={video.channelName}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName)}&background=random&size=64`;
                }}
              />
            </div>
          </div>

          {/* Text info */}
          <div className="flex flex-col gap-1 overflow-hidden min-w-0">
            <h3 className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {video.title}
            </h3>
            <div className="flex flex-col text-[12px] text-muted-foreground gap-0.5">
              <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <span className="truncate max-w-[180px]">{video.channelName}</span>
                {video.isVerified && (
                  <CheckCircle2 size={12} className="shrink-0 text-primary/70" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span>{viewsText}</span>
                {video.uploadedAt && video.uploadedAt !== t("unknown") && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{video.uploadedAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default VideoCard;
export type { Video, VideoCardProps };
