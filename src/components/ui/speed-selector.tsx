"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useMediaPlayer } from '@vidstack/react';
import { Gauge, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useI18n } from '@/lib/i18n-context';

const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x (Normal)' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2x' },
];

export function SpeedSelector() {
  const player = useMediaPlayer();
  const { language } = useI18n();
  const [currentSpeed, setCurrentSpeed] = useState(1);

  useEffect(() => {
    if (player) {
      setCurrentSpeed(player.playbackRate || 1);
      
      const unsubscribe = player.subscribe('playback-rate', () => {
        setCurrentSpeed(player.playbackRate || 1);
      });
      
      return () => unsubscribe();
    }
  }, [player]);

  const setSpeed = useCallback((speed: number) => {
    if (player) {
      player.playbackRate = speed;
      setCurrentSpeed(speed);
    }
  }, [player]);

  const formatSpeed = (speed: number) => {
    if (speed === 1) return '1x';
    return `${speed}x`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md border border-white/15 transition-all text-xs font-bold"
          title={language === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}
        >
          <Gauge size={14} />
          <span>{formatSpeed(currentSpeed)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-44 bg-black/95 backdrop-blur-xl border-white/15 text-white rounded-xl overflow-hidden"
      >
        <DropdownMenuLabel className="text-[10px] font-black uppercase text-white/50 tracking-wider px-3 py-2">
          {language === 'ar' ? 'سرعة التشغيل' : 'Playback Speed'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="max-h-[280px] overflow-y-auto no-scrollbar py-1">
          {SPEED_OPTIONS.map((opt) => {
            const isActive = Math.abs(currentSpeed - opt.value) < 0.01;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={cn(
                  "flex items-center justify-between cursor-pointer px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="font-medium">{opt.label}</span>
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
