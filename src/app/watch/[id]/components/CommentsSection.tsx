"use client";

import React from 'react';
import { ThumbsUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CommentSort } from '../utils/constants';

interface CommentsSectionProps {
  sortedComments: any[];
  commentSort: CommentSort;
  setCommentSort: (v: CommentSort) => void;
  t: (key: any) => string;
  language: string;
}

export default function CommentsSection({
  sortedComments,
  commentSort,
  setCommentSort,
  t,
  language,
}: CommentsSectionProps) {
  if (sortedComments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ThumbsUp size={24} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'لا توجد تعليقات على هذا الفيديو' : 'No comments on this video'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex items-center justify-end mb-4">
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
      {sortedComments.map((comment, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.02 }}
          className="flex gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all hover:translate-y-[-1px]"
        >
          <img
            src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=random`}
            alt=""
            className="w-9 h-9 rounded-full shrink-0 bg-muted ring-1 ring-border/50"
            loading="lazy"
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
    </div>
  );
}
