"use client";

import React from 'react';
import { StickyNote, Settings2, Search, CheckSquare, Square, DownloadCloud, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NotesHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isManageMode: boolean;
  setIsManageMode: (v: boolean) => void;
  selectedNotes: Set<string>;
  selectAll: () => void;
  filteredNotesCount: number;
  exportNotes: () => void;
  bulkDelete: () => void;
  t: (key: string) => string;
}

export default function NotesHeader({
  searchQuery,
  setSearchQuery,
  isManageMode,
  setIsManageMode,
  selectedNotes,
  selectAll,
  filteredNotesCount,
  exportNotes,
  bulkDelete,
  t,
}: NotesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
          <StickyNote className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("myNotes")}</h1>
          <p className="text-[#606060] text-sm mt-1">{t("myNotesDesc")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setIsManageMode(!isManageMode);
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all border shadow-sm",
            isManageMode 
              ? "bg-red-600 text-white border-red-600" 
              : "bg-white text-[#0f0f0f] border-[#e5e5e5] hover:border-red-200"
          )}
        >
          <Settings2 size={18} />
          {isManageMode ? t("cancelManage") : t("manageNotes")}
        </button>

        <div className="relative group w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060] group-focus-within:text-red-600 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_notes")}
            className="w-full pr-11 pl-10 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-sm"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function NotesManageBar({
  isManageMode,
  selectedNotes,
  selectAll,
  filteredNotesCount,
  exportNotes,
  bulkDelete,
  t,
}: NotesHeaderProps) {
  if (!isManageMode || filteredNotesCount === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 bg-white border border-[#e5e5e5] rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={selectAll}
          className="flex items-center gap-2 text-sm font-bold text-[#606060] hover:text-red-600 transition-colors"
        >
          {selectedNotes.size === filteredNotesCount ? <CheckSquare size={18} /> : <Square size={18} />}
          {selectedNotes.size === filteredNotesCount ? t("cancelSelectAll") : t("selectAll")}
        </button>
        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
          {t("selectedCount").replace("{count}", String(selectedNotes.size))}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={exportNotes}
          disabled={selectedNotes.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#0f0f0f] rounded-xl text-xs font-bold hover:bg-gray-100 disabled:opacity-50 transition-all border border-[#e5e5e5]"
        >
          <DownloadCloud size={16} />
          {t("exportSelected")}
        </button>
        <button
          onClick={bulkDelete}
          disabled={selectedNotes.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-all border border-red-100"
        >
          <Trash2 size={16} />
          {t("deleteSelected")}
        </button>
      </div>
    </motion.div>
  );
}
