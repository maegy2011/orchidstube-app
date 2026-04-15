"use client";

import React from 'react';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesFilterProps {
  uniqueHashtags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  t: (key: string) => string;
}

export default function NotesFilter({
  uniqueHashtags,
  selectedTag,
  setSelectedTag,
  t,
}: NotesFilterProps) {
  if (uniqueHashtags.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 px-1">
        <Tag size={14} className="text-[#606060]" />
        <span className="text-xs font-bold text-[#606060] uppercase tracking-wider">{t("filterByTag")}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
            !selectedTag 
              ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10" 
              : "bg-white text-[#606060] border-[#e5e5e5] hover:border-red-200 hover:text-red-600"
          )}
        >
          {t("all")}
        </button>
        {uniqueHashtags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
              selectedTag === tag
                ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10"
                : "bg-white text-[#606060] border-[#e5e5e5] hover:border-red-200 hover:text-red-600"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
