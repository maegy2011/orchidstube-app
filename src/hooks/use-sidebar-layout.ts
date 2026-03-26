"use client";

import { useI18n } from "@/lib/i18n-context";
import { useEffect, useState } from "react";

export function useSidebarLayout(isOpen: boolean) {
  const { direction, sidebarMode } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const getStandardMarginClass = () => {
    if (!mounted || !isDesktop) return "";

    const isRTL = direction === "rtl";
    
    if (sidebarMode === "hidden") {
      if (isOpen) {
        return isRTL ? "lg:mr-[240px]" : "lg:ml-[240px]";
      } else {
        return "";
      }
    } else if (sidebarMode === "collapsed") {
      if (isOpen) {
        return isRTL ? "lg:mr-[240px]" : "lg:ml-[240px]";
      } else {
        return isRTL ? "lg:mr-[72px]" : "lg:ml-[72px]";
      }
    } else {
      if (isOpen) {
        return isRTL ? "lg:mr-[72px]" : "lg:ml-[72px]";
      } else {
        return isRTL ? "lg:mr-[240px]" : "lg:ml-[240px]";
      }
    }
  };

  const marginClass = mounted ? getStandardMarginClass() : "";

  return {
    marginClass,
    isDesktop,
    mounted
  };
}
