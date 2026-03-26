"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";

export default function FeedFilterBar({ onCategoryChange }: { onCategoryChange?: (category: string) => void }) {
  const { t, direction, showRamadanCountdown } = useI18n();
  const [activeCategory, setActiveCategory] = useState(t('all'));
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categories = [
      t('all'),
      t('education' as any) || (direction === 'rtl' ? 'تعليم' : 'Education'),
      t('programming' as any) || (direction === 'rtl' ? 'برمجة' : 'Programming'),
      t('quran' as any) || (direction === 'rtl' ? 'قرآن' : 'Quran'),
      t('science' as any) || (direction === 'rtl' ? 'علوم' : 'Science'),
      t('documentary' as any) || (direction === 'rtl' ? 'وثائقي' : 'Documentary'),
      t('kids' as any) || (direction === 'rtl' ? 'أطفال' : 'Kids'),
      t('languages' as any) || (direction === 'rtl' ? 'لغات' : 'Languages'),
      t('history' as any) || (direction === 'rtl' ? 'تاريخ' : 'History'),
      t('health' as any) || (direction === 'rtl' ? 'صحة' : 'Health'),
      t('math' as any) || (direction === 'rtl' ? 'رياضيات' : 'Math'),
      t('business' as any) || (direction === 'rtl' ? 'أعمال' : 'Business'),
      t('cooking' as any) || (direction === 'rtl' ? 'طبخ' : 'Cooking'),
      t('crafts' as any) || (direction === 'rtl' ? 'حرف يدوية' : 'Crafts'),
      t('nature' as any) || (direction === 'rtl' ? 'طبيعة' : 'Nature'),
      t('tech' as any) || (direction === 'rtl' ? 'تقنية' : 'Tech'),
      t('ai' as any) || (direction === 'rtl' ? 'ذكاء اصطناعي' : 'AI'),
  ];

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      if (direction === 'rtl') {
        setShowRightArrow(scrollLeft < 0);
        setShowLeftArrow(Math.abs(scrollLeft) < scrollWidth - clientWidth - 5);
      } else {
        setShowLeftArrow(scrollLeft > 5);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [direction]);

  const scroll = (dir: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const isRight = dir === "right";
      
      scrollContainerRef.current.scrollBy({
        left: isRight ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 400);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category === t('all') ? "" : category);
    }
  };

  const StartArrow = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const EndArrow = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
  }, []);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const stickyTop = isRamadanCountdownVisible ? 'top-[104px] sm:top-[100px]' : 'top-[64px]';

  return (
    <div className={`sticky ${stickyTop} z-[2010] w-full bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-md px-4 flex items-center h-[56px] border-b border-border/50 shadow-sm transition-all duration-300`}>
      <div className="relative w-full flex items-center overflow-hidden">
        <AnimatePresence>
          {((direction === 'rtl' && showRightArrow) || (direction === 'ltr' && showLeftArrow)) && (
            <motion.div 
              initial={{ opacity: 0, x: direction === 'rtl' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 'rtl' ? 10 : -10 }}
              className={`absolute ${direction === 'rtl' ? 'right-0' : 'left-0'} top-0 bottom-0 flex items-center z-20`}
            >
              <div className={`h-full w-20 bg-gradient-to-${direction === 'rtl' ? 'l' : 'r'} from-background via-background/80 to-transparent pointer-events-none`} />
              <button
                onClick={() => scroll(direction === 'rtl' ? 'right' : 'left')}
                className={`absolute ${direction === 'rtl' ? 'right-0' : 'left-0'} p-2 hover:bg-muted rounded-full transition-all flex items-center justify-center bg-background shadow-md active:scale-90 border border-border`}
                aria-label={t('all')}
              >
                <StartArrow className="w-5 h-5 text-foreground" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "px-5 py-2 rounded-2xl text-[14px] font-semibold transition-all cursor-pointer inline-block active:scale-95",
                activeCategory === category
                  ? "bg-gradient-to-br from-foreground to-foreground/90 text-background shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {((direction === 'rtl' && showLeftArrow) || (direction === 'ltr' && showRightArrow)) && (
            <motion.div 
              initial={{ opacity: 0, x: direction === 'rtl' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === 'rtl' ? -10 : 10 }}
              className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} top-0 bottom-0 flex items-center z-20`}
            >
              <div className={`h-full w-20 bg-gradient-to-${direction === 'rtl' ? 'r' : 'l'} from-background via-background/80 to-transparent pointer-events-none`} />
              <button
                onClick={() => scroll(direction === 'rtl' ? 'left' : 'right')}
                className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} p-2 hover:bg-muted rounded-full transition-all flex items-center justify-center bg-background shadow-md active:scale-90 border border-border`}
                aria-label={t('all')}
              >
                <EndArrow className="w-5 h-5 text-foreground" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
