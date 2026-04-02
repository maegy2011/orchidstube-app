"use client";

import React from 'react';
import { Check, X } from 'lucide-react';

interface NoteEditDialogProps {
  editContent: string;
  setEditContent: (v: string) => void;
  editHashtags: string;
  setEditHashtags: (v: string) => void;
  editStartTime: string;
  setEditStartTime: (v: string) => void;
  editEndTime: string;
  setEditEndTime: (v: string) => void;
  saveEdit: () => void;
  cancelEditing: () => void;
  t: (key: string) => string;
}

export default function NoteEditDialog({
  editContent,
  setEditContent,
  editHashtags,
  setEditHashtags,
  editStartTime,
  setEditStartTime,
  editEndTime,
  setEditEndTime,
  saveEdit,
  cancelEditing,
  t,
}: NoteEditDialogProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{t("editNoteLabel")}</span>
        <button onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
          <X size={16} />
        </button>
      </div>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-4 bg-gray-50 border-none rounded-2xl resize-none h-32 text-sm focus:ring-2 focus:ring-red-500/10 transition-all font-medium leading-relaxed mb-4"
          dir="rtl"
          autoFocus
        />
        <div className="mb-4">
          <input
            type="text"
            value={editHashtags}
            onChange={(e) => setEditHashtags(e.target.value)}
            placeholder={t("hashtags_placeholder")}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/10"
            dir="rtl"
          />
        </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#606060] px-1 uppercase tracking-widest">{t('start')}</label>
          <input
            type="text"
            value={editStartTime}
            onChange={(e) => setEditStartTime(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/10"
            placeholder="0:00"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#606060] px-1 uppercase tracking-widest">{t('end')}</label>
          <input
            type="text"
            value={editEndTime}
            onChange={(e) => setEditEndTime(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/10"
            placeholder="0:00"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={(e) => { e.stopPropagation(); saveEdit(); }}
          disabled={!editContent.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-600/20"
        >
          <Check size={18} />
          {t("save_changes_btn")}
        </button>
      </div>
    </div>
  );
}
