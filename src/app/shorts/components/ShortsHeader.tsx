"use client";

import React from 'react';

interface ShortsHeaderProps {
  currentIndex: number;
  totalVideos: number;
  progress: number;
}

export default function ShortsHeader({
  currentIndex,
  totalVideos,
  progress,
}: ShortsHeaderProps) {
  return (
    <>
      {/* Scroll progress bar */}
      <div className="absolute top-2 right-3 z-30 w-1 h-12 rounded-full bg-white/10 overflow-hidden">
        <div className="w-full bg-primary rounded-full transition-all duration-300" style={{ height: `${progress}%` }} />
      </div>

      {/* Video index indicator */}
      <div className="absolute top-3 left-3 z-30">
        <span className="text-[10px] font-bold text-white/50 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
          {currentIndex + 1} / {totalVideos}
        </span>
      </div>
    </>
  );
}
