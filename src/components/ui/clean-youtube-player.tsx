"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MediaPlayer, MediaProvider, MediaPlayerInstance } from '@vidstack/react';
import { PlyrLayout, plyrLayoutIcons, type PlyrLayoutTranslations, type PlyrControl } from '@vidstack/react/player/layouts/plyr';
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/plyr/theme.css';
import { 
  Lock, 
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface CleanYouTubePlayerProps {
  videoId: string;
  startTime?: number;
  onReady?: (event: any) => void;
  onStateChange?: (event: any) => void;
  isLocked?: boolean;
  onLockToggle?: (locked: boolean) => void;
}

const PLYR_CONTROLS: PlyrControl[] = [
  'restart',           // Restart from beginning
  'rewind',            // Rewind 10s
  'play',              // Play/Pause
  'fast-forward',      // Forward 10s
  'progress',          // Seek bar
  'current-time',      // Current time
  'duration',          // Total duration
  'mute+volume',       // Mute toggle + volume slider
  'captions',          // Subtitles toggle
  'settings',          // Settings menu (speed, quality, captions)
  'pip',               // Picture-in-Picture
  'airplay',           // AirPlay
  'fullscreen',        // Fullscreen
];

export function CleanYouTubePlayer({ 
  videoId, 
  startTime = 0,
  onReady,
  onStateChange,
  isLocked = false,
  onLockToggle
}: CleanYouTubePlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { language } = useI18n();

  // ─── Plyr Arabic Translations ───
  const plyrTranslations = useMemo<PlyrLayoutTranslations>(() => {
    if (language === 'ar') {
      return {
        'Ad': 'إعلان',
        'All': 'الكل',
        'AirPlay': 'AirPlay',
        'Audio': 'الصوت',
        'Auto': 'تلقائي',
        'Buffered': 'مخزن مؤقتاً',
        'Captions': 'الترجمة',
        'Current time': 'الوقت الحالي',
        'Default': 'الافتراضي',
        'Disable captions': 'إيقاف الترجمة',
        'Disabled': 'معطل',
        'Download': 'تنزيل',
        'Duration': 'المدة',
        'Enable captions': 'تشغيل الترجمة',
        'Enabled': 'مفعّل',
        'End': 'النهاية',
        'Enter Fullscreen': 'دخول ملء الشاشة',
        'Exit Fullscreen': 'خروج من ملء الشاشة',
        'Forward': 'تقديم',
        'Go back to previous menu': 'العودة للقائمة السابقة',
        'LIVE': 'مباشر',
        'Loop': 'تكرار',
        'Mute': 'كتم',
        'Normal': 'عادي',
        'Pause': 'إيقاف مؤقت',
        'Enter PiP': 'صورة في صورة',
        'Exit PiP': 'خروج من صورة في صورة',
        'Play': 'تشغيل',
        'Played': 'تم تشغيله',
        'Quality': 'الجودة',
        'Reset': 'إعادة تعيين',
        'Restart': 'إعادة التشغيل',
        'Rewind': 'إرجاع',
        'Seek': 'تنقل',
        'Settings': 'الإعدادات',
        'Speed': 'السرعة',
        'Start': 'البداية',
        'Unmute': 'إلغاء الكتم',
        'Volume': 'مستوى الصوت',
      };
    }
    // Default English — Plyr uses these already, but explicit for clarity
    return {
      'Quality': 'Quality',
      'Speed': 'Speed',
      'Settings': 'Settings',
      'Restart': 'Restart',
      'Rewind': 'Rewind',
      'Forward': 'Forward',
      'LIVE': 'LIVE',
    } as PlyrLayoutTranslations;
  }, [language]);

  // ─── Player ready callback shim ───
  const onVidstackReady = useCallback(() => {
    if (onReady && playerRef.current) {
      const shim = {
        target: {
          getCurrentTime: () => playerRef.current?.currentTime || 0,
          getDuration: () => playerRef.current?.duration || 0,
          seekTo: (seconds: number, _allowSeekAhead?: boolean) => { 
            if (playerRef.current) playerRef.current.currentTime = seconds; 
          },
          playVideo: () => {
            if (playerRef.current) playerRef.current.play().catch(() => {});
          },
          pauseVideo: () => {
            if (playerRef.current) playerRef.current.pause().catch(() => {});
          },
          getPlayerState: () => playerRef.current?.paused ? 2 : 1,
          unMute: () => { if (playerRef.current) playerRef.current.muted = false; },
          mute: () => { if (playerRef.current) playerRef.current.muted = true; },
          setPlaybackRate: (rate: number) => { if (playerRef.current) playerRef.current.playbackRate = rate; },
          getIframe: () => ({}),
          loadVideoById: () => {},
          getPlaybackRate: () => playerRef.current?.playbackRate || 1,
        }
      };
      onReady(shim);
    }
  }, [onReady]);

  // ─── Play/pause state bridge ───
  const handlePlayChange = useCallback((playing: boolean) => {
    if (onStateChange) {
      onStateChange({ data: playing ? 1 : 2 });
    }
  }, [onStateChange]);

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden select-none">
      <MediaPlayer
        ref={playerRef}
        title="Video Player"
        src={`https://www.youtube.com/watch?v=${videoId}`}
        playsInline
        onCanPlay={onVidstackReady}
        onPlay={() => handlePlayChange(true)}
        onPause={() => handlePlayChange(false)}
        currentTime={startTime}
        className="w-full h-full"
        viewType="video"
        load="eager"
        crossOrigin
        key={videoId}
        {...{ fullscreen: "provider" }}
      >
        <MediaProvider className="w-full h-full">
          <div className="absolute inset-0 pointer-events-none z-10" />
        </MediaProvider>

        {/* ─── Plyr Layout with full built-in controls ─── */}
        <PlyrLayout 
          icons={plyrLayoutIcons} 
          controls={PLYR_CONTROLS}
          clickToPlay={true}
          clickToFullscreen={true}
          toggleTime={true}
          seekTime={10}
          invertTime={false}
          translations={plyrTranslations}
        />

        {/* ─── Lock Button ─── */}
        <div className="absolute top-3 left-3 z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle?.(!isLocked);
            }}
            className={cn(
              "p-2 rounded-xl backdrop-blur-md transition-all duration-300 border border-white/20",
              isLocked 
                ? "bg-red-600/80 text-white opacity-100 scale-110 shadow-lg shadow-red-600/40" 
                : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
        </div>

        {/* ─── Lock Overlay ─── */}
        {isLocked && (
          <div 
            className="absolute inset-0 z-[25] cursor-default bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        )}
      </MediaPlayer>
    </div>
  );
}
