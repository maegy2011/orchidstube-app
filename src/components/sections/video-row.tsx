"use client";

import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import CompactCard, { type Video } from "@/components/sections/compact-card";

/* ═══════════════════════════════════════════════════════
   Shimmer skeleton for carousel cards
   ═══════════════════════════════════════════════════════ */
function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-4 sm:px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shrink-0 w-[260px] sm:w-[280px] md:w-[300px] flex flex-col gap-2.5 animate-pulse">
          <div className="aspect-video rounded-xl bg-muted" />
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VideoRow — reusable horizontal scrolling section
   ═══════════════════════════════════════════════════════ */
interface VideoRowProps {
  title: string;
  icon: React.ReactNode;
  query: string;
  accentColor?: string; // e.g. "from-orange-500 to-red-500"
}

const rowCache: Record<string, { videos: Video[]; timestamp: number }> = {};
const ROW_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_ROW_CACHE_ENTRIES = 30;

function pruneRowCache() {
  const keys = Object.keys(rowCache);
  if (keys.length > MAX_ROW_CACHE_ENTRIES) {
    // Remove oldest entries
    keys
      .sort((a, b) => rowCache[a].timestamp - rowCache[b].timestamp)
      .slice(0, keys.length - MAX_ROW_CACHE_ENTRIES)
      .forEach(k => delete rowCache[k]);
  }
}

function VideoRowInner({ title, icon, query, accentColor = "from-primary/80 to-primary" }: VideoRowProps) {
  const { language, location, restrictedMode, direction } = useI18n();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  // Fetch videos for this row
  useEffect(() => {
    const cacheKey = `row-${query}-${language}-${location}-${restrictedMode}`;
    if (rowCache[cacheKey] && Date.now() - rowCache[cacheKey].timestamp < ROW_CACHE_TTL) {
      setVideos(rowCache[cacheKey].videos);
      setIsLoading(false);
      return;
    }

    // Only fetch if not already fetched with same deps
    const controller = new AbortController();

    async function fetchRow() {
      if (hasFetched.current) return;
      hasFetched.current = true;
      setIsLoading(true);

      try {
        const url = new URL("/api/videos/search", window.location.origin);
        url.searchParams.set("q", query);
        url.searchParams.set("location", location);
        url.searchParams.set("language", language);
        url.searchParams.set("restricted", String(restrictedMode));
        url.searchParams.set("limit", "20");

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const vids: Video[] = (data.videos || []).slice(0, 15);

        rowCache[cacheKey] = { videos: vids, timestamp: Date.now() };
        pruneRowCache();
        setVideos(vids);
      } catch {
        // Silently fail — the section just won't show
      } finally {
        setIsLoading(false);
      }
    }

    fetchRow();
    return () => controller.abort();
  }, [query, language, location, restrictedMode]);

  // Reset when query changes
  useEffect(() => {
    hasFetched.current = false;
  }, [query]);

  // Scroll arrow visibility
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    if (direction === "rtl") {
      setShowRightArrow(scrollLeft < -5);
      setShowLeftArrow(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
    } else {
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, [direction]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, videos]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 600 : -600, behavior: "smooth" });
    setTimeout(checkScroll, 400);
  };

  const StartArrow = direction === "rtl" ? ChevronRight : ChevronLeft;
  const EndArrow = direction === "rtl" ? ChevronLeft : ChevronRight;

  // Don't render if still loading on first pass with no videos
  if (isLoading && videos.length === 0) {
    return (
      <section className="py-4" dir={direction}>
        {/* Section header skeleton */}
        <div className="flex items-center gap-3 px-4 sm:px-6 mb-3">
          <div className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded-md animate-pulse" />
        </div>
        <CarouselSkeleton />
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="py-3" dir={direction}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 mb-2.5">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          "bg-gradient-to-br text-background",
          accentColor
        )}>
          {icon}
        </div>
        <h2 className="text-[15px] font-bold text-foreground tracking-tight">{title}</h2>
      </div>

      {/* Horizontal scroll */}
      <div className="relative group/row">
        {/* Left arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll(direction === "rtl" ? "right" : "left")}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-20",
              "w-9 h-9 rounded-full",
              "bg-background/95 backdrop-blur-sm shadow-lg border border-border/60",
              "flex items-center justify-center",
              "opacity-0 group-hover/row:opacity-100 transition-opacity duration-200",
              "hover:bg-muted active:scale-90",
              direction === "rtl" ? "right-0" : "left-0"
            )}
          >
            <StartArrow className="w-4 h-4 text-foreground" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {videos.map((video, i) => (
            <CompactCard key={video.id} video={video} index={i} />
          ))}
        </div>

        {/* Right arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll(direction === "rtl" ? "left" : "right")}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-20",
              "w-9 h-9 rounded-full",
              "bg-background/95 backdrop-blur-sm shadow-lg border border-border/60",
              "flex items-center justify-center",
              "opacity-0 group-hover/row:opacity-100 transition-opacity duration-200",
              "hover:bg-muted active:scale-90",
              direction === "rtl" ? "left-0" : "right-0"
            )}
          >
            <EndArrow className="w-4 h-4 text-foreground" />
          </button>
        )}

        {/* Edge fade */}
        <div className={cn(
          "absolute inset-y-0 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-10",
          direction === "rtl" ? "right-0" : "left-0"
        )} />
        <div className={cn(
          "absolute inset-y-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-10",
          direction === "rtl" ? "left-0" : "right-0"
        )} />
      </div>
    </section>
  );
}

export default memo(VideoRowInner);
export type { VideoRowProps };
