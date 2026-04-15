"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaPlayer } from '@vidstack/react';
import { MonitorPlay, Check, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useI18n } from '@/lib/i18n-context';

// YouTube quality levels: value maps to YouTube IFrame API quality constants
const YT_QUALITIES = [
  { value: 'auto', label: 'Auto', height: 0 },
  { value: 'highres', label: '2160p (4K)', height: 2160 },
  { value: 'hd2160', label: '1440p', height: 1440 },
  { value: 'hd1080', label: '1080p (HD)', height: 1080 },
  { value: 'hd720', label: '720p (HD)', height: 720 },
  { value: 'large', label: '480p', height: 480 },
  { value: 'medium', label: '360p', height: 360 },
  { value: 'small', label: '240p', height: 240 },
  { value: 'tiny', label: '144p', height: 144 },
];

const QUALITY_DISPLAY_MAP: Record<string, string> = {
  'auto': 'Auto',
  'highres': '4K',
  'hd2160': '1440p',
  'hd1080': '1080p',
  'hd720': '720p',
  'large': '480p',
  'medium': '360p',
  'small': '240p',
  'tiny': '144p',
  'default': 'Auto',
};

export function QualitySelector() {
  const player = useMediaPlayer();
  const { language } = useI18n();
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [isReady, setIsReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const getYtPlayer = useCallback(() => {
    if (!player) return null;
    try {
      const provider = (player as any)?.provider;
      if (!provider) return null;

      const paths = [
        () => provider._player,
        () => provider.player,
        () => provider.ytPlayer,
        () => provider.api,
        () => provider.$$player,
        () => provider._videoPlayer,
      ];

      for (const path of paths) {
        try {
          const ytPlayer = path();
          if (ytPlayer && typeof ytPlayer.getAvailableQualityLevels === 'function') {
            return ytPlayer;
          }
        } catch (_e) {
          // Continue to next path
        }
      }
    } catch (_e) {
      // Silently fail
    }
    return null;
  }, [player]);

  useEffect(() => {
    if (!player) return;

    const poll = () => {
      const ytPlayer = getYtPlayer();
      if (ytPlayer) {
        ytPlayerRef.current = ytPlayer;
        try {
          const levels = ytPlayer.getAvailableQualityLevels();
          if (levels && levels.length > 0) {
            setAvailableQualities(levels);
            const current = ytPlayer.getPlaybackQuality();
            setCurrentQuality(current || 'auto');
            setIsReady(true);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        } catch (_e) {
          // Player might not be fully initialized
        }
      }
    };

    poll();
    pollRef.current = setInterval(poll, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [player, getYtPlayer]);

  const setQuality = useCallback((quality: string) => {
    const ytPlayer = ytPlayerRef.current || getYtPlayer();
    if (!ytPlayer) return;

    try {
      if (quality === 'auto') {
        ytPlayer.setPlaybackQuality('default');
      } else {
        ytPlayer.setPlaybackQuality(quality);
      }
      setCurrentQuality(quality);
    } catch (_e) {
      // Silently fail
    }
  }, [getYtPlayer]);

  const getCurrentLabel = () => {
    const display = QUALITY_DISPLAY_MAP[currentQuality];
    return display || currentQuality || 'Auto';
  };

  const displayQualities = isReady && availableQualities.length > 0
    ? availableQualities
    : ['auto', 'hd1080', 'hd720', 'medium', 'small'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md border border-white/15 transition-all text-xs font-bold"
          title={language === 'ar' ? 'جودة الفيديو' : 'Video Quality'}
        >
          <MonitorPlay size={14} />
          <span>{getCurrentLabel()}</span>
          <ChevronUp size={10} className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-48 bg-black/95 backdrop-blur-xl border-white/15 text-white rounded-xl overflow-hidden"
      >
        <DropdownMenuLabel className="text-[10px] font-black uppercase text-white/50 tracking-wider px-3 py-2">
          {language === 'ar' ? 'جودة الفيديو' : 'Video Quality'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="max-h-[280px] overflow-y-auto no-scrollbar py-1">
          {displayQualities.map((q) => {
            const info = YT_QUALITIES.find(qi => qi.value === q);
            const label = QUALITY_DISPLAY_MAP[q] || info?.label || q;
            const isActive = currentQuality === q || (q === 'default' && (currentQuality === 'auto' || currentQuality === 'default'));

            return (
              <DropdownMenuItem
                key={q}
                onClick={() => setQuality(q === 'default' ? 'auto' : q)}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="font-medium">{label}</span>
                {isActive && (
                  <Check size={15} className="text-red-500 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
