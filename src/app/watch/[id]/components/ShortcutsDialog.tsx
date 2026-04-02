"use client";

import React from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SHORTCUTS } from '../utils/constants';

interface ShortcutsDialogProps {
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
  language: string;
}

export default function ShortcutsDialog({
  showShortcuts,
  setShowShortcuts,
  language,
}: ShortcutsDialogProps) {
  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <Keyboard size={20} className="text-primary" />
            {language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Keyboard shortcuts for video playback
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 mt-2">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm text-foreground/80">
                {language === 'ar' ? s.descAr : s.desc}
              </span>
              <kbd className="text-[11px] font-mono font-bold bg-muted px-2 py-1 rounded-md border border-border text-foreground/70 min-w-[80px] text-center">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-[11px] text-muted-foreground">
            {language === 'ar' ? 'اضغط ؟ لفتح هذه القائمة' : 'Press ? to open this dialog'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
