"use client";

import React, { useState, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Clock, CheckCircle2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useWatchLater } from "@/hooks/useWatchLater";

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

interface CompactCardProps {
  video: Video;
  index: number;
}

const CompactCard = memo(function CompactCard({ video, index }: CompactCardProps) {
  const { t, direction } = useI18n();
  const { toggleWatchLater, isInWatchLater } = useWatchLater();
  const [imgError, setImgError] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const isSaved = isInWatchLater(video.id);

  const handleWatchLater = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchLater(video as any);
  };

  const viewsText = `${video.views} ${t("views")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group shrink-0 w-[260px] sm:w-[280px] md:w-[300px]"
    >
      <Link
        href={`/watch/${video.id}`}
        className="flex flex-col gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded-2xl"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted shadow-sm">
          <img
            src={
              imgError
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title.slice(0, 20))}&background=random&size=640x360&format=svg`
                : video.thumbnail
            }
            alt={video.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
              imgError && "opacity-30"
            )}
            loading="lazy"
            onError={() => setImgError(true)}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Duration badge */}
          {video.duration && video.duration !== "0:00" && (
            <div
              className={cn(
                "absolute bottom-1.5 bg-black/85 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                "end-1.5"
              )}
            >
              {video.duration}
            </div>
          )}

          {/* Watch Later */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleWatchLater}
            className={cn(
              "absolute top-1.5 p-1 rounded-md transition-all duration-300 z-10",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
              isSaved
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm",
              "end-1.5"
            )}
          >
            {isSaved ? <Check size={14} /> : <Clock size={14} />}
          </motion.button>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center scale-50 group-hover:scale-100 transition-transform duration-300 shadow-lg">
              <Play className="text-white ms-0.5" size={18} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Info — compact 2-line layout */}
        <div className="flex gap-2.5 min-h-[44px]">
          <div className="shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border/50">
              {!avatarFailed && video.channelAvatar ? (
                <img
                  src={video.channelAvatar}
                  alt={video.channelName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-black text-[9px]">{video.channelName?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden min-w-0">
            <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {video.title}
            </h3>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="truncate max-w-[140px]">{video.channelName}</span>
              {video.isVerified && <CheckCircle2 size={10} className="shrink-0 text-primary/60" />}
              <span className="text-muted-foreground/40">·</span>
              <span className="shrink-0">{viewsText}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

export default CompactCard;
export type { Video };
