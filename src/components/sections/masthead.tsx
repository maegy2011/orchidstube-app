"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  ArrowLeft,
  Search,
} from "lucide-react";
import { OrchidIcon } from "@/components/ui/orchid-icon";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useHeaderTop } from "@/hooks/use-header-top";
import { DateDisplay } from "./masthead/DateDisplay";
import { MastheadUserMenu } from "./masthead/MastheadUserMenu";
import { SearchBar, type SearchBarHandle } from "./masthead/SearchBar";
import { IncognitoBanner } from "@/components/ui/incognito-banner";

interface MastheadProps {
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  externalLoading?: boolean;
  searchQuery?: string;
}

const Masthead = ({ onSearch, onMenuClick, externalLoading, searchQuery }: MastheadProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, direction } = useI18n();
  const headerTop = useHeaderTop();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

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

  const handleClearState = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("searchQuery");
      localStorage.removeItem("currentPage");
      localStorage.removeItem("scrollPosition");
    }
  };

  // ═══════════════════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════════════════

  return (
    <header className={`fixed ${headerTop} inset-x-0 z-[8000] flex flex-col`}>
      <div className="flex items-center justify-between h-[64px] px-4 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl border-b border-border/50 select-none transition-all duration-300 shadow-sm">
      {/* Left side: Back, Menu, Logo */}
      <div className="flex items-center gap-2">
        {!isHome && (
          <button
            className="p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
            onClick={handleBack}
            aria-label={t("back")}
          >
            <ArrowLeft size={22} className="text-foreground rtl:rotate-180" />
          </button>
        )}
        <button
          type="button"
          className="relative z-10 p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
          onClick={(e) => { e.stopPropagation(); onMenuClick?.(); }}
          aria-label={t("menu") || "القائمة"}
        >
          <Menu size={22} className="text-foreground" />
        </button>

        <Link href="/" onClick={handleClearState} className="flex items-center group px-1 shrink-0">
          <div className="flex items-center">
            <div className="relative flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 -my-2 sm:-my-4">
              <div className={cn(
                "absolute inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 blur-md",
                mounted && theme === "boys" ? "bg-sky-100 dark:bg-sky-900/30" : mounted && theme === "girls" ? "bg-pink-100 dark:bg-pink-900/30" : "bg-red-100 dark:bg-red-900/30"
              )} />
              <OrchidIcon
                className={cn(
                  "relative w-14 h-14 sm:w-20 sm:h-20 transition-all duration-500 drop-shadow-2xl group-hover:scale-105",
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
          </div>
        </Link>
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
