"use client";

import { useState, useEffect, useCallback } from 'react';
import { VideoNote } from '@/lib/types';
import { useUser } from '@/hooks/use-user';

const NOTES_STORAGE_KEY = 'youtube-video-notes';

/** Load from localStorage (unauthenticated users only) */
function loadLocalNotes(): VideoNote[] {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalNotes(items: VideoNote[]) {
  try { localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(items)); } catch {}
}

export function useNotes() {
  const { userId, isAuthenticated } = useUser();
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      if (isAuthenticated && userId) {
        // ── Authenticated: SQLite is sole source of truth ──
        try {
          const response = await fetch('/api/notes', { signal: controller.signal });
          if (response.ok) {
            const serverData = await response.json();
            const serverNotes: VideoNote[] = (serverData || []).map((item: any) => ({
              id: item.id,
              videoId: item.video_id,
              videoTitle: item.video_title,
              content: item.content,
              hashtags: item.hashtags ? JSON.parse(item.hashtags) : undefined,
              startTime: item.start_time,
              endTime: item.end_time,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            }));
            setNotes(serverNotes);
            setIsSynced(true);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
        }
      } else {
        // ── Unauthenticated: localStorage only ──
        setNotes(loadLocalNotes());
      }

      setIsLoaded(true);
    };

    loadData();
    return () => controller.abort();
  }, [isAuthenticated, userId]);

  const addNote = useCallback((note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isAuthenticated && userId) {
      setNotes(prev => [...prev, newNote]);
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: note.videoId,
          videoTitle: note.videoTitle,
          content: note.content,
          hashtags: note.hashtags,
          startTime: note.startTime,
          endTime: note.endTime,
        }),
      }).catch(() => {});
    } else {
      setNotes(prev => {
        const updated = [...prev, newNote];
        saveLocalNotes(updated);
        return updated;
      });
    }
    return newNote;
  }, [isAuthenticated, userId]);

  const updateNote = useCallback((id: string, updates: Partial<VideoNote>) => {
    if (isAuthenticated && userId) {
      setNotes(prev => prev.map(note =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ));
      fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => {});
    } else {
      setNotes(prev => {
        const updated = prev.map(note =>
          note.id === id
            ? { ...note, ...updates, updatedAt: new Date().toISOString() }
            : note
        );
        saveLocalNotes(updated);
        return updated;
      });
    }
  }, [isAuthenticated, userId]);

  const deleteNote = useCallback((id: string) => {
    if (isAuthenticated && userId) {
      setNotes(prev => prev.filter(note => note.id !== id));
      fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    } else {
      setNotes(prev => {
        const updated = prev.filter(note => note.id !== id);
        saveLocalNotes(updated);
        return updated;
      });
    }
  }, [isAuthenticated, userId]);

  const getNotesByVideoId = useCallback((videoId: string) => {
    return notes.filter(note => note.videoId === videoId);
  }, [notes]);

  const getAllNotes = useCallback(() => {
    return notes.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes]);

  return {
    notes,
    isLoaded,
    isSynced,
    addNote,
    updateNote,
    deleteNote,
    getNotesByVideoId,
    getAllNotes,
  };
}
