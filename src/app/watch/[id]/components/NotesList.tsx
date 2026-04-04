"use client";

import React from 'react';
import {
  Play,
  Pause,
  Trash2,
  Edit2,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatTime } from '../utils/time';
import type { VideoNote } from '@/lib/types';

interface NotesListProps {
  filteredNotes: VideoNote[];
  quickNotes: { id: string; startTime: number; endTime: number; createdAt: number }[];
  activeNoteId: string | null;
  playerState: number;
  currentTime: number;
  noteSearch: string;
  t: (key: string) => string;
  playNoteSegment: (note: { id: string; startTime: number; endTime: number }) => void;
  handleEditNote: (note: VideoNote) => void;
  handleDeleteNote: (id: string) => void;
}

export function NotesList({
  filteredNotes,
  quickNotes,
  activeNoteId,
  playerState,
  currentTime,
  noteSearch,
  t,
  playNoteSegment,
  handleEditNote,
  handleDeleteNote,
}: NotesListProps) {
  return (
    <div className="space-y-2 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto no-scrollbar">
      {filteredNotes.length === 0 && quickNotes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground/70 mb-1">
            {noteSearch ? t('no_notes_found') : t('no_notes_recorded')}
          </p>
          {!noteSearch && (
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              {t('use_shortcut')}
              <kbd className="inline-block mx-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">
                N
              </kbd>
              {' '}{t('add_note')} ·{' '}
              <kbd className="inline-block mx-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">
                Q
              </kbd>
              {' '}{t('quick_capture')}
            </p>
          )}
        </div>
      ) : (
        filteredNotes.map((note: VideoNote, index: number) => {
          const isActive = activeNoteId === note.id;
          const duration = note.endTime - note.startTime;
          const progress = isActive && duration > 0
            ? Math.min(100, Math.max(0, ((currentTime - note.startTime) / duration) * 100))
            : 0;

          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              key={note.id}
              className={cn(
                "relative rounded-xl p-3 border transition-all duration-200",
                isActive
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              )}
            >
              {/* Active left accent border */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-full" />
              )}

              <div className="flex items-start gap-2.5">
                {/* Play button */}
                <button
                  onClick={() => playNoteSegment(note)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 mt-0.5",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  {isActive && playerState === 1 ? (
                    <Pause size={14} />
                  ) : (
                    <Play size={14} className="ml-0.5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Time badge */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {formatTime(note.startTime)} – {formatTime(note.endTime)}
                    </span>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] text-primary font-bold flex items-center gap-0.5"
                      >
                        <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                        LIVE
                      </motion.span>
                    )}
                  </div>

                  {/* Note text */}
                  <p className={cn(
                    "text-sm leading-relaxed whitespace-pre-wrap transition-colors",
                    isActive ? "text-foreground font-semibold" : "text-foreground/70"
                  )}>
                    {note.content}
                  </p>

                  {/* Hashtags */}
                  {note.hashtags && note.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {note.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons — always visible, subtle */}
                  <div className="flex items-center gap-0.5 mt-2">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title={t('edit')}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar at bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-muted/30 rounded-b-xl overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}
