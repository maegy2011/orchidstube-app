"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWellBeing } from '@/lib/well-being-context';
import { useI18n } from '@/lib/i18n-context';
import { Loader2 } from 'lucide-react';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import { toast } from 'sonner';
import { usePrayer } from '@/lib/prayer-times-context';
import { getDaysUntilRamadan } from '@/lib/date-utils';
import { useHeaderTop } from '@/hooks/use-header-top';
import ShortsEmpty from './components/ShortsEmpty';
import ShortsVideo, { type ShortVideo, type ShortsPlayerHandle } from './components/ShortsVideo';
import ShortsFeed from './components/ShortsFeed';

export default function ShortsPage() {
  const { direction, t, showRamadanCountdown, language } = useI18n();
  const { prayerEnabled, nextPrayer } = usePrayer();
  const [daysUntilRamadan, setDaysUntilRamadan] = useState<number | null>(null);
  const [isSm, setIsSm] = useState(false);
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const playerHandleRef = useRef<ShortsPlayerHandle>(null);

  // ─── Well-being (MUST be before any function that uses its values) ───
  const { incrementShortsCount, isShortsLimitReached, resetContinuousTime, dailyShortsCount, limits, isReady } = useWellBeing();

  // ─── Responsive check ───
  useEffect(() => {
    setDaysUntilRamadan(getDaysUntilRamadan());
    const checkSm = () => setIsSm(window.innerWidth >= 640);
    checkSm();
    window.addEventListener('resize', checkSm);
    return () => window.removeEventListener('resize', checkSm);
  }, []);

  // ─── Fetch shorts ───
  const fetchShorts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = t('shortsQuery');
      const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const videoList = Array.isArray(data) ? data : (data.videos || []);
        if (videoList.length === 0) {
          setError(t('no_shorts_found'));
        } else {
          setVideos(videoList.map((v: any) => ({
            id: v.id,
            title: v.title,
            channelName: v.channelName,
            channelAvatar: v.channelAvatar,
            views: v.views || '0',
          })));
          setCurrentIndex(0);
          setIsPaused(false);
          incrementShortsCount();
        }
      } else {
        throw new Error(t('failed_load_shorts'));
      }
    } catch (err) {
      setError(`${t('failed_load_shorts')}. ${t('retry')}`);
      toast.error(t('failed_load_shorts'));
    } finally {
      setLoading(false);
    }
  }, [language, t, incrementShortsCount]);

  // ─── Fetch shorts only when well-being is ready and limit not reached ───
  const fetchShortsIfAllowed = useCallback(() => {
    if (isShortsLimitReached) {
      setLimitEnforced(true);
      setShowLimitModal(true);
      setLoading(false);
      return;
    }
    fetchShorts();
  }, [isShortsLimitReached, fetchShorts]);

  useEffect(() => { if (isReady) fetchShortsIfAllowed(); }, [language, isReady, fetchShortsIfAllowed]);

  // ─── Prayer / Ramadan top padding ───
  const isRamadanVisible = showRamadanCountdown && daysUntilRamadan !== null && daysUntilRamadan > 0;
  const isPrayerVisible = prayerEnabled && nextPrayer !== null;
  const ptClass = (isRamadanVisible && isPrayerVisible)
    ? "pt-[144px] sm:pt-[136px]"
    : (isRamadanVisible || isPrayerVisible)
    ? "pt-[104px] sm:pt-[100px]"
    : "pt-16";

  const [isMuted, setIsMuted] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitEnforced, setLimitEnforced] = useState(false);

  // ─── Pause state ───
  const [isPaused, setIsPaused] = useState(false);

  const currentShort = videos[currentIndex];

  // ─── Navigation ───
  const handleNext = useCallback(() => {
    if (isShortsLimitReached) {
      playerHandleRef.current?.pause();
      setIsPaused(true);
      setShowLimitModal(true);
      return;
    }
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      incrementShortsCount();
      setIsPaused(false);
    } else {
      toast.info(t('end_of_feed'));
    }
  }, [currentIndex, isShortsLimitReached, incrementShortsCount, videos.length, t]);

  const handlePrev = useCallback(() => {
    if (isShortsLimitReached) {
      playerHandleRef.current?.pause();
      setIsPaused(true);
      setShowLimitModal(true);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPaused(false);
    }
  }, [currentIndex, isShortsLimitReached]);

  // ─── Toggle pause (single entry point) ───
  const togglePause = useCallback(() => {
    if (isShortsLimitReached) {
      playerHandleRef.current?.pause();
      setIsPaused(true);
      setShowLimitModal(true);
      return;
    }
    setIsPaused(prev => {
      const next = !prev;
      if (next) playerHandleRef.current?.pause();
      else playerHandleRef.current?.play();
      return next;
    });
  }, [isShortsLimitReached]);

  // ─── Sync onPlayStateChange from player (handles autoplay, video end, etc.) ───
  const handlePlayStateChange = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  // ─── Stable onEnded callback ───
  const handleVideoEnd = useCallback(() => {
    try { handleNext(); } catch (e) { console.error('Short playback error:', e); }
  }, [handleNext]);

  /* ═══════════════════════════════════════════════════════════════
     INTERACTION SHIELD
     ═══════════════════════════════════════════════════════════════ */

  const touchStartRef = useRef<{ y: number; time: number; x: number } | null>(null);
  const isSwipingRef = useRef(false);

  const onShieldTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { y: touch.clientY, time: Date.now(), x: touch.clientX };
    isSwipingRef.current = false;
    e.stopPropagation();
  }, []);

  const onShieldTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    if (deltaY > 10) isSwipingRef.current = true;
    e.stopPropagation();
  }, []);

  const onShieldTouchEnd = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) { e.stopPropagation(); return; }

    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = endY - start.y;
    const deltaX = Math.abs(endX - start.x);
    const deltaTime = Date.now() - start.time;
    touchStartRef.current = null;
    e.stopPropagation();

    if (deltaX > Math.abs(deltaY)) return;

    if (isSwipingRef.current && deltaTime < 500 && Math.abs(deltaY) > 50) {
      if (deltaY > 0) handlePrev();
      else handleNext();
    } else if (!isSwipingRef.current && deltaTime < 300 && Math.abs(deltaY) < 30) {
      togglePause();
    }
  }, [handleNext, handlePrev, togglePause]);

  const onShieldClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 0) return;
    togglePause();
  }, [togglePause]);

  // ─── Keyboard ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); handleNext(); }
      else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); handlePrev(); }
      else if (e.key === ' ') { e.preventDefault(); togglePause(); }
      else if (e.key === 'm') { setIsMuted(m => !m); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleNext, handlePrev, togglePause]);

  // ─── Mouse wheel (desktop navigation) ───
  const lastWheelTimeRef = useRef(0);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 600) return;
      if (Math.abs(e.deltaY) > 40) {
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0) handleNext();
        else handlePrev();
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleNext, handlePrev]);

  // ─── Well-being effects ───
  useEffect(() => { resetContinuousTime(); }, [resetContinuousTime]);

  const headerTop = useHeaderTop();
  const offset = headerTop === 'top-0' ? '0px' : headerTop.replace('top-[', '').replace('px]', 'px');
  const progress = videos.length > 1 ? ((currentIndex + 1) / videos.length) * 100 : 0;

  // ─── Limit enforced before anything loads ───
  if (limitEnforced && !loading) {
    return (
      <ShortsEmpty
        loading={false}
        error={null}
        limitEnforced={true}
        offset={offset}
        direction={direction}
        onRetry={fetchShorts}
        Masthead={Masthead}
        t={t}
      />
    );
  }

  // ─── Loading state ───
  if (loading) {
    return (
      <ShortsEmpty
        loading={true}
        error={null}
        limitEnforced={false}
        offset={offset}
        direction={direction}
        onRetry={fetchShorts}
        Masthead={Masthead}
        t={t}
      />
    );
  }

  // ─── Error / empty state ───
  if (error || videos.length === 0) {
    return (
      <ShortsEmpty
        loading={false}
        error={error}
        limitEnforced={false}
        offset={offset}
        direction={direction}
        onRetry={fetchShorts}
        Masthead={Masthead}
        t={t}
      />
    );
  }

  if (!currentShort) return null;

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col" dir={direction}>
      <Masthead />
      <SidebarGuide forceOverlay={true} />

      <ShortsFeed
        ptClass={ptClass}
        direction={direction}
        currentIndex={currentIndex}
        totalVideos={videos.length}
        isPaused={isPaused}
        isMuted={isMuted}
        showLimitModal={showLimitModal}
        progress={progress}
        currentShort={currentShort}
        playerRef={playerHandleRef}
        dailyShortsCount={dailyShortsCount}
        shortsDailyLimit={limits.shortsDailyLimit}
        onPrev={handlePrev}
        onNext={handleNext}
        onPlayStateChange={handlePlayStateChange}
        onVideoEnd={handleVideoEnd}
        onToggleMute={() => setIsMuted(m => !m)}
        onShieldTouchStart={onShieldTouchStart}
        onShieldTouchMove={onShieldTouchMove}
        onShieldTouchEnd={onShieldTouchEnd}
        onShieldClick={onShieldClick}
        t={t}
        renderVideo={() => (
          <ShortsVideo
            video={currentShort}
            isPaused={isPaused}
            isMuted={isMuted || limitEnforced}
            playerRef={playerHandleRef}
            direction={direction}
            dailyShortsCount={dailyShortsCount}
            shortsDailyLimit={limits.shortsDailyLimit}
            onPlayStateChange={handlePlayStateChange}
            onVideoEnd={handleVideoEnd}
            onToggleMute={() => setIsMuted(m => !m)}
            onShieldTouchStart={onShieldTouchStart}
            onShieldTouchMove={onShieldTouchMove}
            onShieldTouchEnd={onShieldTouchEnd}
            onShieldClick={onShieldClick}
            t={t}
          />
        )}
      />
    </div>
  );
}
