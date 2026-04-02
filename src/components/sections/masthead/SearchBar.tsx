"use client";

import React, { forwardRef, useImperativeHandle } from "react";
import {
  Search,
  ArrowRight,
  Loader2,
  X,
  Mic,
  MicOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { useSearch } from "./use-search";
import { SuggestionsPanel } from "./SuggestionsPanel";

// ═══════════════════════════════════════════════════════
// Search Bar Props
// ═══════════════════════════════════════════════════════
export interface SearchBarProps {
  onSearch?: (query: string) => void;
  externalLoading?: boolean;
  searchQuery?: string;
}

// ═══════════════════════════════════════════════════════
// Search Bar Handle (imperative API)
// ═══════════════════════════════════════════════════════
export interface SearchBarHandle {
  openMobileSearch: () => void;
}

// ═══════════════════════════════════════════════════════
// Search Bar Component
// ═══════════════════════════════════════════════════════
export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBar({ onSearch, externalLoading, searchQuery }, ref) {
    const { t } = useI18n();

    const {
      localSearchQuery,
      setLocalSearchQuery,
      isFocused,
      showSuggestions,
      showMobileSearch,
      setShowMobileSearch,
      isLoading,
      isSuggestionsLoading,
      selectedIndex,
      setSelectedIndex,
      isListening,
      hasQuery,
      hasRecent,
      suggestionsRef,
      inputRef,
      mobileInputRef,
      recentSearches,
      handleSearch,
      handleSuggestionClick,
      handleKeyDown,
      handleFocus,
      handleClear,
      handleVoiceSearch,
      clearRecentSearches,
      removeRecentSearch,
      refreshRecentSearches,
      suggestions,
      direction,
      isRtlLang,
      inputDirection,
    } = useSearch({ onSearch, externalLoading, searchQuery });

    // ─── Imperative handle: allow parent to open mobile search ───
    useImperativeHandle(ref, () => ({
      openMobileSearch: () => {
        setShowMobileSearch(true);
        refreshRecentSearches();
      },
    }));

    // ═══════════════════════════════════════════════════════
    // ─── RENDER ───
    // ═══════════════════════════════════════════════════════

    return (
      <>
        {/* ─── Mobile Search Overlay ─── */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-[9500] flex flex-col bg-background select-none h-screen overflow-hidden transition-all duration-300"
            >
              {/* Mobile search bar */}
              <div className="flex items-center h-[56px] gap-2 px-3 border-b border-border">
                <button
                  onClick={() => { setShowMobileSearch(false); setShowSuggestions(false); }}
                  className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                >
                  <ArrowRight size={22} className="text-foreground rtl:rotate-180" />
                </button>
                <form onSubmit={handleSearch} className="flex-1 flex items-center bg-muted/70 border border-border/40 rounded-2xl px-3">
                  <Search size={18} className="text-muted-foreground shrink-0 me-2" />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    placeholder={`${t("search")}...`}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    onFocus={handleFocus}
                    className={`flex-1 py-2.5 bg-transparent border-none outline-none text-[16px] text-foreground placeholder-muted-foreground ${isRtlLang ? "text-right" : "text-left"}`}
                    autoFocus
                    dir={inputDirection}
                  />
                  {localSearchQuery && (
                    <button type="button" onClick={handleClear} className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0">
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  )}
                  <div className="h-5 w-[1px] bg-border mx-1.5 shrink-0" />
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={cn(
                      "p-1.5 rounded-full transition-colors shrink-0",
                      isListening ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                  </button>
                  <button type="submit" onClick={handleSearch} className="p-1.5 hover:bg-muted rounded-full transition-colors shrink-0" disabled={isLoading}>
                    {isLoading ? <Loader2 size={18} className="text-red-600 animate-spin" /> : <ArrowRight size={18} className="text-foreground rtl:rotate-180" />}
                  </button>
                </form>
              </div>

              {/* Mobile suggestions list */}
              {showSuggestions && (
                <SuggestionsPanel
                  hasQuery={hasQuery}
                  hasRecent={hasRecent}
                  suggestions={suggestions}
                  recentSearches={recentSearches.current}
                  isSuggestionsLoading={isSuggestionsLoading}
                  localSearchQuery={localSearchQuery}
                  selectedIndex={selectedIndex}
                  t={t}
                  direction={direction}
                  onSuggestionClick={handleSuggestionClick}
                  onRemoveRecentSearch={removeRecentSearch}
                  onClearRecentSearches={clearRecentSearches}
                  isMobile
                  onSetSelectedIndex={setSelectedIndex}
                />
              )}
            </motion.header>
          )}
        </AnimatePresence>

        {/* ─── Desktop Search Bar ─── */}
        <div className="hidden md:flex flex-1 justify-center max-w-[720px] px-2 lg:px-8 relative" ref={suggestionsRef}>
          <div className="flex w-full items-center">
            <motion.form
              onSubmit={handleSearch}
              animate={{
                boxShadow: isFocused
                  ? "0 0 0 2px rgba(255, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)"
                  : "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex flex-1 items-center rounded-2xl px-3 transition-all group relative overflow-hidden",
                isFocused
                  ? "bg-card border-2 border-red-600/30"
                  : "bg-muted/50 border border-border/50 hover:border-border hover:bg-muted/70"
              )}
            >
              {/* Search icon */}
              <div className="flex items-center justify-center w-9 shrink-0">
                <Search
                  size={18}
                  className={cn(
                    "transition-colors duration-200",
                    isFocused ? "text-red-600" : "text-muted-foreground"
                  )}
                />
              </div>

              {/* Input */}
              <div className="flex-1 flex items-center h-[40px]">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`${t("search")}...`}
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-transparent border-none outline-none text-[15px] font-medium placeholder-muted-foreground text-foreground ${isRtlLang ? "text-right" : "text-left"}`}
                  dir={inputDirection}
                />
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Clear button */}
                <AnimatePresence>
                  {localSearchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 hover:bg-muted rounded-full transition-colors"
                    >
                      <X size={15} className="text-muted-foreground" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Voice search button */}
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-200",
                    isListening
                      ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title="Voice search"
                >
                  {isListening ? (
                    <MicOff size={17} className="animate-pulse" />
                  ) : (
                    <Mic size={17} />
                  )}
                </button>

                {/* Divider */}
                <div className="h-5 w-[1px] bg-border/60 mx-1" />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors disabled:opacity-50 active:scale-95"
                  aria-label="Search"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="text-red-600 animate-spin" />
                  ) : (
                    <ArrowRight size={18} className="text-foreground rtl:rotate-180" />
                  )}
                </button>
              </div>

              {/* Keyboard shortcut hint */}
              {!localSearchQuery && !isFocused && (
                <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/80 rounded-md text-[10px] font-mono text-muted-foreground border border-border/50">
                    /
                  </kbd>
                </div>
              )}
            </motion.form>
          </div>

          {/* Desktop Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-[calc(100%+8px)] end-8 start-8 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/[0.08] z-[2100] overflow-hidden max-h-[420px] overflow-y-auto"
              >
                <SuggestionsPanel
                  hasQuery={hasQuery}
                  hasRecent={hasRecent}
                  suggestions={suggestions}
                  recentSearches={recentSearches.current}
                  isSuggestionsLoading={isSuggestionsLoading}
                  localSearchQuery={localSearchQuery}
                  selectedIndex={selectedIndex}
                  t={t}
                  direction={direction}
                  onSuggestionClick={handleSuggestionClick}
                  onRemoveRecentSearch={removeRecentSearch}
                  onClearRecentSearches={clearRecentSearches}
                  onSetSelectedIndex={setSelectedIndex}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    );
  }
);
