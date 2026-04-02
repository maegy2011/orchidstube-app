"use client";

import React from 'react';
import Link from 'next/link';
import { History, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotesEmptyProps {
  isLoaded: boolean;
  allNotesCount: number;
  hasSearchQuery: boolean;
  clearFilters: () => void;
  t: (key: string) => string;
}

export default function NotesEmpty({
  isLoaded,
  allNotesCount,
  hasSearchQuery,
  clearFilters,
  t,
}: NotesEmptyProps) {
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-red-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[#606060] text-sm font-medium animate-pulse">{t("loadingHistory")}</p>
      </div>
    );
  }

  if (allNotesCount === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-12 text-center border border-[#e5e5e5] shadow-sm max-w-lg mx-auto"
      >
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <History className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold mb-3">{t("noNotes_found")}</h2>
        <p className="text-[#606060] mb-8 leading-relaxed">
          {t("noNotesYetDesc")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
        >
          <ArrowRight size={18} className="rotate-180" />
          {t("discoverVideos")}
        </Link>
      </motion.div>
    );
  }

  if (hasSearchQuery) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-3xl p-16 text-center border border-[#e5e5e5] shadow-sm"
      >
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("noResults")}</h2>
        <p className="text-[#606060] mb-6">
          {t("noResultsDesc")}
        </p>
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-[#0f0f0f] rounded-xl font-bold hover:bg-gray-200 transition-all"
        >
          <RefreshCw size={16} />
          {t("resetFilters")}
        </button>
      </motion.div>
    );
  }

  return null;
}
