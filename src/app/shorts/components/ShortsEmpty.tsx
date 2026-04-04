"use client";

import React from 'react';
import { Play, Timer } from 'lucide-react';

interface ShortsEmptyProps {
  loading: boolean;
  error: string | null;
  limitEnforced: boolean;
  offset: string;
  direction: string;
  onRetry: () => void;
  Masthead: React.ComponentType<Record<string, unknown>>;
  t: (key: string) => string;
}

export default function ShortsEmpty({
  loading,
  error,
  limitEnforced,
  offset,
  direction,
  onRetry,
  Masthead,
  t,
}: ShortsEmptyProps) {
  if (loading) {
    return (
      <div className="bg-black flex flex-col items-center justify-center gap-4" style={{ height: `calc(100vh - ${offset})`, marginTop: offset }} dir={direction}>
        <Masthead />
        <React.Suspense fallback={null}>
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </React.Suspense>
        <p className="text-white/50 animate-pulse text-sm font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (limitEnforced) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center" dir={direction}>
        <Masthead />
        <div className="max-w-sm space-y-5">
          <div className="flex justify-center">
            <div className="p-3.5 bg-primary/15 rounded-full">
              <Timer className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">{t('dailyLimitReached')}</h2>
            <p className="text-white/50 text-sm">{t('shortsLimitReachedDesc')}</p>
          </div>
          <button onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all hover:bg-primary/90">
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center" dir={direction}>
        <Masthead />
        <div className="max-w-xs space-y-5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <Play className="w-7 h-7 text-white/20" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">{error}</h3>
            <p className="text-white/50 text-sm">{t('try_again')}</p>
          </div>
          <button onClick={onRetry} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
