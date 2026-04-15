"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SafeAvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

/** Avatar image with automatic fallback to initial letter gradient on load error */
export default function SafeAvatar({ src, name, size = 36, className }: SafeAvatarProps) {
  const [failed, setFailed] = useState(false);

  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (!src || failed) {
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span
          className="text-primary-foreground font-black leading-none"
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {initial}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full overflow-hidden bg-muted shrink-0 ring-1 ring-border/50", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
