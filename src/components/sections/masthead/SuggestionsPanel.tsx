"use client";

import React from "react";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
// SuggestionsPanel Props
// ═══════════════════════════════════════════════════════
export interface SuggestionsPanelProps {
  hasQuery: boolean;
  hasRecent: boolean;
  suggestions: string[];
  recentSearches: string[];
  isSuggestionsLoading: boolean;
  localSearchQuery: string;
  selectedIndex: number;
  t: (key: string) => string | undefined;
  direction: string;
  onSuggestionClick: (suggestion: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  isMobile?: boolean;
  onSetSelectedIndex?: (index: number) => void;
}

// ═══════════════════════════════════════════════════════
// SuggestionsPanel Component
// ═══════════════════════════════════════════════════════
export function SuggestionsPanel({
  hasQuery,
  hasRecent,
  suggestions,
  recentSearches,
  isSuggestionsLoading,
  localSearchQuery,
  selectedIndex,
  t,
  direction,
  onSuggestionClick,
  onRemoveRecentSearch,
  onClearRecentSearches,
  isMobile = false,
  onSetSelectedIndex,
}: SuggestionsPanelProps) {
  const itemClass = cn(
    "w-full flex items-center gap-3 text-foreground transition-colors",
    isMobile ? "px-4 py-3 text-[16px]" : "px-4 py-2.5 text-[15px] font-medium"
  );

  return (
    <div className={cn(isMobile ? "flex-1 overflow-y-auto pt-1" : "")}>
      {/* Loading skeleton */}
      {isSuggestionsLoading && hasQuery && (
        <div className="space-y-1 p-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />
              <div className="h-4 rounded-md bg-muted animate-pulse flex-1" style={{ width: `${60 + Math.random() * 30}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* Recent searches (only when no query) */}
      {!hasQuery && hasRecent && !isSuggestionsLoading && (
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className={cn("text-muted-foreground flex items-center gap-1.5", isMobile ? "text-xs" : "text-xs font-semibold uppercase tracking-wide")}>
              <Clock size={12} />
              {t("recentSearches") || "Recent"}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onClearRecentSearches(); }}
              className={cn("text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1", isMobile ? "text-xs" : "text-xs")}
            >
              <Eraser size={11} />
              {t("clear") || "Clear"}
            </button>
          </div>
          {recentSearches.map((item, index) => (
            <button
              key={item}
              onClick={() => onSuggestionClick(item)}
              onMouseEnter={() => onSetSelectedIndex?.(index)}
              className={cn(
                itemClass,
                selectedIndex === index ? "bg-muted/80" : "hover:bg-muted/50",
                "group"
              )}
              dir={direction}
            >
              <Clock size={isMobile ? 18 : 16} className="text-muted-foreground/60 shrink-0" />
              <span className="flex-1 text-start truncate">{item}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveRecentSearch(item); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-full transition-all"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete suggestions (when has query) */}
      {hasQuery && suggestions.length > 0 && !isSuggestionsLoading && (
        <div>
          <div className="flex items-center px-4 py-2">
            <span className={cn("text-muted-foreground flex items-center gap-1.5", isMobile ? "text-xs" : "text-xs font-semibold uppercase tracking-wide")}>
              <TrendingUp size={12} />
              {t("suggestions") || "Suggestions"}
            </span>
          </div>
          {suggestions.map((suggestion, index) => {
            // Highlight matching text
            const lowerQuery = localSearchQuery.toLowerCase();
            const lowerSuggestion = suggestion.toLowerCase();
            const matchIndex = lowerSuggestion.indexOf(lowerQuery);
            let displayContent: React.ReactNode;
            if (matchIndex >= 0) {
              const before = suggestion.slice(0, matchIndex);
              const match = suggestion.slice(matchIndex, matchIndex + localSearchQuery.length);
              const after = suggestion.slice(matchIndex + localSearchQuery.length);
              displayContent = (
                <>
                  <span>{before}</span>
                  <span className="font-bold">{match}</span>
                  <span>{after}</span>
                </>
              );
            } else {
              displayContent = suggestion;
            }

            return (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                onMouseEnter={() => onSetSelectedIndex?.(index)}
                className={cn(
                  itemClass,
                  selectedIndex === index ? "bg-muted/80" : "hover:bg-muted/50"
                )}
                dir={direction}
              >
                <Search size={isMobile ? 18 : 16} className="text-muted-foreground/60 shrink-0" />
                <span className="flex-1 text-start truncate">{displayContent}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state: no recent, no query */}
      {!hasQuery && !hasRecent && !isSuggestionsLoading && (
        <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", isMobile ? "" : "px-4")}>
          <Search size={32} className="mb-2 opacity-30" />
          <p className="text-sm">{t("searchEmpty") || "Search for videos"}</p>
          <p className={cn("text-xs mt-1 opacity-60", isMobile ? "px-8 text-center" : "")}>
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">/</kbd> to focus
          </p>
        </div>
      )}

      {/* No results found for query */}
      {hasQuery && suggestions.length === 0 && !isSuggestionsLoading && (
        <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", isMobile ? "" : "px-4")}>
          <Search size={32} className="mb-2 opacity-30" />
          <p className="text-sm">{t("noSuggestions") || "No suggestions found"}</p>
        </div>
      )}
    </div>
  );
}
