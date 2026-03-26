"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, Clock, Eye, Calendar, CheckCircle2, BookmarkPlus, BookmarkCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useWatchLater } from "@/hooks/useWatchLater";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  channelName: string;
  channelAvatar: string;
  isVerified: boolean;
  page?: number; // Keep track of which page this video belongs to
}

interface VideoGridProps {
  searchQuery?: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}

// Simple in-memory cache for search results
const searchCache: Record<string, { videos: Video[], tokens: Record<number, string | null>, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function VideoGrid({ 
  searchQuery = "", 
  currentPage = 1, 
  onPageChange, 
  onTotalPagesChange,
  onLoadingChange
}: VideoGridProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, location, restrictedMode, direction, loadMode, t } = useI18n();
  const { toggleWatchLater, isInWatchLater } = useWatchLater();

  // Keep track of tokens for each page to support going back/forth
  const pageTokens = useRef<Record<number, string | null>>({ 1: null });
  const [lastFetchedPage, setLastFetchedPage] = useState(0);
  const preloadingRef = useRef<number | null>(null);

  const fetchVideos = useCallback(async (page: number, append: boolean = false) => {
    // Check cache first if it's the first page or we are not appending
    const cacheKey = `${searchQuery}-${language}-${location}-${restrictedMode}`;
    if (!append && page === 1 && searchCache[cacheKey] && (Date.now() - searchCache[cacheKey].timestamp < CACHE_TTL)) {
      setVideos(searchCache[cacheKey].videos);
      pageTokens.current = { ...searchCache[cacheKey].tokens };
      setLastFetchedPage(1);
      setHasMore(true);
      if (onTotalPagesChange) onTotalPagesChange(100);
      return;
    }

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
      
      url.searchParams.set("limit", "30");
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("فشل في تحميل الفيديوهات");
      
      const data = await response.json();
      const newVideos = (data.videos || []).map((v: any) => ({ ...v, page }));
      
        setVideos(prev => {
          let updated;
          if (append) {
            const existingIds = new Set(prev.map(v => v.id));
            const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.id));
            updated = [...prev, ...uniqueNewVideos];
          } else {
            // Even for first page, ensure uniqueness within newVideos
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
            timestamp: Date.now()
          };
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

      // Preload next page if available
      if (data.hasMore && data.continuationToken && preloadingRef.current !== page + 1) {
        preloadingRef.current = page + 1;
      }

    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("حدث خطأ أثناء تحميل الفيديوهات. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, language, location, restrictedMode, onTotalPagesChange, t]);

  // Reset tokens and fetch page 1 when search query or location changes
  useEffect(() => {
    pageTokens.current = { 1: null };
    setVideos([]);
    setLastFetchedPage(0);
    setHasMore(true);
    fetchVideos(1, false);
  }, [searchQuery, location, restrictedMode, fetchVideos]);

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const nextPage = lastFetchedPage + 1;
    fetchVideos(nextPage, true);
  }, [lastFetchedPage, isLoading, hasMore, fetchVideos]);

  const handleWatchLaterClick = (e: React.MouseEvent, video: Video) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchLater(video as any);
  };

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
          const videoId = visibleEntry.target.getAttribute('data-video-id');
          const video = videos.find(v => v.id === videoId);
          if (video?.page && onPageChange && video.page !== currentPage) {
            onPageChange(video.page);
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

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 p-8 rounded-3xl mb-4 border border-destructive/20">
          <p className="text-destructive font-medium">{error}</p>
        </div>
        <button 
          onClick={() => fetchVideos(1)}
          className="px-8 py-3 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all active:scale-95 shadow-lg hover:shadow-xl font-semibold"
          >
            {t('retry')}
          </button>

      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 min-h-[400px]" dir={direction}>
      {isLoading && videos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-video bg-muted rounded-xl" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-muted" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
          <AnimatePresence mode="popLayout">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                ref={el => videoRefs.current[video.id] = el as any}
                data-video-id={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: (index % 20) * 0.05 }}
              >
                <Link href={`/watch/${video.id}`} className="group flex flex-col gap-3">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <img
                        src={video.thumbnail || "/placeholder-video.jpg"}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-sm text-white text-[12px] font-bold px-2 py-1 rounded-lg shadow-lg">
                        {video.duration}
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleWatchLaterClick(e, video)}
                        className={cn(
                          "absolute top-2 right-2 p-1.5 rounded-md transition-all duration-300 z-10",
                          "opacity-0 group-hover:opacity-100",
                          isInWatchLater(video.id) 
                            ? "bg-blue-600 text-white shadow-lg" 
                            : "bg-black/60 text-white hover:bg-black/80"
                        )}
                        title={t("watch_later") || "مشاهدة لاحقاً"}
                      >
                        <AnimatePresence mode="wait">
                          {isInWatchLater(video.id) ? (
                            <motion.div
                              key="checked"
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 45 }}
                            >
                              <Check size={18} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="plus"
                              initial={{ scale: 0, rotate: 45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: -45 }}
                            >
                              <Clock size={18} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play className="text-white opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 drop-shadow-lg" size={48} fill="currentColor" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-border hover:border-primary/50 transition-colors ring-2 ring-transparent hover:ring-primary/20">
                        <img
                          src={video.channelAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(video.channelName)}&background=random`}
                          alt={video.channelName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                      <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex flex-col text-[13px] text-muted-foreground/90">
                        <div className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                          <span className="truncate font-medium">{video.channelName}</span>
                          {video.isVerified && <CheckCircle2 size={13} className="text-primary/70" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{video.views.toLowerCase().includes('view') || video.views.includes('مشاهدة') || video.views.includes(t('views')) ? video.views : `${video.views} ${t('views')}`}</span>
                          {video.uploadedAt && video.uploadedAt !== t('unknown') && (
                            <span className="before:content-['•'] before:mx-1.5">{video.uploadedAt}</span>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite Scroll Trigger / Load More Button */}
      <div ref={observerTarget} className="flex flex-col items-center justify-center mt-8 mb-12 min-h-[80px]">
        {isLoading && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <Loader2 className="w-8 h-8 text-primary animate-spin relative" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{t('loading')}</p>
          </div>
        )}

        {!isLoading && loadMode === "manual" && videos.length > 0 && (
          <button
            onClick={loadMore}
            className="group relative px-8 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative">{t("loadMore") || "تحميل المزيد"}</span>
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="absolute w-full h-full border-2 border-white/30 rounded-full" />
              <div className="absolute w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </button>
        )}
      </div>

      {!isLoading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="bg-muted/50 p-6 rounded-3xl mb-4">
            <Eye size={48} className="opacity-30" />
          </div>
          <p className="text-lg font-medium">{t('no_videos_found')}</p>
          <p className="text-sm mt-1">{t('try_different_keywords')}</p>
        </div>
      )}
    </div>
  );
}
