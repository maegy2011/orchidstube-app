"use client";

import { useI18n } from "@/lib/i18n-context";
import { useSidebarStore } from "@/lib/sidebar-store";
import { useEffect, useState, useMemo } from "react";

const DESKTOP_BREAKPOINT = 1024;
const FULL_WIDTH = 240;
const MINI_WIDTH = 72;

export function useSidebarLayout(isOpenProp?: boolean) {
  const { direction, sidebarMode } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const globalIsOpen = useSidebarStore((s) => s.isOpen);

  // Use global store by default, fall back to prop
  const isOpen = isOpenProp !== undefined ? isOpenProp : globalIsOpen;

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const marginClass = useMemo(() => {
    if (!mounted || !isDesktop) return "";

    const marginSide = "lg:ms-";

    switch (sidebarMode) {
      case "hidden":
        return isOpen ? `${marginSide}[${FULL_WIDTH}px]` : "";
      case "collapsed":
        return isOpen ? `${marginSide}[${FULL_WIDTH}px]` : `${marginSide}[${MINI_WIDTH}px]`;
      case "expanded":
      default:
        return isOpen ? `${marginSide}[${MINI_WIDTH}px]` : `${marginSide}[${FULL_WIDTH}px]`;
    }
  }, [mounted, isDesktop, direction, sidebarMode, isOpen]);

  return {
    marginClass,
    isDesktop,
    mounted,
  };
}
