"use client";

import React from 'react';
import { useVideoQualityOptions, useMediaPlayer } from '@vidstack/react';
import { Settings2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useI18n } from '@/lib/i18n-context';

export function QualitySelector() {
  const options = useVideoQualityOptions();
  const player = useMediaPlayer();
  const { t } = useI18n();

  if (options.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 px-3">
          <Settings2 size={18} />
          <span className="text-xs font-bold uppercase">
            {options.selected?.label || t('select_quality')}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-xl border-white/10 text-white">
        <DropdownMenuLabel className="text-xs font-black uppercase text-gray-400">
          {t('select_quality')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              try {
                const result = option.select();
                if (result instanceof Promise) {
                  result.catch((err) => {
                    if (err?.message !== 'provider destroyed') {
                      console.error('Quality selection error:', err);
                    }
                  });
                }
              } catch (e: any) {
                if (e?.message !== 'provider destroyed') {
                  console.error('Quality selection sync error:', e);
                }
              }
            }}
            className="flex items-center justify-between focus:bg-white/10 focus:text-white cursor-pointer"
          >
            <span className="text-sm font-medium">{option.label}</span>
            {option.selected && <Check size={16} className="text-red-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
