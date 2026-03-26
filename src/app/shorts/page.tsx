"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Play, Pause, Volume2, VolumeX, MessageCircle, Share2, Music2, Timer } from 'lucide-react';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import '@vidstack/react/player/styles/base.css';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { toast } from 'sonner';
import { usePrayer } from '@/lib/prayer-times-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';
import { Loader2 } from 'lucide-react';
import { useHeaderTop } from '@/hooks/use-header-top';

interface ShortVideo {
  id: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  likes: string;
  comments: string;
}

function SafeShortsPlayer({ video, isMuted, onEnded, handleNext }: { 
  video: ShortVideo, 
  isMuted: boolean, 
  onEnded: () => void,
  handleNext: () => void 
}) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => {
      setIsMounted(false);
      clearTimeout(timer);
    };
  }, [video.id]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <MediaPlayer 
      key={video.id}
      title={video.title}
      src={`youtube/${video.id}`}
      autoplay
      playsInline
      muted={isMuted}
      onEnded={onEnded}
      className="w-full h-full"
      onError={(e) => {
        if (e?.detail?.message?.includes('destroyed') || e?.detail?.message?.includes('aborted')) {
          return;
        }
        console.error('MediaPlayer error:', e);
      }}
    >
      <MediaProvider className="w-full h-full" />
    </MediaPlayer>
  );
}

export default function ShortsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { direction, t, showRamadanCountdown, language } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);
  const [isSm, setIsSm] = useState(false);
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
    const checkSm = () => setIsSm(window.innerWidth >= 640);
    checkSm();
    window.addEventListener('resize', checkSm);
    return () => window.removeEventListener('resize', checkSm);
  }, []);

  const [error, setError] = useState<string | null>(null);

  const fetchShorts = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = language === 'ar' ? 'مقاطع قصيرة إسلامية' : 'educational shorts islamic';
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        if (videoList.length === 0) {
          setError(t('no_shorts_found'));
        } else {
          const mappedVideos = videoList.map((v: any) => ({
            id: v.id,
            title: v.title,
            channelName: v.channelName,
            channelAvatar: v.channelAvatar,
            likes: v.views, 
            comments: '...',
          }));
          setVideos(mappedVideos);
          setCurrentIndex(0);
        }
      } else {
        throw new Error(t('failed_load_shorts'));
      }
    } catch (error) {
      console.error('Failed to fetch shorts:', error);
      setError(`${t('failed_load_shorts')}. ${t('retry')}`);
      toast.error(t('failed_load_shorts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, [language]);

  const isRamadanCountdownVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const isPrayerBarVisible = prayerEnabled && nextPrayer !== null;

  const ptClass = (isRamadanCountdownVisible && isPrayerBarVisible)
    ? "pt-[144px] sm:pt-[136px]"
    : (isRamadanCountdownVisible || isPrayerBarVisible)
    ? "pt-[104px] sm:pt-[100px]"
    : "pt-16";

  const { 
    incrementShortsCount, 
    isShortsLimitReached,
    resetContinuousTime,
    dailyShortsCount,
    limits
  } = useWellBeing();

  const [isMuted, setIsMuted] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const currentShort = videos[currentIndex];

  useEffect(() => {
    resetContinuousTime();
  }, [resetContinuousTime]);

  useEffect(() => {
    if (isShortsLimitReached) {
      setShowLimitModal(true);
    }
  }, [isShortsLimitReached]);

  const handleNext = useCallback(() => {
    if (isShortsLimitReached) {
      setShowLimitModal(true);
      return;
    }
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
        incrementShortsCount();
      } else {
        toast.info(t('end_of_feed'));
      }

  }, [currentIndex, isShortsLimitReached, incrementShortsCount, videos.length, t]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleNext, handlePrev]);

  const headerTop = useHeaderTop();
  const offset = headerTop === 'top-0' ? '0px' : headerTop.replace('top-[', '').replace('px]', 'px');

  if (loading) {
    return (
      <div 
        className="bg-black flex flex-col items-center justify-center gap-4"
        style={{ 
          height: `calc(100vh - ${offset})`,
          marginTop: offset
        }}
      >
        <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="text-white/60 animate-pulse text-sm font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="max-w-xs space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Play className="w-8 h-8 text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">{error || "No shorts available"}</h3>
            <p className="text-white/60 text-sm">
              {error ? "We encountered an error while loading the feed." : "There are no shorts matching your preferences at the moment."}
            </p>
          </div>
          <button 
            onClick={() => fetchShorts()}
            className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors"
          >
            {t('retry') || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentShort) return null;

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col" dir={direction}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} forceOverlay={true} />
      
      <div className={`flex-1 relative flex items-center justify-center ${ptClass}`}>
        <div className="relative w-full max-w-[450px] aspect-[9/16] bg-[#1a1a1a] sm:rounded-2xl overflow-hidden shadow-2xl">
          <SafeShortsPlayer 
            video={currentShort}
            isMuted={isMuted}
            onEnded={() => {
              try {
                handleNext();
              } catch (e) {
                // Silent
              }
            }}
            handleNext={handleNext}
          />

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentShort.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 flex flex-col justify-between p-6">
                <div className="flex justify-between items-start pointer-events-auto">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
                  >
                    <Timer className="w-4 h-4 text-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">{dailyShortsCount} / {limits.shortsDailyLimit || '∞'}</span>
                  </motion.div>
                  <motion.button 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </motion.button>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4 pointer-events-auto"
                >
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 rounded-full bg-primary/20 border border-white/20 overflow-hidden"
                        >
                          {currentShort.channelAvatar ? (
                            <img src={currentShort.channelAvatar} alt={currentShort.channelName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-500 to-purple-600" />
                          )}
                        </motion.div>
                        <span className="font-bold text-white text-sm">@{currentShort.channelName}</span>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-black text-xs font-black px-4 py-1.5 rounded-full"
                      >
                        {t('subscriptions')}
                      </motion.button>
                    </div>
                    <p className="text-white text-sm line-clamp-2">{currentShort.title}</p>
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Music2 className="w-3 h-3 animate-[spin_3s_linear_infinite]" />
                      <span className="truncate">Original Sound - {currentShort.channelName}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20 pointer-events-auto">
                {[
                  { icon: <Play className="w-6 h-6 fill-current" />, label: currentShort.likes, delay: 0.5, highlight: 'group-hover:bg-red-500/20 group-hover:border-red-500/40' },
                  { icon: <MessageCircle className="w-6 h-6" />, label: currentShort.comments, delay: 0.6 },
                  { icon: <Share2 className="w-6 h-6" />, label: '', delay: 0.7 },
                ].map((action, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: action.delay }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 cursor-pointer transition-all ${action.highlight || 'hover:bg-white/20'}`}
                    >
                      {action.icon}
                    </motion.div>
                    {action.label && <span className="text-[10px] font-bold text-white">{action.label}</span>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6"
            >
              <div className="justify-center flex">
                <div className="p-4 bg-red-500/20 rounded-full">
                  <Timer className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">{t('dailyLimitReached')}</h2>
                <p className="text-gray-400">
                  {t('shortsLimitReachedDesc') || "You've watched enough Shorts for today! Time to explore some long-form educational content or take a break."}
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-black rounded-2xl font-black transition-all hover:bg-gray-100"
              >
                {t('back')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
