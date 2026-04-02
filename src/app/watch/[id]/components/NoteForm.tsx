"use client";

import React from 'react';
import { X, Clock, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NoteFormProps {
  showNoteForm: boolean;
  noteContent: string;
  noteHashtags: string;
  noteStartTime: string;
  noteEndTime: string;
  editingNote: string | null;
  t: (key: string) => string;
  direction: string;
  setNoteContent: (v: string) => void;
  setNoteHashtags: (v: string) => void;
  setNoteStartTime: (v: string) => void;
  setNoteEndTime: (v: string) => void;
  handleAddNote: () => void;
  handleCancelEdit: () => void;
  handlePreviewNote: () => void;
  captureCurrentTime: (type: 'start' | 'end') => void;
}

export function NoteForm({
  showNoteForm,
  noteContent,
  noteStartTime,
  noteEndTime,
  editingNote,
  t,
  direction,
  setNoteContent,
  setNoteStartTime,
  setNoteEndTime,
  handleAddNote,
  handleCancelEdit,
  handlePreviewNote,
  captureCurrentTime,
}: NoteFormProps) {
  return (
    <AnimatePresence>
      {showNoteForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-card rounded-xl p-3.5 border border-primary/25 shadow-lg" data-note-form>
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  editingNote ? "bg-primary" : "bg-green-500"
                )} />
                <span className="text-sm font-bold text-foreground">
                  {editingNote ? t('edit_note') : t('add_note')}
                </span>
              </div>
              <button onClick={handleCancelEdit} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('note_placeholder')}
              className="w-full p-2.5 bg-muted/50 border border-border rounded-xl resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-3"
              dir={direction}
              autoFocus
            />

            {/* Time Range Row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={noteStartTime}
                  onChange={(e) => setNoteStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 pr-8 bg-muted/50 border border-border rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="0:00"
                  dir="ltr"
                />
                <button
                  onClick={() => captureCurrentTime('start')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-primary hover:bg-primary/10 rounded transition-colors"
                  title={t('capture_current_time')}
                >
                  <Clock size={12} />
                </button>
              </div>

              <span className="text-muted-foreground text-sm font-mono">→</span>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={noteEndTime}
                  onChange={(e) => setNoteEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 pr-8 bg-muted/50 border border-border rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="0:00"
                  dir="ltr"
                />
                <button
                  onClick={() => captureCurrentTime('end')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-primary hover:bg-primary/10 rounded transition-colors"
                  title={t('capture_current_time')}
                >
                  <Clock size={12} />
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-secondary text-secondary-foreground rounded-xl font-semibold text-xs hover:bg-secondary/80 transition-all active:scale-[0.97]"
              >
                {t('cancel')}
              </button>
              {editingNote && (
                <button
                  onClick={handlePreviewNote}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-muted text-foreground rounded-xl font-semibold text-xs hover:bg-muted/80 transition-all active:scale-[0.97]"
                >
                  <Play size={13} /> {t('preview')}
                </button>
              )}
              <button
                onClick={handleAddNote}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:bg-primary/90 transition-all active:scale-[0.97] shadow-md shadow-primary/20"
              >
                <Check size={13} /> {editingNote ? t('save_changes_btn') : t('confirm_save_btn')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
