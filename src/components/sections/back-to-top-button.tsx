"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";

/* ═══════════════════════════════════════════════════════
   SVG Progress Ring — shows scroll percentage
   ═══════════════════════════════════════════════════════ */
function ProgressRing({ progress, size, strokeWidth, color }: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90"
      style={{ width: size, height: size }}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-10"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-150 ease-out"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   Tooltip — desktop hover label
   ═══════════════════════════════════════════════════════ */
const Tooltip = memo(function Tooltip({ label, direction }: {
  label: string;
  direction: "ltr" | "rtl";
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9, x: direction === "rtl" ? -6 : 6 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: direction === "rtl" ? -6 : 6 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute whitespace-nowrap",
        "bg-foreground text-background text-xs font-medium",
        "px-2.5 py-1 rounded-lg shadow-lg",
        "pointer-events-none select-none",
        "hidden sm:block",
        direction === "rtl"
          ? "-left-[calc(100%+10px)] top-1/2 -translate-y-1/2"
          : "-right-[calc(100%+10px)] top-1/2 -translate-y-1/2"
      )}
    >
      {label}
    </motion.span>
  );
});

/* ═══════════════════════════════════════════════════════
   BackToTopButton — responsive floating action button
   ═══════════════════════════════════════════════════════ */
function BackToTopButtonInner() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { direction, t } = useI18n();
  const { marginClass } = useSidebarLayout(false);

  // ─── Calculate scroll progress ───
  const updateScrollProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    setScrollProgress(progress);
    setIsVisible(scrollTop > 400);
  }, []);

  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress(); // Initial call
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateScrollProgress]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ─── Responsive sizing tokens ───
  const isRtl = direction === "rtl";

  // Ring stroke width scales with button size
  const ringStroke = useMemo(() => ({
    base: 2.5,   // mobile: 2.5px
    sm: 2.5,     // sm: 2.5px
    md: 2,       // tablet: 2px (thinner on medium)
    lg: 2,       // desktop: 2px
  }), []);

  // Icon size scales with button
  const iconSize = useMemo(() => ({
    base: 18,
    sm: 18,
    md: 20,
    lg: 18,
  }), []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 24 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8,
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
          className={cn(
            /* ── Base ── */
            "fixed z-50 rounded-full shadow-xl",
            "flex items-center justify-center",
            "no-kids-round", // Don't override radius in kids mode
            "transition-shadow duration-200",
            "hover:shadow-2xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "select-none",
            /* ── Size: mobile-first ── */
            "w-12 h-12",                                       // mobile: 48px
            "sm:w-12 sm:h-12",                                 // sm: 48px
            "md:w-[52px] md:h-[52px]",                          // tablet: 52px
            "lg:w-11 lg:h-11",                                 // desktop: 44px (slightly compact)
            /* ── Position: bottom edge, with safe area ── */
            "bottom-4",                                         // mobile: 16px
            "sm:bottom-6",                                      // sm: 24px
            "md:bottom-8",                                      // tablet: 32px
            "lg:bottom-6",                                      // desktop: 24px
            /* ── Horizontal: RTL-aware ── */
            isRtl ? "left-4 sm:left-5 md:left-8 lg:left-6" : "right-4 sm:right-5 md:right-8 lg:right-6",
            /* ── Color: glass effect on larger screens ── */
            "bg-foreground/90 backdrop-blur-md",
            "lg:bg-foreground/80 lg:backdrop-blur-lg",
            "text-background",
            /* ── Safe area for iOS notch devices ── */
            "[padding-bottom:env(safe-area-inset-bottom,0px)]"
          )}
          aria-label={t("backToTop" as any)}
        >
          {/* Progress Ring — mobile always visible, desktop on hover */}
          <ProgressRing
            progress={scrollProgress}
            size={48}
            strokeWidth={ringStroke.base}
            color="currentColor"
          />

          {/* Arrow icon */}
          <ArrowUp
            size={iconSize.base}
            className="relative z-10 shrink-0"
            strokeWidth={2.5}
          />

          {/* Desktop tooltip */}
          <AnimatePresence>
            {isHovered && (
              <Tooltip
                label={t("backToTop" as any)}
                direction={direction}
              />
            )}
          </AnimatePresence>

          {/* Scroll percentage badge — desktop only */}
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                className={cn(
                  "absolute -top-2 -right-2",
                  "bg-primary text-primary-foreground",
                  "text-[10px] font-bold",
                  "min-w-[20px] h-5 px-1 rounded-full",
                  "flex items-center justify-center",
                  "shadow-md border-2 border-background",
                  "hidden lg:flex",
                  isRtl && "-left-2 right-auto"
                )}
              >
                {Math.round(scrollProgress)}%
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default memo(BackToTopButtonInner);
