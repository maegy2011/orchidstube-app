"use client";

import React, { useState, useMemo } from 'react';
import { StickyNote, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n-context';
import { useNotes } from '@/hooks/useNotes';
import { VideoNote } from '@/lib/types';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { toast } from 'sonner';
import { getFormattedGregorianDate, getFormattedHijriDate } from '@/lib/date-utils';
import { useSidebarLayout } from '@/hooks/use-sidebar-layout';
import { useTopPadding } from '@/hooks/use-top-padding';
import NotesHeader, { NotesManageBar } from './components/NotesHeader';
import NotesFilter from './components/NotesFilter';
import NotesEmpty from './components/NotesEmpty';
import NotesList from './components/NotesList';
import NotesDeleteDialog from './components/NotesDeleteDialog';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}


export default function NotesPage() {
  const { getAllNotes, deleteNote, updateNote, isLoaded } = useNotes();
  const { showGregorianDate, showHijriDate, hijriOffset, language, direction, t } = useI18n();
  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const parts = [];

    if (showGregorianDate) {
      parts.push(getFormattedGregorianDate(language, date) + ' م');
    }

    if (showHijriDate) {
      parts.push(getFormattedHijriDate(language, hijriOffset, date));
    }

    if (parts.length === 0) return '';
    return parts.join(' | ');
  };
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  
  const allNotes = isLoaded ? getAllNotes() : [];
  
  const uniqueHashtags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach(note => {
      note.hashtags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allNotes]);

  const toggleNoteSelection = (id: string) => {
    const newSelection = new Set(selectedNotes);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedNotes(newSelection);
  };

  const selectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredNotes.map(n => n.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("textCopied"));
  };

  const shareNote = (note: VideoNote) => {
    const shareUrl = `${window.location.origin}/watch/${note.videoId}?t=${note.startTime}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t("shareLinkCopied"));
  };

  const exportNotes = (notesToExport: VideoNote[]) => {
    const content = notesToExport.map(n => {
      return `[${formatTime(n.startTime)} - ${formatTime(n.endTime)}] ${n.videoTitle}\n${n.content}\n${n.hashtags?.join(' ') || ''}\n---\n`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("notesExported"));
  };

  const bulkDelete = () => {
    if (selectedNotes.size === 0) return;
    if (confirm(t("confirmDeleteMultiple").replace("{count}", String(selectedNotes.size)))) {
      selectedNotes.forEach(id => deleteNote(id));
      setSelectedNotes(new Set());
      setIsManageMode(false);
      toast.success(t("deleteSelectedSuccess"));
    }
  };

  const filteredNotes = useMemo(() => {
    return allNotes.filter(note => {
      const matchesSearch = 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.hashtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || note.hashtags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [allNotes, searchQuery, selectedTag]);

  const groupedNotes = useMemo(() => {
    return filteredNotes.reduce((acc, note) => {
      if (!acc[note.videoId]) {
        acc[note.videoId] = {
          videoId: note.videoId,
          videoTitle: note.videoTitle,
          notes: [],
        };
      }
      acc[note.videoId].notes.push(note);
      return acc;
    }, {} as Record<string, { videoId: string; videoTitle: string; notes: VideoNote[] }>);
  }, [filteredNotes]);

  const startEditing = (note: VideoNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditHashtags(note.hashtags?.join(' ') || '');
    setEditStartTime(formatTime(note.startTime));
    setEditEndTime(formatTime(note.endTime));
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
    setEditHashtags('');
    setEditStartTime('');
    setEditEndTime('');
  };

  const saveEdit = () => {
    if (!editingNote || !editContent.trim()) return;
    
    const hashtagsArray = editHashtags.split(/\s+/).filter(h => h.startsWith('#')).map(h => h.trim());

    updateNote(editingNote, {
      content: editContent,
      hashtags: hashtagsArray,
      startTime: parseTime(editStartTime),
      endTime: parseTime(editEndTime),
    });
    
    cancelEditing();
  };

  const handleDeleteRequest = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDeleteId) {
      deleteNote(noteToDeleteId);
      setIsDeleteModalOpen(false);
      setNoteToDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedTag !== null;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#0f0f0f]" dir={direction}>
      <Masthead />
      <SidebarGuide />
      
      <main className={`ms-0 lg:ms-[240px] ${mainPaddingTop} pb-24 px-4 md:px-8 transition-all duration-300`}>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            <NotesHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isManageMode={isManageMode}
              setIsManageMode={(v) => {
                setIsManageMode(v);
                setSelectedNotes(new Set());
              }}
              selectedNotes={selectedNotes}
              selectAll={selectAll}
              filteredNotesCount={filteredNotes.length}
              exportNotes={() => exportNotes(filteredNotes.filter(n => selectedNotes.has(n.id)))}
              bulkDelete={bulkDelete}
              t={t}
            />

            <NotesManageBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isManageMode={isManageMode}
              setIsManageMode={setIsManageMode}
              selectedNotes={selectedNotes}
              selectAll={selectAll}
              filteredNotesCount={filteredNotes.length}
              exportNotes={() => exportNotes(filteredNotes.filter(n => selectedNotes.has(n.id)))}
              bulkDelete={bulkDelete}
              t={t}
            />

            <NotesFilter
              uniqueHashtags={uniqueHashtags}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              t={t}
            />

            {!isLoaded || allNotes.length === 0 || hasActiveFilters && filteredNotes.length === 0 ? (
              <NotesEmpty
                isLoaded={isLoaded}
                allNotesCount={allNotes.length}
                hasSearchQuery={hasActiveFilters && allNotes.length > 0}
                clearFilters={clearFilters}
                t={t}
              />
            ) : (
              <NotesList
                groupedNotes={groupedNotes}
                editingNote={editingNote}
                editContent={editContent}
                setEditContent={setEditContent}
                editHashtags={editHashtags}
                setEditHashtags={setEditHashtags}
                editStartTime={editStartTime}
                setEditStartTime={setEditStartTime}
                editEndTime={editEndTime}
                setEditEndTime={setEditEndTime}
                isManageMode={isManageMode}
                selectedNotes={selectedNotes}
                toggleNoteSelection={toggleNoteSelection}
                startEditing={startEditing}
                cancelEditing={cancelEditing}
                saveEdit={saveEdit}
                copyToClipboard={copyToClipboard}
                shareNote={shareNote}
                handleDeleteRequest={handleDeleteRequest}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                formatDate={formatDate}
                t={t}
                containerVariants={containerVariants}
                itemVariants={itemVariants}
              />
            )}

            {allNotes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-8 py-3 bg-white border border-[#e5e5e5] rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                  <span className="flex items-center gap-1.5">
                    <StickyNote size={14} className="text-red-500" />
                    {allNotes.length} {t("totalNotes")}
                  </span>
                  <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <Video size={14} className="text-gray-900" />
                    {Object.keys(groupedNotes).length} {t("totalVideos")}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <NotesDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setNoteToDeleteId(null);
        }}
        onConfirm={confirmDelete}
        title={t("delete_note_title")}
        description={t("delete_note_desc")}
        confirmText={t("delete_confirm_btn")}
      />
    </div>
  );
}
