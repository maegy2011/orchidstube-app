"use client";

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Trash2,
  Edit2,
  Copy,
  Share2,
  Video,
  Check,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { VideoNote } from '@/lib/types';
import { cn } from '@/lib/utils';
import NoteEditDialog from './NoteEditDialog';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface NotesListProps {
  groupedNotes: Record<string, { videoId: string; videoTitle: string; notes: VideoNote[] }>;
  editingNote: string | null;
  editContent: string;
  setEditContent: (v: string) => void;
  editHashtags: string;
  setEditHashtags: (v: string) => void;
  editStartTime: string;
  setEditStartTime: (v: string) => void;
  editEndTime: string;
  setEditEndTime: (v: string) => void;
  isManageMode: boolean;
  selectedNotes: Set<string>;
  toggleNoteSelection: (id: string) => void;
  startEditing: (note: VideoNote) => void;
  cancelEditing: () => void;
  saveEdit: () => void;
  copyToClipboard: (text: string) => void;
  shareNote: (note: VideoNote) => void;
  handleDeleteRequest: (noteId: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  formatDate: (dateString: string) => string;
  t: (key: string) => string;
  containerVariants: {
    hidden: { opacity: number };
    visible: { opacity: number; transition: { staggerChildren: number } };
  };
  itemVariants: {
    hidden: { y: number; opacity: number };
    visible: { y: number; opacity: number };
  };
}

export default function NotesList({
  groupedNotes,
  editingNote,
  editContent,
  setEditContent,
  editHashtags,
  setEditHashtags,
  editStartTime,
  setEditStartTime,
  editEndTime,
  setEditEndTime,
  isManageMode,
  selectedNotes,
  toggleNoteSelection,
  startEditing,
  cancelEditing,
  saveEdit,
  copyToClipboard,
  shareNote,
  handleDeleteRequest,
  selectedTag,
  setSelectedTag,
  formatDate,
  t,
  containerVariants,
  itemVariants,
}: NotesListProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-12"
    >
      {Object.values(groupedNotes).map((group) => (
        <motion.div 
          key={group.videoId}
          variants={itemVariants}
          className="group"
        >
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-900/10">
              <Video size={18} />
            </div>
            <Link 
              href={`/watch/${group.videoId}`}
              className="font-bold text-xl hover:text-red-600 transition-colors line-clamp-1 flex-1"
            >
              {group.videoTitle}
            </Link>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full shrink-0 border border-gray-100">
              {t("totalNotes").replace("{count}", String(group.notes.length))}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.notes.map((note) => (
              <motion.div 
                key={note.id}
                layout
                className={cn(
                  "relative p-6 rounded-[32px] transition-all border group/card flex flex-col h-full",
                  editingNote === note.id 
                    ? "bg-white border-red-200 ring-4 ring-red-50 shadow-2xl z-10" 
                    : "bg-white border-gray-100 hover:border-red-200 hover:shadow-xl hover:-translate-y-1",
                  isManageMode && selectedNotes.has(note.id) && "ring-2 ring-red-500 border-red-500"
                )}
                onClick={() => isManageMode && toggleNoteSelection(note.id)}
              >
                {isManageMode && (
                  <div className="absolute top-4 right-4 z-20">
                    {selectedNotes.has(note.id) ? (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-white border-2 border-gray-200 rounded-full" />
                    )}
                  </div>
                )}

                {editingNote === note.id ? (
                  <NoteEditDialog
                    editContent={editContent}
                    setEditContent={setEditContent}
                    editHashtags={editHashtags}
                    setEditHashtags={setEditHashtags}
                    editStartTime={editStartTime}
                    setEditStartTime={setEditStartTime}
                    editEndTime={editEndTime}
                    setEditEndTime={setEditEndTime}
                    saveEdit={saveEdit}
                    cancelEditing={cancelEditing}
                    t={t}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <Link
                        href={`/watch/${note.videoId}?t=${note.startTime}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                      >
                        <Play size={14} fill="currentColor" />
                        <span className="text-xs font-bold font-mono">
                          {formatTime(note.startTime)} - {formatTime(note.endTime)}
                        </span>
                      </Link>
                      
                      <div className="flex items-center gap-1 transition-all">
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(note.content); }}
                          className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title={t("copyTextLabel")}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); shareNote(note); }}
                          className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                          title={t("shareLinkLabel")}
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(note); }}
                          className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                          title={t("editLabel")}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteRequest(note.id); }}
                          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title={t("deleteLabel")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                      <p className="text-[#0f0f0f] text-[15px] font-medium leading-[1.8] mb-6 whitespace-pre-wrap flex-1">
                        {note.content}
                      </p>
                      
                      {note.hashtags && note.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {note.hashtags.map((tag) => (
                            <button 
                              key={`${note.id}-${tag}`} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag(tag === selectedTag ? null : tag);
                              }}
                              className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full border transition-all",
                                selectedTag === tag
                                  ? "bg-red-600 text-white border-red-600"
                                  : "text-red-600 bg-red-50 border-red-100 hover:bg-red-100"
                              )}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    
                    <div className="flex items-center gap-3 pt-5 border-t border-gray-50 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100">
                        <Calendar size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-400">
                          {t('addedOn')} {formatDate(note.createdAt)}
                        </span>
                        {note.updatedAt && note.updatedAt !== note.createdAt && (
                          <span className="text-[10px] font-medium text-gray-400/80">
                            {t('lastUpdated')} {formatDate(note.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
