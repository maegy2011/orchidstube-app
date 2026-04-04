"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  ChevronDown,
} from 'lucide-react';
import type { ContentTab, CommentSort } from '../utils/constants';
import SafeAvatar from './SafeAvatar';

interface OverviewTabContentProps {
  t: (key: any) => string;
  language: string;
  hasComments: boolean;
  hasRelated: boolean;
  chapters: { time: string; title: string; seconds: number }[];
  sortedComments: any[];
  commentSort: CommentSort;
  setCommentSort: (v: CommentSort) => void;
  video: any;
  onShowAllComments: () => void;
}

export default function OverviewTabContent({
  t,
  language,
  hasComments,
  hasRelated,
  chapters,
  sortedComments,
  commentSort,
  setCommentSort,
  video,
  onShowAllComments,
}: OverviewTabContentProps) {
  return (
    <div className="space-y-6">

      {/* Comments (inline preview) */}
      {hasComments && (
        <div className="px-4 lg:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              {t('comments')}
              <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                {(video.comments || []).length}
              </span>
            </h3>
            {/* Sort */}
            <button
              onClick={() => setCommentSort(commentSort === 'top' ? 'newest' : 'top')}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {commentSort === 'top'
                ? (language === 'ar' ? 'أعلى تعليق' : 'Top comments')
                : (language === 'ar' ? 'الأحدث أولاً' : 'Newest first')
              }
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {sortedComments.slice(0, 5).map((comment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all hover:translate-y-[-1px]"
              >
                <SafeAvatar
                  src={comment.authorAvatar}
                  name={comment.authorName}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground truncate">{comment.authorName}</span>
                    <span className="text-muted-foreground text-[10px]">·</span>
                    <span className="text-[11px] text-muted-foreground">{comment.published}</span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed break-words">{comment.text}</p>
                  {comment.likeCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                      <ThumbsUp size={11} />
                      <span className="text-[11px]">{comment.likeCount}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {(video.comments || []).length > 5 && (
            <button
              onClick={onShowAllComments}
              className="w-full py-2.5 text-sm font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1 hover:bg-primary/5 rounded-xl transition-colors mt-3"
            >
              {(t as any)('show_all_comments')} ({(video.comments || []).length})
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      )}

      {/* Related Videos (mobile) */}
      {hasRelated && (
        <div className="px-4 lg:px-0">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            {t('suggested_videos')}
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
              {(video.relatedVideos || []).length}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(video.relatedVideos || []).map((v: any) => (
              <MobileRelatedVideoCard key={v.id} video={v} />
            ))}
          </div>
        </div>
      )}

      {/* Empty overview state */}
      {!hasComments && !hasRelated && chapters.length < 2 && (
        <div className="text-center py-12 px-4 lg:px-0">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Eye size={24} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'لا توجد تعليقات أو فيديوهات مقترحة حالياً' : 'No comments or suggested videos available yet'}
          </p>
        </div>
      )}
    </div>
  );
}

// Mobile-only related video card (non-compact)
function MobileRelatedVideoCard({ video }: { video: any }) {
  return (
    <a href={`/watch/${video.id}`} className="flex gap-3 group p-1.5 rounded-xl hover:bg-muted/50 transition-all hover:translate-y-[-1px]">
      <div className="relative shrink-0 aspect-video rounded-xl overflow-hidden bg-muted shadow-sm ring-1 ring-border/30"
        style={{ width: '160px' }}
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
        <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{video.channelName}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{video.views}</p>
      </div>
    </a>
  );
}
