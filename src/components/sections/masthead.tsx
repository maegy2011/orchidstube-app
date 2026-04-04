"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  ArrowLeft,
  Search,
} from "lucide-react";
import { OrchidIcon } from "@/components/ui/orchid-icon";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useHeaderTop } from "@/hooks/use-header-top";
import { DateDisplay } from "./masthead/DateDisplay";
import { MastheadUserMenu } from "./masthead/MastheadUserMenu";
import { SearchBar, type SearchBarHandle } from "./masthead/SearchBar";
import { IncognitoBanner } from "@/components/ui/incognito-banner";
import { useSidebarStore } from "@/lib/sidebar-store";

interface MastheadProps {
  onSearch?: (query: string) => void;
  externalLoading?: boolean;
  searchQuery?: string;
}

const Masthead = ({ onSearch, externalLoading, searchQuery }: MastheadProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, direction } = useI18n();
  const headerTop = useHeaderTop();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchBarRef = useRef<SearchBarHandle>(null);

  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get("search");
  const isHome = pathname === "/" && !searchQueryParam;

  const handleBack = () => {
    if (searchQueryParam) {
      router.push("/");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleClearState = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchQuery");
      localStorage.removeItem("currentPage");
      localStorage.removeItem("scrollPosition");
    }
  }, []);

  const handleLogoClick = useCallback(() => {
    handleClearState();
    router.push("/");
  }, [handleClearState, router]);

  // ─── Track menu button touch to prevent bleed to logo ───
  const menuTouchRef = useRef(false);

  // ═══════════════════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════════════════

  return (
    <header className={`fixed ${headerTop} inset-x-0 z-[8000] flex flex-col`}>
      <div className="flex items-center justify-between h-[64px] px-4 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl border-b border-border/50 select-none transition-all duration-300 shadow-sm">
      {/* Left side: Back, Menu, Logo */}
      <div className="flex items-center shrink-0">
        {/* Back button (non-home only) */}
        {!isHome && (
          <button
            className="p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
            onClick={handleBack}
            aria-label={t("back")}
          >
            <ArrowLeft size={22} className="text-foreground rtl:rotate-180" />
          </button>
        )}

        {/* Menu button — isolated in its own stacking context */}
        <div style={{ isolation: "isolate" }} className="relative z-50">
          <button
            type="button"
            className="p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md touch-manipulation"
            onPointerDown={(e) => {
              e.stopPropagation();
              menuTouchRef.current = true;
            }}
            onTouchStart={(e) => {
              menuTouchRef.current = true;
            }}
            onTouchEnd={(e) => {
              // Only fire if touch didn't leave the button
              if (menuTouchRef.current) {
                e.stopPropagation();
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              menuTouchRef.current = false;
              toggleSidebar();
            }}
            aria-label={t("menu") || "القائمة"}
          >
            <Menu size={22} className="text-foreground" />
          </button>
        </div>

        {/* Spacer — absorbs stray touches between ☰ and logo */}
        <div className="w-1 shrink-0" onPointerDown={(e) => e.preventDefault()} />

        {/* Logo — uses div+router.push instead of Link to avoid <a> touch bleed */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center group shrink-0 bg-transparent border-none p-0 cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16 overflow-hidden">
            <div className={cn(
              "absolute inset-2 sm:inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 blur-md",
              mounted && theme === "boys" ? "bg-sky-100 dark:bg-sky-900/30" : mounted && theme === "girls" ? "bg-pink-100 dark:bg-pink-900/30" : "bg-red-100 dark:bg-red-900/30"
            )} />
            <OrchidIcon
              className={cn(
                "w-8 h-8 sm:w-16 sm:h-16 transition-all duration-500 drop-shadow-2xl group-hover:scale-105",
                mounted && theme === "boys" ? "text-sky-500" : mounted && theme === "girls" ? "text-pink-500" : "text-red-600"
              )}
            />
          </div>
          <span className={cn(
            "text-[22px] font-bold tracking-tight ms-0 hidden sm:inline-block transition-all duration-500 group-hover:tracking-normal",
            mounted && theme === "boys" ? "text-sky-600" : mounted && theme === "girls" ? "text-pink-600" : "text-foreground"
          )}>
            {t("appName")}
          </span>
        </button>
      </div>

      {/* Center: Desktop Search Bar */}
      <SearchBar
        ref={searchBarRef}
        onSearch={onSearch}
        externalLoading={externalLoading}
        searchQuery={searchQuery}
      />

      {/* Right side: Date, Mobile search, User menu */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <DateDisplay />
        <button
          onClick={() => searchBarRef.current?.openMobileSearch()}
          className="md:hidden p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
          aria-label="Search"
        >
          <Search size={22} className="text-foreground" />
        </button>

        <MastheadUserMenu />
      </div>
      </div>
      <IncognitoBanner />
    </header>
  );
};

export default Masthead;
