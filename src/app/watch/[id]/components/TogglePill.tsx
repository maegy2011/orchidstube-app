"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export const TogglePill = React.memo(function TogglePill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 shrink-0 border whitespace-nowrap",
        active
          ? "bg-primary/10 text-primary border-primary/25"
          : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
});
