"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n-context";
import { usePrayer } from "@/lib/prayer-times-context";
import { getDaysUntilRamadan } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar/SidebarItem";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import {
  DESKTOP_BREAKPOINT,
  FULL_WIDTH,
  MINI_WIDTH,
  HEADER_HEIGHT,
  BAR_HEIGHT_MOBILE,
  BAR_HEIGHT_DESKTOP,
  COLLAPSE_STORAGE_KEY,
  NAV_SECTIONS,
  type NavItem,
} from "./sidebar/sidebarData";
import { useSidebarStore } from "@/lib/sidebar-store";

// ═══════════════════════════════════════════════════════
// Section Header Component
// ═══════════════════════════════════════════════════════
const SectionHeader = React.memo(function SectionHeader({
  sectionIcon: SectionIcon,
  label,
  isCollapsed: sectionCollapsed,
  onToggle,
}: {
  sectionIcon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
}) {

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 w-full px-4 py-2 mt-3 first:mt-0",
        "text-muted-foreground hover:text-foreground transition-colors duration-200",
        "group cursor-pointer"
      )}
      aria-expanded={!sectionCollapsed}
    >
      <SectionIcon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
      <span className="text-[11px] font-bold uppercase tracking-wider flex-1 text-start">
        {label}
      </span>
      <motion.div
        animate={{ rotate: sectionCollapsed ? 0 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {sectionCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity rtl:rotate-180" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />
        )}
      </motion.div>
    </button>
  );
});

