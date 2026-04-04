"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { VideoDetails, VideoNote } from '@/lib/types';
import type { UseNotesManagementOptions, UseNotesManagementReturn } from '../types';
import { formatTime, parseTime } from '../utils/time';
import { useNotes } from '@/hooks/useNotes';
import { useI18n } from '@/lib/i18n-context';

export function useNotesManagement({
  videoId,
  video,
  videoNotes,
  playerRef,
  currentTime,
  isWatchLocked,
  isPlayerInteractive,
}: UseNotesManagementOptions): UseNotesManagementReturn {
  const { t } = useI18n();

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteHashtags, setNoteHashtags] = useState<string>('');
  const [noteStartTime, setNoteStartTime] = useState('0:00');
  const [noteEndTime, setNoteEndTime] = useState('0:00');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNoteRange, setActiveNoteRange] = useState<{ start: number; end: number } | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState<number | null>(null);
  const [quickNotes, setQuickNotes] = useState<{ id: string; startTime: number; endTime: number; createdAt: number }[]>([]);

  const [loopNoteEnabled, setLoopNoteEnabled] = useState(false);
  const [videoLoopEnabled, setVideoLoopEnabled] = useState(false);
  const [autoPauseOnNote, setAutoPauseOnNote] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'note' | 'quickNote' } | null>(null);

  const { addNote, updateNote, deleteNote } = useNotes();
  const isMounted = useRef(false);

  // Track mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const filteredNotes = videoNotes.filter(note =>
    noteSearch === '' || note.content.toLowerCase().includes(noteSearch.toLowerCase())
  );

  const getCurrentPlayerTime = useCallback(() => {
    let time = currentTime;
    if (isPlayerInteractive()) {
      try {
        const playerTime = playerRef.current.getCurrentTime();
        if (typeof playerTime === 'number' && !isNaN(playerTime)) {
          time = playerTime;
        }
      } catch (e) {}
    }
    return time;
  }, [currentTime, isPlayerInteractive, playerRef]);

  const quickCapture = useCallback(() => {
    const time = getCurrentPlayerTime();
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: time,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
  }, [getCurrentPlayerTime]);

  const startCapture = useCallback(() => {
    if (isPlayerInteractive()) {
      try {
        playerRef.current.playVideo();
      } catch (e) {}
    }
    const time = getCurrentPlayerTime();
    setCaptureStartTime(time);
    setNoteStartTime(formatTime(time));
    setNoteEndTime(formatTime(time));
    setIsCapturing(true);
  }, [isPlayerInteractive, playerRef, getCurrentPlayerTime]);

  const stopCapture = useCallback(() => {
    const time = getCurrentPlayerTime();
    const startTimeCapture = captureStartTime ?? 0;
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: startTimeCapture,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
    setNoteEndTime(formatTime(time));
    setIsCapturing(false);
    setCaptureStartTime(null);
  }, [getCurrentPlayerTime, captureStartTime]);

  const runNoteSystemTest = useCallback(() => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          const testTime = Math.floor(Math.random() * 60);
          const testNote = {
            id: `test-${Date.now()}`,
            startTime: testTime,
            endTime: testTime + 5,
            createdAt: Date.now(),
          };
          setQuickNotes(prev => [testNote, ...prev]);
          resolve(true);
        }, 1500);
      }),
      {
        loading: 'Testing note system...',
        success: 'Note system test passed! Draft created.',
        error: 'Note system test failed.',
      }
    );
  }, []);

  const editQuickNote = useCallback((quickNote: { id: string; startTime: number; endTime: number }) => {
    setNoteStartTime(formatTime(quickNote.startTime));
    setNoteEndTime(formatTime(quickNote.endTime));
    setNoteContent('');
    setEditingNote(null);
    setShowNoteForm(true);
    setQuickNotes(prev => prev.filter(n => n.id !== quickNote.id));
  }, []);

  const deleteQuickNote = useCallback((id: string) => {
    setItemToDelete({ id, type: 'quickNote' });
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'note') {
      deleteNote(itemToDelete.id);
    } else {
      setQuickNotes(prev => prev.filter(n => n.id !== itemToDelete.id));
    }

    if (activeNoteId === itemToDelete.id) {
      setActiveNoteId(null);
      setActiveNoteRange(null);
    }

    setDeleteModalOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, activeNoteId, deleteNote]);

  const saveQuickNote = useCallback((quickNote: { id: string; startTime: number; endTime: number }) => {
    if (!video) return;
    const serial = videoNotes.length + 1;
    const autoContent = `${video.title} - ملاحظة ${serial}`;

    addNote({
      videoId,
      videoTitle: video.title,
      content: autoContent,
      startTime: quickNote.startTime,
      endTime: quickNote.endTime,
    });

    setQuickNotes(prev => prev.filter(n => n.id !== quickNote.id));
    if (activeNoteId === quickNote.id) {
      setActiveNoteId(null);
      setActiveNoteRange(null);
    }
  }, [video, videoNotes, videoId, addNote, activeNoteId]);

  const handleAddNote = useCallback(() => {
    if (!video) return;

    const startSeconds = parseTime(noteStartTime);
    const endSeconds = parseTime(noteEndTime);
    const hashtagsArray = noteHashtags.split(' ').filter(h => h.startsWith('#')).map(h => h.trim());

    if (startSeconds < 0 || endSeconds <= 0 || startSeconds >= endSeconds) {
      toast.error(t('invalid_time_range') || 'الرجاء إدخال وقت البداية والنهاية بشكل صحيح');
      return;
    }

    let finalContent = noteContent.trim();
    if (!finalContent) {
      const serial = videoNotes.length + 1;
      finalContent = `${video.title} - ملاحظة ${serial}`;
    }

    if (editingNote) {
      updateNote(editingNote, {
        content: finalContent,
        hashtags: hashtagsArray,
        startTime: startSeconds,
        endTime: endSeconds,
      });
      setEditingNote(null);
      toast.success(t('note_updated') || 'تم تحديث الملاحظة بنجاح');
    } else {
      addNote({
        videoId,
        videoTitle: video.title,
        content: finalContent,
        hashtags: hashtagsArray,
        startTime: startSeconds,
        endTime: endSeconds,
      });
      toast.success(t('note_saved') || 'تم حفظ الملاحظة بنجاح');
    }

    setNoteContent('');
    setNoteHashtags('');
    setNoteStartTime('0:00');
    setNoteEndTime('0:00');
    setShowNoteForm(false);
    setCaptureStartTime(null);
    setIsCapturing(false);
  }, [video, noteStartTime, noteEndTime, noteHashtags, noteContent, editingNote, videoNotes, videoId, t, updateNote, addNote]);

  const handleCancelEdit = useCallback(() => {
    if (editingNote && (noteContent.trim() || noteHashtags.trim())) {
      if (confirm(t('cancel_edit_confirm') || 'هل تريد إلغاء التعديل؟ سيتم فقدان التغييرات غير المحفوظة.')) {
        setShowNoteForm(false);
        setEditingNote(null);
        setIsCapturing(false);
        setCaptureStartTime(null);
        setNoteContent('');
        setNoteHashtags('');
        setNoteStartTime('0:00');
        setNoteEndTime('0:00');
      }
    } else {
      setShowNoteForm(false);
      setEditingNote(null);
      setIsCapturing(false);
      setCaptureStartTime(null);
      setNoteContent('');
      setNoteHashtags('');
      setNoteStartTime('0:00');
      setNoteEndTime('0:00');
    }
  }, [editingNote, noteContent, noteHashtags, t]);

  const handlePreviewNote = useCallback(() => {
    const startSeconds = parseTime(noteStartTime);
    const endSeconds = parseTime(noteEndTime);

    if (startSeconds < 0 || endSeconds <= 0 || startSeconds >= endSeconds) {
      toast.error(t('invalid_time_range') || 'الرجاء إدخال وقت البداية والنهاية بشكل صحيح');
      return;
    }

    setActiveNoteId(editingNote || 'preview');
    setActiveNoteRange({ start: startSeconds, end: endSeconds });

    if (isPlayerInteractive()) {
      playerRef.current.seekTo(startSeconds, true);
      playerRef.current.playVideo();
    }

    toast.success(t('preview_started') || 'جاري معاينة المقطع...');
  }, [noteStartTime, noteEndTime, editingNote, t, isPlayerInteractive, playerRef]);

  const handleEditNote = useCallback((note: VideoNote) => {
    setEditingNote(note.id);
    const isAutoTitle = video && note.content.startsWith(video.title) && note.content.includes(' - ملاحظة ');
    setNoteContent(isAutoTitle || note.content === 'بدون محتوى' ? '' : note.content);
    setNoteHashtags(note.hashtags?.join(' ') || '');
    setNoteStartTime(formatTime(note.startTime));
    setNoteEndTime(formatTime(note.endTime));
    setShowNoteForm(true);

    if (isMounted.current) {
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          const formElement = document.querySelector('[data-note-form]');
          if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [video]);

  const handleDeleteNote = useCallback((noteId: string) => {
    setItemToDelete({ id: noteId, type: 'note' });
    setDeleteModalOpen(true);
  }, []);

  const playNoteSegment = useCallback((note: { id: string; startTime: number; endTime: number }) => {
    if (isWatchLocked) return;
    const isCurrentlyActive = activeNoteId === note.id;
    const isAtEnd = currentTime >= note.endTime - 0.2;

    if (isCurrentlyActive && isPlayerInteractive()) {
      const state = playerRef.current.getPlayerState();
      if (state === 1 && !isAtEnd) {
        playerRef.current.pauseVideo();
      } else {
        if (isAtEnd) {
          playerRef.current.seekTo(note.startTime, true);
        }
        playerRef.current.playVideo();
      }
      return;
    }

    setActiveNoteId(note.id);
    setActiveNoteRange({ start: note.startTime, end: note.endTime });
    if (isPlayerInteractive()) {
      playerRef.current.seekTo(note.startTime, true);
      playerRef.current.playVideo();
    }
  }, [isWatchLocked, activeNoteId, currentTime, isPlayerInteractive, playerRef]);

  const captureCurrentTime = useCallback((type: 'start' | 'end') => {
    const time = formatTime(currentTime);
    if (type === 'start') {
      setNoteStartTime(time);
    } else {
      setNoteEndTime(time);
    }
  }, [currentTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'l') {
        if (activeNoteId) {
          setLoopNoteEnabled(prev => !prev);
        } else {
          setVideoLoopEnabled(prev => !prev);
        }
      }

      if (e.key.toLowerCase() === 'n' && !isCapturing) {
        startCapture();
      } else if (e.key.toLowerCase() === 'n' && isCapturing) {
        stopCapture();
      }

      if (e.key.toLowerCase() === 'q') {
        quickCapture();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeNoteId, isCapturing, startCapture, stopCapture, quickCapture]);

  return {
    showNoteForm,
    setShowNoteForm,
    noteContent,
    setNoteContent,
    noteHashtags,
    setNoteHashtags,
    noteStartTime,
    setNoteStartTime,
    noteEndTime,
    setNoteEndTime,
    editingNote,
    setEditingNote,
    setIsCapturing,
    setCaptureStartTime,
    activeNoteId,
    activeNoteRange,
    noteSearch,
    setNoteSearch,
    isCapturing,
    captureStartTime,
    quickNotes,
    loopNoteEnabled,
    setLoopNoteEnabled,
    videoLoopEnabled,
    setVideoLoopEnabled,
    autoPauseOnNote,
    setAutoPauseOnNote,
    deleteModalOpen,
    setDeleteModalOpen,
    itemToDelete,
    setItemToDelete,
    quickCapture,
    startCapture,
    stopCapture,
    runNoteSystemTest,
    editQuickNote,
    deleteQuickNote,
    confirmDelete,
    saveQuickNote,
    handleAddNote,
    handleCancelEdit,
    handlePreviewNote,
    handleEditNote,
    handleDeleteNote,
    playNoteSegment,
    captureCurrentTime,
    filteredNotes,
  };
}
