"use client";

import React, { useState } from 'react';
import {
  Plus,
  Play,
  Pause,
  X,
  Clock,
  Trash2,
  Check,
  Search,
  Repeat,
  Sparkles,
  Pencil,
  ChevronDown,
  StickyNote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { formatTime } from '../utils/time';
import type { NotesSectionProps } from '../types';
import { TogglePill } from './TogglePill';
import { NoteForm } from './NoteForm';
import { NotesList } from './NotesList';

export default function NotesSection({
  noteSearch,
  setNoteSearch,
  loopNoteEnabled,
  setLoopNoteEnabled,
  quickCapture,
  currentTime,
  isCapturing,
  startCapture,
  stopCapture,
  captureStartTime,
  quickNotes,
  activeNoteId,
  playNoteSegment,
  saveQuickNote,
  editQuickNote,
  deleteQuickNote,
  showNoteForm,
  setShowNoteForm,
  editingNote,
  setEditingNote,
  setIsCapturing,
  setCaptureStartTime,
  noteContent,
  setNoteContent,
  noteHashtags,
  setNoteHashtags,
  noteStartTime,
  setNoteStartTime,
  noteEndTime,
  setNoteEndTime,
  captureCurrentTime,
  handleAddNote,
  handleCancelEdit,
  handlePreviewNote,
  filteredNotes,
  handleEditNote,
  handleDeleteNote,
  videoLoopEnabled,
  setVideoLoopEnabled,
  playerState,
  autoPauseOnNote,
  setAutoPauseOnNote,
}: NotesSectionProps) {
  const { t, direction } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/50 shadow-sm">
      {/* ─── Header (collapsible) ─── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <StickyNote size={15} className="text-primary" />
          </span>
          {t('smart_notes')}
          {filteredNotes.length > 0 && (
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">
              {filteredNotes.length}
            </span>
          )}
        </h2>
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* ─── Content ─── */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40">

          {/* ─── Capture Bar ─── */}
          <div className="flex items-center gap-2 pt-3">
            {/* Current time pill */}
            <div className="flex-1 flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-2 border border-border">
              <Clock size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-mono font-bold text-foreground tabular-nums tracking-tight">
                {formatTime(currentTime)}
              </span>
            </div>

            {/* Quick capture */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={quickCapture}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
              title={t('quick_capture')}
            >
              <Sparkles size={16} />
            </motion.button>

            {/* Record start / stop */}
            {!isCapturing ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCapture}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-foreground/5 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-foreground/10 transition-colors"
                title={t('start_recording')}
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="hidden sm:inline">{t('start_recording')}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCapture}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/25 transition-colors"
                title={t('stop_recording')}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </motion.div>
                <span>{formatTime(captureStartTime ?? 0)}</span>
              </motion.button>
            )}

            {/* Add note */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNoteForm(true)}
              className="p-2.5 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors"
              title={t('add_note')}
            >
              <Plus size={16} className="text-foreground" />
            </motion.button>
          </div>

          {/* ─── Toggle Controls ─── */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <TogglePill
              active={autoPauseOnNote}
              onClick={() => setAutoPauseOnNote(!autoPauseOnNote)}
              icon={<Pause size={12} />}
              label={t('auto_pause')}
            />
            <TogglePill
              active={videoLoopEnabled}
              onClick={() => setVideoLoopEnabled(!videoLoopEnabled)}
              icon={<Repeat size={12} className={videoLoopEnabled ? 'animate-spin' : ''} />}
              label={t('loop_video')}
            />
            <TogglePill
              active={loopNoteEnabled}
              onClick={() => setLoopNoteEnabled(!loopNoteEnabled)}
              icon={<Repeat size={12} className={loopNoteEnabled ? 'animate-spin' : ''} />}
              label={t('loop_segment')}
            />
          </div>

          {/* ─── Quick Drafts ─── */}
          <AnimatePresence>
            {quickNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('quick_drafts')} ({quickNotes.length})
                  </span>
                </div>
                <div className="space-y-1 max-h-[120px] overflow-y-auto no-scrollbar">
                  {quickNotes.map((qn) => (
                    <motion.div
                      layout
                      key={qn.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-2 transition-all border",
                        activeNoteId === qn.id
                          ? "bg-primary/10 border-primary/30 shadow-sm"
                          : "bg-muted/40 border-border hover:border-border/80"
                      )}
                    >
                      <button onClick={() => playNoteSegment(qn)} className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
                          activeNoteId === qn.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {activeNoteId === qn.id && playerState === 1 ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground/80">
                          {formatTime(qn.startTime)}
                          {qn.endTime !== qn.startTime && (
                            <span className="text-muted-foreground"> → {formatTime(qn.endTime)}</span>
                          )}
                        </span>
                      </button>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => editQuickNote(qn)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title={t('edit')}>
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => saveQuickNote(qn)} className="p-1 text-green-600 hover:bg-green-500/10 rounded transition-colors" title={t('save_changes_btn')}>
                          <Check size={11} />
                        </button>
                        <button onClick={() => deleteQuickNote(qn.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors" title={t('delete')}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Search ─── */}
          {filteredNotes.length >= 3 && (
            <div className="relative">
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('search_notes')}
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                dir={direction}
              />
              {noteSearch && (
                <button onClick={() => setNoteSearch('')} className="absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* ─── Note Form ─── */}
          <NoteForm
            showNoteForm={showNoteForm}
            noteContent={noteContent}
            noteHashtags={noteHashtags}
            noteStartTime={noteStartTime}
            noteEndTime={noteEndTime}
            editingNote={editingNote}
            t={t}
            direction={direction}
            setNoteContent={setNoteContent}
            setNoteHashtags={setNoteHashtags}
            setNoteStartTime={setNoteStartTime}
            setNoteEndTime={setNoteEndTime}
            handleAddNote={handleAddNote}
            handleCancelEdit={handleCancelEdit}
            handlePreviewNote={handlePreviewNote}
            captureCurrentTime={captureCurrentTime}
          />

          {/* ─── Notes List ─── */}
          <NotesList
            filteredNotes={filteredNotes}
            quickNotes={quickNotes}
            activeNoteId={activeNoteId}
            playerState={playerState}
            currentTime={currentTime}
            noteSearch={noteSearch}
            t={t}
            playNoteSegment={playNoteSegment}
            handleEditNote={handleEditNote}
            handleDeleteNote={handleDeleteNote}
          />

        </div>
      )}
    </div>
  );
}
