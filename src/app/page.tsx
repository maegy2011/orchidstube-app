"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame, Sparkles, GraduationCap } from "lucide-react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import FeedFilterBar from "@/components/sections/feed-filter-bar";
import VideoGrid from "@/components/sections/video-grid";
import VideoRow from "@/components/sections/video-row";
import BackToTopButton from "@/components/sections/back-to-top-button";
import { useI18n } from "@/lib/i18n-context";
import { useIncognito } from "@/lib/incognito-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { direction, t, videosPerPage } = useI18n();
  const { isIncognito } = useIncognito();
  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout();

  // Detect if user is actively searching (hide featured/trending)
  useEffect(() => {
    const hasSearch = Boolean(searchQuery || activeCategory);
    if (hasSearch && !isSearchActive) {
      setIsSearchActive(true);
    } else if (!hasSearch && isSearchActive) {
      setIsSearchActive(false);
    }
  }, [searchQuery, activeCategory, isSearchActive]);

  // ─── Category key → translated name mapping ───
  const categoryKeyMap = useCallback(() => {
    const map: Record<string, string> = {
      education: t("education" as any),
      programming: t("programming" as any),
      science: t("science" as any),
      quran: t("quran" as any),
      music: t("music" as any),
      gaming: t("gaming" as any),
      sports: t("sports" as any),
      documentary: t("documentary" as any),
      kids: t("kids" as any),
      languages: t("languages" as any),
      health: t("health" as any),
      math: t("math" as any),
      business: t("business" as any),
      cooking: t("cooking" as any),
      crafts: t("crafts" as any),
      nature: t("nature" as any),
      tech: t("tech" as any),
      ai: t("ai" as any),
      news: t("news" as any),
    };
    return map;
  }, [t]);

  // ─── Apply a category navigation from sidebar ───
  const applyCategoryFromKey = useCallback(
    (catKey: string) => {
      const map = categoryKeyMap();
      const categoryName = map[catKey];
      if (categoryName) {
        setSearchQuery("");
        setActiveCategory(categoryName);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [categoryKeyMap]
  );

  // ─── Listen for sidebar category navigation (same-page) ───
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.category) {
        applyCategoryFromKey(detail.category);
      }
    };
    window.addEventListener("orchids-sidebar-navigate", handler);
    return () => window.removeEventListener("orchids-sidebar-navigate", handler);
  }, [applyCategoryFromKey]);

  // Persistence to save scroll position and state (disabled in incognito mode)
  useEffect(() => {
    let savedQuery = "", savedCategory = "", savedPage = "", savedScroll = "", sidebarCat = "";
    if (isIncognito) return; // Don't restore state in incognito mode
    try {
      savedQuery = localStorage.getItem("searchQuery") || "";
      savedCategory = localStorage.getItem("activeCategory") || "";
      savedPage = localStorage.getItem("currentPage") || "";
      savedScroll = localStorage.getItem("scrollPosition") || "";
      sidebarCat = localStorage.getItem("orchids_sidebar_cat") || "";
    } catch {}

    if (sidebarCat) {
      try { localStorage.removeItem("orchids_sidebar_cat"); } catch {}
      const map = categoryKeyMap();
      const categoryName = map[sidebarCat];
      if (categoryName) {
        setSearchQuery("");
        setActiveCategory(categoryName);
        setCurrentPage(1);
      }
    } else {
      if (savedQuery) setSearchQuery(savedQuery);
      if (savedCategory) setActiveCategory(savedCategory);
      if (savedPage) {
        const p = parseInt(savedPage);
        if (!isNaN(p)) setCurrentPage(p);
      }
    }

    if (savedScroll && !sidebarCat) {
      const s = parseInt(savedScroll);
      setTimeout(() => {
        if (!isNaN(s)) window.scrollTo(0, s);
      }, 500);
    }

    const handleScroll = () => {
      try { localStorage.setItem("scrollPosition", window.scrollY.toString()); } catch {}
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoryKeyMap, isIncognito]);

  useEffect(() => {
    if (isIncognito) return;
    try { localStorage.setItem("searchQuery", searchQuery); } catch {}
  }, [searchQuery, isIncognito]);

  useEffect(() => {
    if (isIncognito) return;
    try { localStorage.setItem("activeCategory", activeCategory); } catch {}
  }, [activeCategory, isIncognito]);

  useEffect(() => {
    if (isIncognito) return;
    try { localStorage.setItem("currentPage", currentPage.toString()); } catch {}
  }, [currentPage, isIncognito]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setActiveCategory("");
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setCurrentPage(1);
    // Clean sidebar cat URL param if present
    const params = new URLSearchParams(window.location.search);
    if (params.has("cat")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ─── Featured/Trending queries (category-aware, language-aware) ───
  const featuredQuery = t("science");
  const trendingQuery = t("education");

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={direction}>
      <Masthead
        searchQuery={searchQuery}
        onSearch={handleSearch}
        externalLoading={isGridLoading}
      />
      <SidebarGuide />

      <main
        className={`${marginClass} ${mainPaddingTop} transition-all duration-300 ease-in-out flex-1`}
      >
        <FeedFilterBar onCategoryChange={handleCategoryChange} />

        {/* ─── Featured & Trending sections (hidden during active search) ─── */}
        {!isSearchActive && (
          <div className="space-y-2">
            {/* Featured section */}
            <VideoRow
              title={t("featured" as any)}
              icon={<Sparkles size={14} strokeWidth={2.5} />}
              query={featuredQuery}
              accentColor="from-amber-500 to-orange-500"
            />

            {/* Trending section */}
            <VideoRow
              title={t("trending" as any)}
              icon={<Flame size={14} strokeWidth={2.5} />}
              query={trendingQuery}
              accentColor="from-rose-500 to-red-500"
            />

            {/* Popular Now section */}
            <VideoRow
              title={t("popularNow" as any)}
              icon={<GraduationCap size={14} strokeWidth={2.5} />}
              query={t("programming" as any)}
              accentColor="from-emerald-500 to-teal-500"
            />
          </div>
        )}

        {/* ─── Main video grid ─── */}
        <VideoGrid
          searchQuery={searchQuery || activeCategory}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLoadingChange={setIsGridLoading}
          videosPerPage={videosPerPage}
        />
      </main>

      <BackToTopButton />
    </div>
  );
}
