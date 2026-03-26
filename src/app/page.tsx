"use client";

import { useState, useRef, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import FeedFilterBar from "@/components/sections/feed-filter-bar";
import VideoGrid from "@/components/sections/video-grid";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGridLoading, setIsGridLoading] = useState(false);
  const { sidebarMode, direction } = useI18n();
  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout(sidebarOpen);
  const gridRef = useRef<HTMLDivElement>(null);

  // Persistence to "save scroll position" and state
  useEffect(() => {
    const savedQuery = localStorage.getItem("searchQuery");
    const savedCategory = localStorage.getItem("activeCategory");
    const savedPage = localStorage.getItem("currentPage");
    const savedScroll = localStorage.getItem("scrollPosition");

    if (savedQuery) setSearchQuery(savedQuery);
    if (savedCategory) setActiveCategory(savedCategory);
    if (savedPage) setCurrentPage(parseInt(savedPage));
    
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
      }, 500);
    }

    const handleScroll = () => {
      localStorage.setItem("scrollPosition", window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem("searchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("activeCategory", activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage.toString());
  }, [currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategory(""); // Clear category when searching
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchQuery(""); // Clear keyword search when selecting from feed bar
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Masthead 
        searchQuery={searchQuery}
        onSearch={handleSearch} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        externalLoading={isGridLoading}
      />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`${marginClass} ${mainPaddingTop} transition-all duration-300 ease-in-out`}>
        <FeedFilterBar onCategoryChange={handleCategoryChange} />
        
        <VideoGrid 
          searchQuery={searchQuery || activeCategory} 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} // Sync page from grid scroll
          onLoadingChange={setIsGridLoading}
        />
      </main>
    </div>
  );
}
