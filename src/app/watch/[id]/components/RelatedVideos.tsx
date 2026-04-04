"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Sparkles, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface RelatedVideosProps {
  video: any;
  t: (key: any) => string;
  direction: string;
  language: string;
  theaterMode: boolean;
  chapters: { time: string; title: string; seconds: number }[];
  onSeekTo: (seconds: number) => void;
  isPlayerInteractive: () => boolean;
  onScrollToPlayer: () => void;
}

export default function RelatedVideos({
  video,
  t,
  language,
  theaterMode,
  chapters,
  onSeekTo,
  isPlayerInteractive,
  onScrollToPlayer,
}: RelatedVideosProps) {
  const hasRelated = video?.relatedVideos && video.relatedVideos.length > 0;

  return (
    <div className={cn(
      "w-full lg:w-[380px] xl:w-[400px] shrink-0 transition-all duration-500 overflow-hidden",
      theaterMode ? "hidden lg:block lg:w-0 lg:opacity-0 lg:invisible" : "hidden lg:block"
    )}>
      <div className="sticky top-[72px] space-y-4 max-h-[calc(100vh-88px)] overflow-y-auto no-scrollbar pb-6">
        {/* Chapters in sidebar */}
        {chapters.length >= 2 && (
          <div className="px-1 pb-2">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Film size={14} className="text-primary" />
              {language === 'ar' ? 'الفصول' : 'Chapters'}
              <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">{chapters.length}</span>
            </h3>
            <div className="bg-muted/20 border border-border/30 rounded-xl overflow-hidden divide-y divide-border/20 max-h-48 overflow-y-auto no-scrollbar">
              {chapters.slice(0, 8).map((ch, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (isPlayerInteractive()) {
                      onSeekTo(ch.seconds);
                    }
                    onScrollToPlayer();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-start group"
                >
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{ch.time}</span>
                  <span className="text-xs text-foreground/70 group-hover:text-foreground truncate">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar header */}
        <div className="px-1 pb-2">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            {t('suggested_videos')}
            {hasRelated && (
              <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">
                {(video.relatedVideos || []).length}
              </span>
            )}
          </h3>
        </div>

        {/* Related videos list */}
        {hasRelated && (
          <div className="space-y-1.5">
            {(video.relatedVideos || []).slice(0, 12).map((v: any) => (
              <RelatedVideoCard key={v.id} video={v} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const RelatedVideoCard = memo(function RelatedVideoCard({ video, compact = false }: { video: any; compact?: boolean }) {
  const { language } = useI18n();

  return (
    <Link href={`/watch/${video.id}`} className="flex gap-3 group p-1.5 rounded-xl hover:bg-muted/50 transition-all hover:translate-y-[-1px]">
      <div className="relative shrink-0 aspect-video rounded-xl overflow-hidden bg-muted shadow-sm ring-1 ring-border/30"
        style={{ width: compact ? '128px' : '160px' }}
      >
        <img
          src={video.thumbnail || "/placeholder-video.jpg"}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <span className="absolute bottom-1 end-1 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded-md">
          {video.duration}
        </span>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className={cn(
          "font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug",
          compact ? "text-xs" : "text-sm"
        )}>
          {video.title}
        </h3>
        <p className={cn("text-muted-foreground truncate", compact ? "text-[11px]" : "text-xs")}>{video.channelName}</p>
        <p className={cn("text-muted-foreground truncate mt-0.5", compact ? "text-[11px]" : "text-xs")}>{video.views}</p>
      </div>
    </Link>
  );
});
