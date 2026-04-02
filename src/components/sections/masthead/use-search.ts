"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useUser } from "@/hooks/use-user";
import { useI18n } from "@/lib/i18n-context";

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
const MAX_RECENT_SEARCHES = 8;

// ═══════════════════════════════════════════════════════
// Return type
// ═══════════════════════════════════════════════════════
export interface UseSearchOptions {
  onSearch?: (query: string) => void;
  externalLoading?: boolean;
  searchQuery?: string;
}

export interface UseSearchReturn {
  // State
  localSearchQuery: string;
  setLocalSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isFocused: boolean;
  suggestions: string[];
  showSuggestions: boolean;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  showMobileSearch: boolean;
  setShowMobileSearch: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  isListening: boolean;
  hasQuery: boolean;
  hasRecent: boolean;

  // Refs
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  mobileInputRef: React.RefObject<HTMLInputElement | null>;
  recentSearches: React.MutableRefObject<string[]>;

  // Handlers
  handleSearch: (e?: React.FormEvent, query?: string) => Promise<void>;
  handleSuggestionClick: (suggestion: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleFocus: () => void;
  handleClear: () => void;
  handleVoiceSearch: () => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (query: string) => void;
  refreshRecentSearches: () => void;

  // I18n helpers
  direction: string;
  isRtlLang: boolean;
  inputDirection: string;
}

// ═══════════════════════════════════════════════════════
// useSearch Hook
// ═══════════════════════════════════════════════════════
export function useSearch({ onSearch, externalLoading = false, searchQuery: initialSearchQuery = "" }: UseSearchOptions): UseSearchReturn {
  // ─── State ───
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);

  // ─── Refs ───
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const recentSearches = useRef<string[]>([]);

  // ─── External deps ───
  const isLoading = isSearching || externalLoading;
  const router = useRouter();
  const { direction, language } = useI18n();
  const isRtlLang = direction === "rtl";
  const inputDirection = direction;
  const { settings, isLoaded: settingsLoaded, setSetting } = useUserSettings();
  const { isAuthenticated } = useUser();

