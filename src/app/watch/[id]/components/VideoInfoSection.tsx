"use client";

import React, { useState, useCallback } from 'react';
import {
  Share2,
  Check,
  Copy,
  ThumbsUp,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  BookmarkPlus,
  Sparkles,
  Film,
  MoreVertical,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '../utils/time';
import { formatViewsCount, formatLikesCount, linkifyDescription } from '../utils/format.tsx';

interface VideoInfoSectionProps {
  videoId: string;
  video: any;
  t: (key: any) => string;
  language: string;
  direction: string;
  showDescription: boolean;
  setShowDescription: (v: boolean) => void;
  theaterMode: boolean;
  setTheaterMode: (v: boolean) => void;
  handleWatchLater: () => void;
  isInWatchLater: (id: string) => boolean;
  toggleSubscription: () => void;
  subscribing: boolean;
  isSubscribed: boolean;
  showShareModal: boolean;
  setShowShareModal: (v: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
  handleAISummarize: () => void;
  aiSummary: string | null;
  setAiSummary: (v: string | null) => void;
  isSummarizing: boolean;
  chapters: { time: string; title: string; seconds: number }[];
  descriptionHashtags: string[];
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
  hasValidViews: boolean;
  hasValidLikes: boolean;
  hasValidDate: boolean;
  hasValidSubscribers: boolean;
  channelUrl: string | null;
  onSeekTo: (seconds: number) => void;
  isPlayerInteractive: () => boolean;
}

export default function VideoInfoSection({
  videoId,
  video,
  t,
  language,
  showDescription,
  setShowDescription,
  theaterMode,
  setTheaterMode,
  handleWatchLater,
  isInWatchLater,
  toggleSubscription,
  subscribing,
  isSubscribed,
  showShareModal,
  setShowShareModal,
  showShortcuts,
  setShowShortcuts,
  handleAISummarize,
  aiSummary,
  setAiSummary,
  isSummarizing,
  chapters,
  descriptionHashtags,
  videoContainerRef,
  hasValidViews,
  hasValidLikes,
  hasValidDate,
  hasValidSubscribers,
  channelUrl,
  onSeekTo,
  isPlayerInteractive,
}: VideoInfoSectionProps) {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const handleCopyUrl = useCallback(() => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      toast.success((t as any)('link_copied') || 'تم نسخ الرابط', { duration: 2000 });
      setTimeout(() => setCopiedUrl(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
    setShowMoreDropdown(false);
  }, [videoId, t]);

  const scrollToPlayer = () => {
    videoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleChapterClick = (seconds: number) => {
    if (isPlayerInteractive()) {
      onSeekTo(seconds);
    }
    scrollToPlayer();
  };

  return (
    <div className="px-4 lg:px-0 space-y-4">

      {/* ── Title + More ── */}
      <div className="flex items-start gap-2">
        <h1 className="text-lg sm:text-xl lg:text-[22px] font-black text-foreground leading-tight flex-1">{video.title}</h1>
        {/* More dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreVertical size={20} />
          </button>
          <AnimatePresence>
            {showMoreDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute end-0 top-full mt-1 z-50 w-52 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1"
                >
                  <button
                    onClick={handleCopyUrl}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-foreground"
                  >
                    {copiedUrl ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    {t('share') || (language === 'ar' ? 'نسخ الرابط' : 'Copy URL')}
                  </button>
                  <button
                    onClick={() => { setShowShareModal(true); setShowMoreDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-foreground"
                  >
                    <Share2 size={16} />
                    {language === 'ar' ? 'مشاركة' : 'Share'}
                  </button>
                  <button
                    onClick={() => { setShowShortcuts(true); setShowMoreDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-foreground"
                  >
                    <Keyboard size={16} />
                    {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Channel & Actions Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Channel info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 shadow-sm ring-2 ring-border/30">
            {video.channelAvatar && !avatarFailed ? (
              <img
                src={video.channelAvatar}
                alt={video.channelName}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
                <span className="text-primary-foreground font-black text-xs">{video.channelName?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {channelUrl ? (
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate flex items-center gap-1"
                >
                  {video.channelName}
                  <ExternalLink size={10} className="text-muted-foreground shrink-0" />
                </a>
              ) : (
                <span className="font-bold text-foreground text-sm truncate">{video.channelName}</span>
              )}
              {video.isVerified && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-primary/15 rounded-full shrink-0">
                  <Check size={8} className="text-primary" strokeWidth={3} />
                </span>
              )}
            </div>
            {hasValidSubscribers && (
              <p className="text-[11px] text-muted-foreground truncate">
                {video.channelSubscribers} {t('subscribers')}
              </p>
            )}
          </div>
        </div>

        {/* Interaction buttons row */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Like */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full hover:bg-secondary/80 transition-all border border-border active:scale-95 text-sm font-semibold">
            <ThumbsUp size={16} />
            <span className="hidden sm:inline">{hasValidLikes ? formatLikesCount(video.likes, t) : t('likes')}</span>
          </button>
          {/* Share */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full hover:bg-secondary/80 transition-all border border-border active:scale-95 text-sm font-semibold"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{t('share')}</span>
          </button>
          {/* Watch Later */}
          <button
            onClick={handleWatchLater}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border active:scale-95 text-sm font-semibold",
              isInWatchLater(videoId)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
            )}
          >
            <BookmarkPlus size={16} />
            <span className="hidden sm:inline">{isInWatchLater(videoId) ? t('in_list') : t('watchLater')}</span>
          </button>
          {/* Theater */}
          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border active:scale-95 text-sm font-semibold",
              theaterMode
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
            )}
          >
            {theaterMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="hidden lg:inline">{language === 'ar' ? 'المسرح' : 'Theater'}</span>
          </button>
          {/* Subscribe */}
          <button
            onClick={toggleSubscription}
            disabled={subscribing}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 active:scale-95",
              isSubscribed
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            )}
          >
            {subscribing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              isSubscribed ? t('subscribed') : t('subscribe')
            )}
          </button>
        </div>
      </div>

      {/* ── Description Box ── */}
      {video.description && video.description.trim() && (
        <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 relative">
          {/* Stats line */}
          <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2 flex-wrap">
            {hasValidViews && (
              <span className="flex items-center gap-1">
                <Eye size={14} className="text-muted-foreground" />
                {formatViewsCount(video.views, t)}
              </span>
            )}
            {hasValidDate && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{formatDate(video.uploadDate, language)}</span>
              </>
            )}
          </div>

          {/* Description text */}
          <div className={cn(
            "text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap transition-all [&_a]:text-primary [&_a:hover]:underline",
            !showDescription && 'line-clamp-2'
          )}>
            {showDescription ? linkifyDescription(video.description) : video.description}
          </div>

          {/* Hashtags (collapsed) */}
          {!showDescription && descriptionHashtags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 overflow-hidden">
              {descriptionHashtags.slice(0, 4).map((tag, i) => (
                <span key={i} className="text-[10px] font-semibold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full truncate">
                  {tag}
                </span>
              ))}
              {descriptionHashtags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{descriptionHashtags.length - 4}</span>
              )}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {video.description.length > 120 && (
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {showDescription ? <>{t('hide_description')} <ChevronUp size={14} /></> : <>{t('show_more')} <ChevronDown size={14} /></>}
                </button>
              )}
            </div>
            {/* AI Summary button */}
            <button
              onClick={handleAISummarize}
              disabled={isSummarizing || !!aiSummary}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-95",
                aiSummary
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              )}
            >
              {isSummarizing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {aiSummary
                ? (language === 'ar' ? 'تم التلخيص' : 'Summarized')
                : (language === 'ar' ? 'تلخيص بالذكاء' : 'AI Summary')
              }
            </button>
          </div>

          {/* AI Summary Card */}
          <AnimatePresence>
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
                        <Sparkles size={10} className="text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {language === 'ar' ? 'ملخص ذكي' : 'AI Summary'}
                      </span>
                    </div>
                    <button
                      onClick={() => setAiSummary(null)}
                      className="p-1 hover:bg-primary/10 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{aiSummary}</p>
                </div>
              </motion.div>
            )}
            {isSummarizing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 space-y-2"
              >
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Chapters List ── */}
      {chapters.length >= 2 && (
        <div>
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Film size={16} className="text-primary" />
            {language === 'ar' ? 'الفصول' : 'Chapters'}
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
              {chapters.length}
            </span>
          </h3>
          <div className="bg-muted/30 border border-border/40 rounded-xl overflow-hidden divide-y divide-border/30 max-h-64 overflow-y-auto no-scrollbar">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => handleChapterClick(ch.seconds)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-start group"
              >
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                  {ch.time}
                </span>
                <span className="text-sm text-foreground/80 group-hover:text-foreground truncate">
                  {ch.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
