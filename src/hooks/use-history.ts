"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "./use-user";

export function useHistory() {
  const { userId } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (signal?: AbortSignal) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/history', { signal });
      if (!response.ok) {
        setHistory([]);
        return;
      }
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    if (userId) {
      fetchHistory(controller.signal);
    } else {
      setLoading(false);
    }
    return () => controller.abort();
  }, [userId, fetchHistory]);

  const isWatched = (videoId: string) => {
    return Array.isArray(history) && history.some((h) => h.videoId === videoId);
  };

  return { history, loading, isWatched, refresh: fetchHistory };
}
