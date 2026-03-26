"use client";

import React, { useRef, useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  StickyNote, 
  Home, 
  ArrowLeft,
  ArrowRight, 
  Loader2, 
    X, 
    Clock 
  } from 'lucide-react';
import { OrchidIcon } from '@/components/ui/orchid-icon';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';
import { usePrayer } from '@/lib/prayer-times-context';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getFormattedGregorianDate, getFormattedHijriDate } from '@/lib/date-utils';
import { useHeaderTop } from '@/hooks/use-header-top';

interface MastheadProps {
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  externalLoading?: boolean;
  searchQuery?: string;
}

const Masthead = ({ onSearch, onMenuClick, externalLoading, searchQuery: initialSearchQuery = '' }: MastheadProps) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    setLocalSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);
  const router = useRouter();
  const pathname = usePathname();
  const { t, direction, language, showGregorianDate, showHijriDate, hijriOffset } = useI18n();
  const headerTop = useHeaderTop();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

    const isLoading = isSearching || externalLoading;

    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
        
        if (isInput) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Focus search on '/' key or any alphanumeric key
        if (e.key === '/' || (e.key.length === 1 && /[a-zA-Z0-9\u0600-\u06FF]/.test(e.key))) {
          if (e.key === '/') e.preventDefault();
          
          if (window.innerWidth < 768) {
            setShowMobileSearch(true);
          } else {
            inputRef.current?.focus();
          }
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

    useEffect(() => {
      const fetchSuggestions = async () => {
        if (localSearchQuery.trim().length > 0) {
          try {
            const response = await fetch(`/api/youtube/autocomplete?q=${encodeURIComponent(localSearchQuery)}&hl=${language}`);
            if (response.ok) {
              const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [localSearchQuery]);

  const isRTL = (text: string) => {
    if (!text) return true;
    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\FB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text);
  };

  const handleSearch = async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const finalQuery = query || localSearchQuery;
    if (finalQuery.trim()) {
      setIsSearching(true);
      setShowSuggestions(false);
      if (onSearch) {
        await onSearch(finalQuery.trim());
      } else {
        router.push(`/?search=${encodeURIComponent(finalQuery.trim())}`);
      }
      setTimeout(() => setIsSearching(false), 800);
    }
    setShowMobileSearch(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalSearchQuery(suggestion);
    handleSearch(undefined, suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const inputDirection = direction;
  const isRtlLang = direction === 'rtl';
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get('search');
  const isHome = pathname === '/' && !searchQueryParam;

  const handleBack = () => {
    if (searchQueryParam) {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleClearState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("searchQuery");
      localStorage.removeItem("currentPage");
      localStorage.removeItem("scrollPosition");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showMobileSearch && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed ${headerTop} left-0 right-0 z-[2050] flex flex-col bg-background select-none h-screen overflow-hidden transition-all duration-300`}
          >
            <div className="flex items-center h-[56px] px-2 border-b border-border">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowRight size={24} className="text-foreground rtl:rotate-180" />
              </button>
                <form onSubmit={handleSearch} className="flex-1 flex items-center bg-muted rounded-full px-4 mx-2">
                    <input
                      type="text"
                      placeholder={`${t('search')}...`}
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className={`flex-1 py-2 bg-transparent border-none outline-none text-[16px] text-foreground ${isRtlLang ? 'text-right' : 'text-left'}`}
                      autoFocus
                      dir={inputDirection}
                    />
                  {localSearchQuery && (
                    <button type="button" onClick={() => setLocalSearchQuery('')} className="p-1">
                      <X size={18} className="text-muted-foreground" />
                    </button>
                  )}
                </form>
              <button type="submit" onClick={handleSearch} className="p-2" disabled={isLoading}>
                {isLoading ? <Loader2 size={24} className="text-red-600 animate-spin" /> : <Search size={24} className="text-foreground" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-background pt-2">
              {suggestions.length > 0 && suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full px-4 py-3 hover:bg-muted flex items-center gap-4 text-[16px] text-foreground active:bg-muted/80 flex-row`}
                        dir={direction}
                    >
                  <Search size={20} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 text-start truncate font-medium">{suggestion}</span>
                </button>
              ))}
            </div>
          </motion.header>
        )}
      </AnimatePresence>

        <header className={`fixed ${headerTop} left-0 right-0 z-[8000] flex items-center justify-between h-[64px] px-4 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-xl border-b border-border/50 select-none transition-all duration-300 shadow-sm`}>
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              className="p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
              onClick={handleBack}
              aria-label={t('back')}
            >
              <ArrowLeft size={22} className="text-foreground rtl:rotate-180" />
            </button>
          )}
          <button
            className="p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
            onClick={onMenuClick}
            aria-label="القائمة"
          >
            <Menu size={22} className="text-foreground" />
          </button>

            <Link href="/" onClick={handleClearState} className="flex items-center group px-1">
              <div className="flex items-center">
                <div className="relative flex items-center justify-center w-20 h-20 -my-4">
                  <div className={cn(
                    "absolute inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 blur-md",
                    mounted && theme === 'boys' ? 'bg-sky-100 dark:bg-sky-900/30' : mounted && theme === 'girls' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  )} />
                  <OrchidIcon
                    className={cn(
                      "relative w-20 h-20 transition-all duration-500 drop-shadow-2xl group-hover:scale-105",
                      mounted && theme === 'boys' ? 'text-sky-500' : mounted && theme === 'girls' ? 'text-pink-500' : 'text-red-600'
                    )}
                  />
                </div>
                <span className={cn(
                  "text-[22px] font-bold tracking-tight ms-0 hidden sm:inline-block transition-all duration-500 group-hover:tracking-normal",
                  mounted && theme === 'boys' ? 'text-sky-600' : mounted && theme === 'girls' ? 'text-pink-600' : 'text-foreground'
                )}>
                  {t('appName')}
                </span>
              </div>
            </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center max-w-[720px] px-2 lg:px-8 relative" ref={suggestionsRef}>
          <div className="flex w-full items-center gap-4">
            <form onSubmit={handleSearch} className={cn(
              "flex flex-1 items-center bg-muted/50 border border-border/50 rounded-2xl px-4 focus-within:border-primary/50 focus-within:bg-background transition-all group shadow-sm hover:shadow-md",
              "focus-within:shadow-lg focus-within:shadow-primary/10"
            )}>
              <div className="flex-1 flex items-center h-[40px]">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`${t('search')}...`}
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                    className={`w-full bg-transparent border-none outline-none text-[16px] font-medium placeholder-muted-foreground text-foreground ${isRtlLang ? 'text-right' : 'text-left'}`}
                    dir={inputDirection}
                />
                {localSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="h-6 w-[1px] bg-border mx-2" />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2 hover:bg-muted/50 rounded-full transition-colors disabled:opacity-50 active:scale-95"
                aria-label="بحث"
              >
                {isLoading ? <Loader2 size={20} className="text-red-600 animate-spin" /> : <Search size={20} className="text-foreground" />}
              </button>
            </form>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-[48px] right-8 left-8 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-primary/5 py-2 z-[2100] overflow-hidden"
              >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full px-5 py-2.5 hover:bg-muted/50 flex items-center gap-3 text-[15px] font-medium text-foreground transition-colors ${selectedIndex === index ? 'bg-muted/80' : ''} flex-row`}
                        dir={direction}
                    >
                    <Search size={18} className="text-muted-foreground/70 shrink-0" />
                    <span className="flex-1 text-start truncate">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="hidden lg:flex flex-col items-end me-2 text-[11px] font-bold text-muted-foreground/80 leading-tight">
                {mounted && showGregorianDate && (
                  <div className="whitespace-nowrap uppercase tracking-tighter">
                    {getFormattedGregorianDate(language)}
                  </div>
                )}
                {mounted && showHijriDate && (
                  <div className="whitespace-nowrap uppercase tracking-tighter text-primary/80">
                    {getFormattedHijriDate(language, hijriOffset)}
                  </div>
                )}
              </div>
            <button
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2.5 rounded-full hover:bg-muted/80 transition-all active:scale-95 hover:shadow-md"
              aria-label="بحث"
            >
              <Search size={22} className="text-foreground" />
            </button>


          </div>
        </header>
    </>
  );
};

export default Masthead;
