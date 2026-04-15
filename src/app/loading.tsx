"use client";

import React from 'react';
import { useI18n } from "@/lib/i18n-context";
import { useHeaderTop } from "@/hooks/use-header-top";

export default function Loading() {
  const { t, direction } = useI18n();
  const headerTop = useHeaderTop();

  return (
    <div 
      className="flex flex-col items-center justify-center gap-6 bg-background" 
      style={{ 
        minHeight: `calc(100vh - ${headerTop === 'top-0' ? '0px' : headerTop.replace('top-[', '').replace('px]', 'px')})`,
        marginTop: headerTop === 'top-0' ? '0px' : headerTop.replace('top-[', '').replace('px]', 'px')
      }}
      dir={direction}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulse */}
        <div 
          className="absolute w-24 h-24 rounded-full border-2 border-red-500/20 animate-ping"
          style={{ animationDuration: '2s' }}
        />
        
        {/* Main Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin" 
          style={{ animationDuration: '0.8s' }}
        />
        
        {/* Inner dot */}
        <div 
          className="absolute w-2 h-2 bg-red-600 rounded-full animate-pulse"
          style={{ animationDuration: '1s' }}
        />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
        <p className="text-[#606060] font-medium text-sm">{t('loading')}</p>
      </div>
    </div>
  );
}
