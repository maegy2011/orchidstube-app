"use client";

import React from 'react';
import { 
  Home, 
  PlaySquare, 
  StickyNote, 
  X, 
  Heart, 
  History, 
  Settings, 
  HelpCircle, 
  MessageSquarePlus, 
  Headphones, 
  ChevronLeft, 
  Clock,
  Zap,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n-context';
import { usePrayer } from '@/lib/prayer-times-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  isActive = false,
  onClick,
  suffix,
  isCollapsed = false,
  mounted = true
}: {
  icon: React.ElementType,
  label: string,
  href?: string,
  isActive?: boolean,
  onClick?: () => void,
  suffix?: React.ReactNode,
  isCollapsed?: boolean,
  mounted?: boolean
}) => {
  const { direction } = useI18n();
  const { theme } = useTheme();

  const getActiveStyles = () => {
    if (!mounted) return 'bg-muted text-foreground';
    if (theme === 'boys') return 'bg-gradient-to-r from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-900/30 text-sky-600 shadow-sm shadow-sky-500/10';
    if (theme === 'girls') return 'bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/30 text-pink-600 shadow-sm shadow-pink-500/10';
    return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 text-red-600 shadow-sm shadow-red-500/10';
  };

  const getIconStyles = () => {
    if (!mounted) return 'text-foreground';
    if (theme === 'boys') return isActive ? 'text-sky-600 fill-sky-600/10' : 'text-foreground';
    if (theme === 'girls') return isActive ? 'text-pink-600 fill-pink-600/10' : 'text-foreground';
    return isActive ? 'text-red-600 fill-red-600/10' : 'text-foreground';
  };

  const getIndicatorColor = () => {
    if (!mounted) return 'bg-muted-foreground';
    if (theme === 'boys') return 'bg-sky-600';
    if (theme === 'girls') return 'bg-pink-600';
    return 'bg-red-600';
  };

    const content = (
      <div
        title={isCollapsed ? label : undefined}
        className={`
          flex items-center cursor-pointer transition-all duration-200
          rounded-xl group relative
          ${isCollapsed ? 'flex-col justify-center h-[72px] px-1 mx-1' : 'h-[40px] px-3 mx-3 w-full'}
          ${isActive ? getActiveStyles() : 'bg-transparent hover:bg-muted text-foreground'}
        `}
      >
        <div className={`flex items-center justify-center w-6 h-6 ${isCollapsed ? 'mb-1' : 'me-4'}`}>
          <Icon 
            className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${getIconStyles()}`} 
            strokeWidth={isActive ? 2.5 : 2}
          />
        </div>
        
        {!isCollapsed ? (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span 
              className={`
                whitespace-nowrap overflow-hidden text-ellipsis text-start
                ${isActive ? 'font-semibold' : 'font-medium'}
                text-[14px] leading-tight
              `}
            >
              {label}
            </span>
            {suffix && (
              <div className="ms-2 text-muted-foreground group-hover:text-foreground transition-colors">
                {suffix}
              </div>
            )}
            </div>
          ) : null}
  
          {isActive && !isCollapsed && (
          <motion.div 
            layoutId="activeSide"
            className={`absolute ${direction === 'rtl' ? 'right-0' : 'left-0'} w-1 h-6 ${getIndicatorColor()} rounded-full`}
          />
        )}
      </div>
    );
  
    if (href && href !== '#') {
      return (
        <Link 
          href={href} 
          className={isCollapsed ? "w-full flex justify-center" : "w-full"}
          onClick={onClick}
        >
          {content}
        </Link>
      );
    }
  
    return (
      <div onClick={onClick} className="w-full">
        {content}
      </div>
    );
};

interface SidebarGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOverlay?: boolean;
}

  const SidebarGuide = ({ isOpen = false, onClose, forceOverlay = false }: SidebarGuideProps) => {
  const pathname = usePathname();
  const { t, direction, sidebarMode, showRamadanCountdown } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const [mounted, setMounted] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [daysUntilRamadan, setDaysUntilRamadan] = React.useState<number | null>(null);

    React.useEffect(() => {
      setMounted(true);
      setDaysUntilRamadan(getDaysUntilRamadan());
      const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
      const checkSm = () => setIsSm(window.innerWidth >= 640);
      checkDesktop();
      checkSm();
      window.addEventListener('resize', () => {
        checkDesktop();
        checkSm();
      });
      return () => {
        window.removeEventListener('resize', checkDesktop);
        window.removeEventListener('resize', checkSm);
      };
    }, []);

    const [isSm, setIsSm] = React.useState(false);
    const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
    const isPrayerBarVisible = prayerEnabled && nextPrayer !== null;
    
    const headerHeight = 64;
    const ramadanHeightMobile = 40;
    const ramadanHeightDesktop = 36;
    const prayerHeightMobile = 40;
    const prayerHeightDesktop = 36;
    
    const currentRamadanHeight = isRamadanCountdownVisible ? (isSm ? ramadanHeightDesktop : ramadanHeightMobile) : 0;
    const currentPrayerHeight = isPrayerBarVisible ? (isSm ? prayerHeightDesktop : prayerHeightMobile) : 0;
    
    const topOffsetVal = headerHeight + currentRamadanHeight + currentPrayerHeight;
  
  let width = '240px';

  let isActuallyCollapsed = false;
  let isHidden = false;

  if (!mounted) {
    width = '240px';
    isHidden = true;
  } else if (forceOverlay) {
    width = '240px';
    isHidden = !isOpen;
  } else if (!isDesktop) {
    width = '240px';
    isHidden = !isOpen;
  } else {
    if (sidebarMode === 'hidden') {
      if (isOpen) {
        width = '240px';
      } else {
        width = '0px';
        isHidden = true;
      }
    } else if (sidebarMode === 'collapsed') {
      if (isOpen) {
        width = '240px';
      } else {
        width = '72px';
        isActuallyCollapsed = true;
      }
    } else {
      if (isOpen) {
        width = '72px';
        isActuallyCollapsed = true;
      } else {
        width = '240px';
      }
    }
  }

  const showOverlay = mounted && isOpen && (forceOverlay || sidebarMode === 'hidden' || !isDesktop);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {showOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[6990]"
              onClick={onClose}
            />
          )}
        </AnimatePresence>
  
              <aside 
                className={`
                  bg-gradient-to-b from-background to-background/95 flex flex-col fixed z-[7000] overflow-y-auto
                  transition-all duration-300 ease-in-out border-border/50
                  ${direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}
                ${!mounted ? 'invisible' : 'visible'}
                scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40
              `}
              style={{ 
                top: topOffsetVal,
                height: `calc(100vh - ${topOffsetVal}px)`,
                width: isHidden && !showOverlay ? '0px' : width,
                transform: isHidden && !showOverlay ? (direction === 'rtl' ? 'translateX(100%)' : 'translateX(-100%)') : 'translateX(0)',
                visibility: isHidden && !showOverlay ? 'hidden' : 'visible'
              }}
              aria-label={t('settings')}
            >
          <div className={`flex flex-col gap-1 ${!isActuallyCollapsed ? 'py-1' : 'lg:py-2'}`}>

          <SidebarItem 
            icon={Home} 
            label={t('home')} 
            href="/"
            isActive={pathname === '/'} 
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={Zap} 
            label="Shorts" 
            href="/shorts"
            isActive={pathname === '/shorts'} 
            onClick={onClose}
            suffix={isActuallyCollapsed ? null : <span className="text-[10px] bg-red-600 text-white px-1 rounded animate-pulse">HOT</span>}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={PlaySquare} 
            label={t('subscriptions')}
            href="/subscriptions"
            isActive={pathname === '/subscriptions'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
        </div>

        <div className={`h-[1px] bg-border my-2 ${!isActuallyCollapsed ? 'mx-4' : 'lg:mx-2'}`} />

        <div className="flex flex-col gap-1 py-1">
          <SidebarItem 
            icon={History} 
            label={t('history')}
            href="/history"
            isActive={pathname === '/history'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={Heart} 
            label={t('favorites')}
            href="/favorites"
            isActive={pathname === '/favorites'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={Clock} 
            label={t('watchLater')}
            href="/watch-later"
            isActive={pathname === '/watch-later'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={StickyNote} 
            label={t('notes')}
            href="/notes"
            isActive={pathname === '/notes'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
        </div>

        <div className={`h-[1px] bg-border my-2 ${!isActuallyCollapsed ? 'mx-4' : 'lg:mx-2'}`} />

        <div className="flex flex-col gap-1 py-1 pb-20">
          <SidebarItem 
            icon={HelpCircle} 
            label={t('help')} 
            href="/help"
            isActive={pathname === '/help'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={MessageSquarePlus} 
            label={t('feedback')} 
            href="/feedback"
            isActive={pathname === '/feedback'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={Headphones} 
            label={t('support')} 
            href="/support"
            isActive={pathname === '/support'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
          <SidebarItem 
            icon={Settings} 
            label={t('settings')} 
            href="/settings"
            isActive={pathname === '/settings'}
            onClick={onClose}
            isCollapsed={isActuallyCollapsed}
            mounted={mounted}
          />
        </div>
      </aside>
    </>
  );
};


export default SidebarGuide;
