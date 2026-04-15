"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Flag } from 'lucide-react';
import { VideoDetails } from '@/lib/types';

interface WatchErrorStatesProps {
  direction: string;
  t: (key: any) => string;
  error: string | null;
  blocked: boolean;
  blockReason: string | null;
  video: VideoDetails | null;
}

export default function WatchErrorStates({
  direction,
  t,
  error,
  blocked,
  blockReason,
  video,
}: WatchErrorStatesProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4" dir={direction}>
        <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <AlertCircle size={36} className="text-destructive" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('retry')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors font-semibold text-sm active:scale-95">
            {t('retry')}
          </button>
          <Link href="/" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-semibold text-sm active:scale-95">
            <ArrowRight size={18} /> {t('back_to_home')}
          </Link>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4" dir={direction}>
        <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center">
          <Flag size={36} className="text-destructive" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('content_blocked')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{blockReason}</p>
        </div>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-semibold active:scale-95">
          <ArrowRight size={18} /> {t('back_to_home')}
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4" dir={direction}>
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
          <AlertCircle size={36} className="text-muted-foreground" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('video_not_found')}</h1>
          <p className="text-muted-foreground text-sm">{t('video_not_found_desc')}</p>
        </div>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-semibold active:scale-95">
          <ArrowRight size={18} /> {t('back_to_home')}
        </Link>
      </div>
    );
  }

  return null;
}
