"use client";

import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, AlertTriangle, SearchX, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useWatchLater } from "@/hooks/useWatchLater";
import VideoCard, { type Video } from "@/components/sections/video-card";

interface VideoGridProps {
  searchQuery?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  onLoadingChange?: (loading: boolean) => void;
  videosPerPage?: number;
}

// Simple in-memory cache for search results
const searchCache: Record<string, { videos: Video[], tokens: Record<number, string | null>, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_SEARCH_CACHE_ENTRIES = 20;

function pruneSearchCache() {
  const keys = Object.keys(searchCache);
  if (keys.length > MAX_SEARCH_CACHE_ENTRIES) {
    keys
      .sort((a, b) => searchCache[a].timestamp - searchCache[b].timestamp)
      .slice(0, keys.length - MAX_SEARCH_CACHE_ENTRIES)
      .forEach(k => delete searchCache[k]);
  }
}

/* ═══════════════════════════════════════════════════════
   Skeleton Card — shimmer loading placeholder
   ═══════════════════════════════════════════════════════ */
const SkeletonCard = memo(function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex flex-col gap-3"
    >
      {/* Thumbnail skeleton */}
      <div className="aspect-video rounded-2xl bg-muted overflow-hidden relative">
        <div className="absolute inset-0 shimmer rounded-2xl" />
      </div>
      {/* Info skeleton */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
          <div className="w-full h-full shimmer" />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-muted rounded-md w-full overflow-hidden">
            <div className="h-full shimmer w-[90%]" />
          </div>
          <div className="h-4 bg-muted rounded-md w-3/4 overflow-hidden">
            <div className="h-full shimmer w-full" />
          </div>
          <div className="h-3 bg-muted rounded-md w-1/2 overflow-hidden mt-1">
            <div className="h-full shimmer w-[80%]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════
   VideoGrid — main grid component
   ═══════════════════════════════════════════════════════ */
export default function VideoGrid({
  searchQuery = "",
  currentPage = 1,
  onPageChange,
  onTotalPagesChange,
  onLoadingChange,
}: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, location, restrictedMode, direction, loadMode, t, videosPerPage } = useI18n();
  const { toggleWatchLater, isInWatchLater } = useWatchLater();

  // Keep track of tokens for each page to support going back/forth
  const pageTokens = useRef<Record<number, string | null>>({ 1: null });
  const [lastFetchedPage, setLastFetchedPage] = useState(0);
  const preloadingRef = useRef<number | null>(null);

  // Active fetch controller — abort stale requests
  const fetchControllerRef = useRef<AbortController | null>(null);

  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    // Check cache first if it's the first page or we are not appending
    const cacheKey = `${searchQuery}-${language}-${location}-${restrictedMode}-${videosPerPage}`;
    if (!append && page === 1 && searchCache[cacheKey] && (Date.now() - searchCache[cacheKey].timestamp < CACHE_TTL)) {
      setVideos(searchCache[cacheKey].videos);
      pageTokens.current = { ...searchCache[cacheKey].tokens };
      setLastFetchedPage(1);
      setHasMore(true);
      setIsInitialLoad(false);
      if (onTotalPagesChange) onTotalPagesChange(100);
      return;
    }

    // Abort any in-flight request
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const defaultQuery = t("education") || "education";
      const q = searchQuery || defaultQuery;
      const url = new URL("/api/videos/search", window.location.origin);
      url.searchParams.set("q", q);
      url.searchParams.set("location", location);
      url.searchParams.set("language", language);
      url.searchParams.set("restricted", String(restrictedMode));

      const token = pageTokens.current[page];
      if (token) {
        url.searchParams.set("token", token);
      }

      const limit = videosPerPage || 12;
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error(t("error_fetching_video") || "Failed to load videos");

      const data = await response.json();
      const newVideos: Video[] = (data.videos || []).map((v: any) => ({ ...v, page }));

      setVideos(prev => {
        let updated;
        if (append) {
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
          updated = [...prev, ...uniqueNewVideos];
        } else {
          const seen = new Set();
          updated = newVideos.filter(v => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          });
        }

        searchCache[cacheKey] = {
          videos: updated,
          tokens: { ...pageTokens.current },
          timestamp: Date.now(),
        };
        pruneSearchCache();
        return updated;
      });

      setHasMore(data.hasMore);

      // Store the token for the NEXT page
      if (data.continuationToken) {
        pageTokens.current[page + 1] = data.continuationToken;
      }

      if (onTotalPagesChange) {
        onTotalPagesChange(data.hasMore ? Math.max(page + 10, 100) : page);
      }

      setLastFetchedPage(page);
      setIsInitialLoad(false);

      // Preload next page if available
      if (data.hasMore && data.continuationToken && preloadingRef.current !== page + 1) {
        preloadingRef.current = page + 1;
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(t("error_fetching_video") || "An error occurred while loading videos. Please try again.");
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [searchQuery, language, location, restrictedMode, onTotalPagesChange, t, videosPerPage]);

  // Reset tokens and fetch page 1 when search query, location, or videosPerPage changes
  useEffect(() => {
    pageTokens.current = { 1: null };
    setVideos([]);
    setLastFetchedPage(0);
    setHasMore(true);
    setError(null);
    setIsInitialLoad(true);
    // Invalidate cache for old videosPerPage values
    const prefix = `${searchQuery}-${language}-${location}-${restrictedMode}-`;
    Object.keys(searchCache).forEach(key => {
      if (key.startsWith(prefix) && key !== `${prefix}${videosPerPage}`) {
        delete searchCache[key];
      }
    });
    fetchVideos(1, false);
  }, [searchQuery, location, restrictedMode, fetchVideos]);

  // Notify parent of loading state
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const nextPage = lastFetchedPage + 1;
    fetchVideos(nextPage, true);
  }, [lastFetchedPage, isLoading, hasMore, fetchVideos]);

  const handleWatchLaterClick = useCallback((e: React.MouseEvent, video: Video) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchLater(video as any);
  }, [toggleWatchLater]);

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && loadMode === "auto") {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoading, loadMore, loadMode]);

  // Track visible page for pagination sync
  const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    const pageObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry) {
          const videoId = visibleEntry.target.getAttribute("data-video-id");
          const video = videos.find(v => v.id === videoId);
          if ((video as any)?.page && onPageChange && (video as any).page !== currentPage) {
            onPageChange((video as any).page);
          }
        }
      },
      { threshold: 0.5, rootMargin: "-10% 0px -80% 0px" }
    );

    Object.values(videoRefs.current).forEach(ref => {
      if (ref) pageObserver.observe(ref);
    });

    return () => pageObserver.disconnect();
  }, [videos, onPageChange, currentPage]);

  /* ═══════════════════════════════════════════════════════
     Error state
     ═══════════════════════════════════════════════════════ */
  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center" dir={direction}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 p-8 rounded-3xl border border-destructive/15">
              <AlertTriangle className="text-destructive" size={48} strokeWidth={1.5} />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-semibold text-lg">{t("error_fetching_video")}</p>
            <p className="text-muted-foreground text-sm max-w-md">{error}</p>
          </div>
          <button
            onClick={() => fetchVideos(1)}
            className="px-8 py-3 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
          >
            <Loader2 size={16} className="opacity-70" />
            {t("retry")}
          </button>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Empty state
     ═══════════════════════════════════════════════════════ */
  if (!isLoading && videos.length === 0 && !isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center" dir={direction}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="bg-muted/40 p-8 rounded-3xl">
            <SearchX className="text-muted-foreground/40" size={56} strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <p className="text-foreground font-semibold text-lg">{t("no_videos_found")}</p>
            <p className="text-muted-foreground text-sm max-w-sm">{t("try_different_keywords")}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Main grid
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="w-full px-4 sm:px-6 py-6 min-h-[400px]" dir={direction}>
      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
        {isLoading && videos.length === 0 ? (
          /* Skeleton loading */
          Array.from({ length: videosPerPage || 12 }).map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} index={i} />
          ))
        ) : (
          /* Video cards */
          <AnimatePresence mode="popLayout">
            {videos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                isInWatchLater={isInWatchLater(video.id)}
                onToggleWatchLater={handleWatchLaterClick}
                videoRef={(el) => { videoRefs.current[video.id] = el; }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom section: infinite scroll trigger / load more / loading indicator */}
      <div ref={observerTarget} className="flex flex-col items-center justify-center mt-10 mb-12 min-h-[80px]">
        {/* Loading more indicator */}
        {isLoading && videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <Loader2 className="w-7 h-7 text-primary animate-spin relative" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t("loading")}</p>
          </motion.div>
        )}

        {/* Manual load more button */}
        {!isLoading && loadMode === "manual" && videos.length > 0 && hasMore && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadMore}
            className="group relative px-8 py-3 bg-foreground text-background rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative">{t("loadMore")}</span>
            <ChevronDown size={18} className="relative group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        )}

        {/* End of results indicator */}
        {!isLoading && videos.length > 0 && !hasMore && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground/60 mt-2 py-2"
          >
            —
          </motion.p>
        )}
      </div>
    </div>
  );
}
