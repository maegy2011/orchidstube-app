"use client";
import { cn } from "@/lib/utils";

interface SettingsToggleProps {
  enabled: boolean;
  onToggle: () => void;
  isRTL?: boolean;
  activeColor?: string;
  ringColor?: string;
}

export default function SettingsToggle({ enabled, onToggle, isRTL = false, activeColor = 'bg-red-600', ringColor = 'focus:ring-red-500' }: SettingsToggleProps) {
  return (
    <button 
      onClick={onToggle}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${ringColor} focus-visible:ring-offset-2
        ${enabled ? activeColor : 'bg-muted'}
      `}
    >
      <span className={`
        ${enabled ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}
        inline-block h-4 w-4 transform rounded-full bg-background transition-transform shadow-sm border border-border
      `} />
    </button>
  );
}
