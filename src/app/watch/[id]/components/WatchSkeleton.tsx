"use client";

import React from 'react';
import Masthead from '@/components/sections/masthead';
import { Skeleton } from '@/components/ui/skeleton';

interface WatchSkeletonProps {
  direction: string;
  mainPaddingTop: string;
  onSearch: (query: string) => void;
}

export default function WatchSkeleton({ direction, mainPaddingTop, onSearch }: WatchSkeletonProps) {
  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Masthead onMenuClick={() => {}} onSearch={onSearch} />
      <main className={`${mainPaddingTop} px-4 lg:px-6 xl:px-24 pb-16`}>
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6">
          {/* Skeleton: Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Player skeleton */}
            <Skeleton className="w-full aspect-video rounded-none lg:rounded-2xl" />
            {/* Channel card skeleton */}
            <div className="flex items-center gap-3 p-4 bg-card/60 border border-border/50 rounded-2xl">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />
            {/* Metadata chips */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            {/* Description skeleton */}
            <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
          {/* Skeleton: Right sidebar */}
          <div className="w-full lg:w-[380px] shrink-0 hidden lg:block space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-32 aspect-video rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-0.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