  // ─── Sync with external searchQuery ───
  useEffect(() => {
    setLocalSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // ═══════════════════════════════════════════════════════
  // Recent Searches CRUD
  // ═══════════════════════════════════════════════════════

  const getRecentSearches = useCallback((): string[] => {
    try {
      if (isAuthenticated) {
        const raw = settings.recentSearches;
        return raw ? JSON.parse(raw) : [];
      } else {
        const raw = localStorage.getItem("orchids_recent_searches");
        return raw ? JSON.parse(raw) : [];
      }
    } catch {
      return [];
    }
  }, [isAuthenticated, settings.recentSearches]);

  const persistRecentSearches = useCallback((searches: string[]) => {
    const json = JSON.stringify(searches);
    if (isAuthenticated) {
      setSetting("recentSearches", json);
    } else {
      try { localStorage.setItem("orchids_recent_searches", json); } catch {}
    }
  }, [isAuthenticated, setSetting]);

  const addRecentSearch = useCallback((query: string) => {
    try {
      const existing = getRecentSearches();
      const filtered = existing.filter(s => s !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearches(updated);
      recentSearches.current = updated;
    } catch {}
  }, [getRecentSearches, persistRecentSearches]);

  const clearRecentSearches = useCallback(() => {
    persistRecentSearches([]);
    recentSearches.current = [];
    setShowSuggestions(false);
    setShowSuggestions(true);
  }, [persistRecentSearches]);

  const removeRecentSearch = useCallback((query: string) => {
    try {
      const existing = getRecentSearches();
      const updated = existing.filter(s => s !== query);
      persistRecentSearches(updated);
      recentSearches.current = updated;
      setShowSuggestions(false);
      setShowSuggestions(true);
    } catch {}
  }, [getRecentSearches, persistRecentSearches]);

  // Initialize recent searches from storage
  useEffect(() => {
    if (settingsLoaded || !isAuthenticated) {
      recentSearches.current = getRecentSearches();
    }
  }, [settingsLoaded, isAuthenticated, getRecentSearches]);

  // Refresh recent searches when suggestions panel opens
  const refreshRecentSearches = useCallback(() => {
    recentSearches.current = getRecentSearches();
  }, [getRecentSearches]);

  // ═══════════════════════════════════════════════════════
  // Global keyboard shortcut
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "/" || (e.key.length === 1 && /[a-zA-Z0-9\u0600-\u06FF]/.test(e.key))) {
        if (e.key === "/") e.preventDefault();

        if (window.innerWidth < 768) {
          setShowMobileSearch(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // ═══════════════════════════════════════════════════════
  // Click outside
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ═══════════════════════════════════════════════════════
  // Fetch suggestions with debounce
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (localSearchQuery.trim().length === 0) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    setIsSuggestionsLoading(true);
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/youtube/autocomplete?q=${encodeURIComponent(localSearchQuery)}&hl=${language}`, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) {
            setSuggestions(data);
          }
        }
      } catch {
        if (!controller.signal.aborted) {
          // silent fail
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggestionsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 250);
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
      setIsSuggestionsLoading(false);
    };
  }, [localSearchQuery, language]);

  // ═══════════════════════════════════════════════════════
  // Voice search (Web Speech API)
  // ═══════════════════════════════════════════════════════
  const handleVoiceSearch = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice search is not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "ar" ? "ar-SA" : language === "fr" ? "fr-FR" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast("Listening... Speak now", { icon: "🎙️" });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLocalSearchQuery(transcript);
      setIsListening(false);

      // Auto search after voice input
      setTimeout(() => {
        handleSearch(undefined, transcript);
      }, 300);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Could not recognize speech. Try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [language]);

  // ═══════════════════════════════════════════════════════
  // Search action
  // ═══════════════════════════════════════════════════════
  const handleSearch = useCallback(async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const finalQuery = query || localSearchQuery;
    if (finalQuery.trim()) {
      setIsSearching(true);
      setShowSuggestions(false);
      addRecentSearch(finalQuery.trim());
      if (onSearch) {
        await onSearch(finalQuery.trim());
      } else {
        router.push(`/?search=${encodeURIComponent(finalQuery.trim())}`);
      }
      setTimeout(() => setIsSearching(false), 800);
    }
    setShowMobileSearch(false);
  }, [localSearchQuery, onSearch, addRecentSearch, router]);

  // ═══════════════════════════════════════════════════════
  // Suggestion click
  // ═══════════════════════════════════════════════════════
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setLocalSearchQuery(suggestion);
    handleSearch(undefined, suggestion);
  }, [handleSearch]);

  // ═══════════════════════════════════════════════════════
  // Keyboard navigation in suggestions
  // ═══════════════════════════════════════════════════════
  const totalItems = localSearchQuery.trim().length === 0
    ? recentSearches.current.length
    : suggestions.length;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const items = localSearchQuery.trim().length === 0
        ? recentSearches.current
        : suggestions;
      if (items[selectedIndex]) {
        handleSuggestionClick(items[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      if (showMobileSearch) {
        setShowMobileSearch(false);
      }
      setShowSuggestions(false);
      setIsFocused(false);
      inputRef.current?.blur();
      mobileInputRef.current?.blur();
    }
  }, [totalItems, selectedIndex, localSearchQuery, recentSearches, suggestions, handleSuggestionClick, showMobileSearch]);

  // ═══════════════════════════════════════════════════════
  // Focus and clear handlers
  // ═══════════════════════════════════════════════════════
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    refreshRecentSearches();
    setShowSuggestions(true);
    setSelectedIndex(-1);
  }, [refreshRecentSearches]);

  const handleClear = useCallback(() => {
    setLocalSearchQuery("");
    if (showMobileSearch) {
      mobileInputRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [showMobileSearch]);

  // ─── Derived state ───
  const hasQuery = localSearchQuery.trim().length > 0;
  const hasRecent = recentSearches.current.length > 0;

  return {
    // State
    localSearchQuery,
    setLocalSearchQuery,
    isFocused,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    showMobileSearch,
    setShowMobileSearch,
    isLoading,
    isSuggestionsLoading,
    selectedIndex,
    setSelectedIndex,
    isListening,
    hasQuery,
    hasRecent,

    // Refs
    suggestionsRef,
    inputRef,
    mobileInputRef,
    recentSearches,

    // Handlers
    handleSearch,
    handleSuggestionClick,
    handleKeyDown,
    handleFocus,
    handleClear,
    handleVoiceSearch,
    clearRecentSearches,
    removeRecentSearch,
    refreshRecentSearches,

    // I18n helpers
    direction,
    isRtlLang,
    inputDirection,
  };
}