// ═══════════════════════════════════════════════════════
// Section Separator
// ═══════════════════════════════════════════════════════
function SidebarSeparator({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className={cn("my-1.5", isCollapsed ? "mx-3" : "mx-4")}>
      <div className="h-px bg-border/50" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Collapsed Mode Separator (thin line with dot)
// ═══════════════════════════════════════════════════════
function MiniSeparator() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="w-1 h-1 rounded-full bg-border" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Sidebar Component
// ═══════════════════════════════════════════════════════
interface SidebarGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOverlay?: boolean;
}

export default function SidebarGuide({
  isOpen: isOpenProp,
  onClose: onCloseProp,
  forceOverlay = false,
}: SidebarGuideProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, direction, sidebarMode, showRamadanCountdown } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSm, setIsSm] = useState(false);
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);

  // ─── Global sidebar store ───
  const globalIsOpen = useSidebarStore((s) => s.isOpen);
  const globalClose = useSidebarStore((s) => s.close);

  // Use global store state, fall back to props for backward compatibility
  const isOpen = isOpenProp !== undefined ? isOpenProp : globalIsOpen;
  const onClose = onCloseProp || globalClose;

  // ─── Section collapse state (persisted) ───
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isRTL = direction === "rtl";

  // ─── Responsive detection ───
  useEffect(() => {
    setMounted(true);
    setDaysUntilRamadan(getDaysUntilRamadan());

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
      setIsSm(window.innerWidth >= 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Handle explore category navigation ───
  const handleCategoryClick = useCallback(
    (categoryKey: string) => {
      // Store category for page.tsx to pick up
      try { localStorage.setItem("orchids_sidebar_cat", categoryKey); } catch {}
      // If already on home page, dispatch event for immediate effect
      if (pathname === "/") {
        window.dispatchEvent(
          new CustomEvent("orchids-sidebar-navigate", {
            detail: { category: categoryKey },
          })
        );
      } else {
        router.push("/");
      }
      // Close sidebar
      globalClose();
    },
    [pathname, router, globalClose]
  );

  // ─── Compute top offset ───
  const isRamadanVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const isPrayerVisible = prayerEnabled && nextPrayer !== null;

  const topOffset = useMemo(() => {
    let offset = HEADER_HEIGHT;
    if (isRamadanVisible) offset += isSm ? BAR_HEIGHT_DESKTOP : BAR_HEIGHT_MOBILE;
    if (isPrayerVisible) offset += isSm ? BAR_HEIGHT_DESKTOP : BAR_HEIGHT_MOBILE;
    return offset;
  }, [isRamadanVisible, isPrayerVisible, isSm]);

  // ─── Compute width & state ───
  const { width, isCollapsed, isHidden, isOverlay, showBackdrop } = useMemo(() => {
    if (!mounted) {
      return { width: 0, isCollapsed: false, isHidden: true, isOverlay: false, showBackdrop: false };
    }

    if (forceOverlay) {
      return {
        width: isOpen ? FULL_WIDTH : 0,
        isCollapsed: false,
        isHidden: !isOpen,
        isOverlay: isOpen,
        showBackdrop: isOpen,
      };
    }

    // ─── Mobile (< 1024px) ───
    if (!isDesktop) {
      switch (sidebarMode) {
        case "collapsed":
          return {
            width: isOpen ? MINI_WIDTH : 0,
            isCollapsed: isOpen,
            isHidden: !isOpen,
            isOverlay: isOpen,
            showBackdrop: false,
          };
        case "hidden":
          return {
            width: isOpen ? FULL_WIDTH : 0,
            isCollapsed: false,
            isHidden: !isOpen,
            isOverlay: isOpen,
            showBackdrop: isOpen,
          };
        case "expanded":
        default:
          return {
            width: isOpen ? FULL_WIDTH : 0,
            isCollapsed: false,
            isHidden: !isOpen,
            isOverlay: isOpen,
            showBackdrop: isOpen,
          };
      }
    }

    // ─── Desktop (≥ 1024px) ───
    switch (sidebarMode) {
      case "hidden":
        return {
          width: isOpen ? FULL_WIDTH : 0,
          isCollapsed: false,
          isHidden: !isOpen,
          isOverlay: isOpen,
          showBackdrop: isOpen,
        };
      case "collapsed":
        return {
          width: isOpen ? FULL_WIDTH : MINI_WIDTH,
          isCollapsed: !isOpen,
          isHidden: false,
          isOverlay: false,
          showBackdrop: false,
        };
      case "expanded":
      default:
        return {
          width: isOpen ? MINI_WIDTH : FULL_WIDTH,
          isCollapsed: isOpen,
          isHidden: false,
          isOverlay: false,
          showBackdrop: false,
        };
    }
  }, [mounted, forceOverlay, isDesktop, sidebarMode, isOpen]);

  // ─── Close on navigation (mobile/overlay) ───
  const handleClose = useCallback(() => {
    if (isOverlay) {
      globalClose();
    }
  }, [isOverlay, globalClose]);

  // Auto-close mobile mini sidebar after 5s
  useEffect(() => {
    if (isCollapsed && isOverlay && isOpen) {
      const timer = setTimeout(() => {
        globalClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed, isOverlay, isOpen, globalClose]);

  // ─── Sidebar slide animation variant ───
  const sidebarVariants = useMemo(() => {
    if (isOverlay) {
      return {
        hidden: { x: isRTL ? "100%" : "-100%", opacity: 0.8 },
        visible: { x: 0, opacity: 1 },
      };
    }
    return {
      hidden: { x: isRTL ? "100%" : "-100%", opacity: 0 },
      visible: { x: 0, opacity: 1 },
    };
  }, [isOverlay, isRTL]);

  // ─── Build items for collapsed (mini) sidebar mode ───
  const collapsedItems = useMemo(() => {
    const items: NavItem[] = [];
    for (const section of NAV_SECTIONS) {
      if (section.showInCollapsed) {
        items.push(...section.items);
      } else {
        // Include only Settings from support section
        const settingsItem = section.items.find((i) => i.id === "settings");
        if (settingsItem) items.push(settingsItem);
      }
    }
    return items;
  }, []);

  // ─── Determine active state for category links ───
  const getIsActive = useCallback(
    (item: NavItem) => {
      if (item.isCategoryLink && item.categoryKey) {
        const params = new URLSearchParams(window.location.search);
        return params.get("cat") === item.categoryKey;
      }
      return pathname === item.href;
    },
    [pathname]
  );

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* ─── Overlay Backdrop ─── */}
      <AnimatePresence>
        {isOverlay && showBackdrop && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[6990]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar Panel ─── */}
      <AnimatePresence>
        {(width > 0 || isOverlay) && (
          <motion.aside
            key="sidebar-panel"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed z-[7000] flex flex-col overflow-hidden",
              "bg-background/95 backdrop-blur-md",
              "border-border/40",
              "start-0 border-s",
              "scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
            )}
            style={{
              top: topOffset,
              height: `calc(100vh - ${topOffset}px)`,
              width: isOverlay ? (isCollapsed ? MINI_WIDTH : FULL_WIDTH) : width,
            }}
            aria-label="Navigation sidebar"
          >
            {/* ─── Close button (full overlay only) ─── */}
            {isOverlay && showBackdrop && (
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2 border-b border-border/40"
                )}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("sidebarExpanded" as any)}
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* ─── Navigation Items ─── */}
            <nav className="flex-1 overflow-y-auto py-1">
              {isCollapsed ? (
                /* ─── Collapsed (mini) mode: flat icon list ─── */
                <div className="flex flex-col gap-0.5">
                  {collapsedItems.map((item, idx) => {
                    const showSep =
                      idx > 0 &&
                      collapsedItems[idx - 1].id === "subscriptions" &&
                      item.id === "history";
                    const showSep2 =
                      idx > 0 && collapsedItems[idx - 1].id === "notes" && item.id === "settings";
                    return (
                      <React.Fragment key={item.id}>
                        {showSep && <MiniSeparator />}
                        {showSep2 && <MiniSeparator />}
                        <SidebarItem
                          icon={item.icon}
                          label={t(item.labelKey as any) || item.labelKey}
                          href={item.href}
                          isActive={pathname === item.href}
                          onClick={handleClose}
                          badge={item.badge}
                          badgeColor={item.badgeColor}
                          isCollapsed={true}
                          mounted={mounted}
                          theme={theme}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                /* ─── Expanded mode: sectioned layout ─── */
                <div>
                  {NAV_SECTIONS.map((section, sectionIdx) => {
                    const isSectionCollapsed = collapsedSections.has(section.key);

                    return (
                      <React.Fragment key={section.key}>
                        {/* Section header with collapse toggle */}
                        <SectionHeader
                          sectionIcon={section.icon}
                          label={t(section.labelKey as any) || section.labelKey}
                          isCollapsed={isSectionCollapsed}
                          onToggle={() => toggleSection(section.key)}
                        />

                        {/* Section items with collapse animation */}
                        <AnimatePresence initial={false}>
                          {!isSectionCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
                                opacity: { duration: 0.15 },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-0.5 pb-1">
                                {section.items.map((item) => (
                                  <SidebarItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={t(item.labelKey as any) || item.labelKey}
                                    href={item.isCategoryLink ? undefined : item.href}
                                    isActive={getIsActive(item)}
                                    onClick={
                                      item.isCategoryLink && item.categoryKey
                                        ? () => handleCategoryClick(item.categoryKey!)
                                        : handleClose
                                    }
                                    badge={item.badge}
                                    badgeColor={item.badgeColor}
                                    isCollapsed={false}
                                    mounted={mounted}
                                    theme={theme}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Separator between sections */}
                        {sectionIdx < NAV_SECTIONS.length - 1 && (
                          <SidebarSeparator isCollapsed={false} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* ─── Collapse/Expand Toggle (footer) ─── */}
            <SidebarFooter
              isOverlay={isOverlay}
              isDesktop={isDesktop}
              sidebarMode={sidebarMode}
              isCollapsed={isCollapsed}
              onClose={onClose}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
