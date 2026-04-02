"use client";

import { Sparkles } from "lucide-react";

interface LoadingModeSectionProps {
  t: (key: string) => string;
  loadMode: string;
  setLoadMode: (v: string) => void;
  tempVideosPerPage: number;
  setTempVideosPerPage: (v: number) => void;
}

export default function LoadingModeSection({
  t,
  loadMode,
  setLoadMode,
  tempVideosPerPage,
  setTempVideosPerPage,
}: LoadingModeSectionProps) {
  return (
    <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{t('loadMode') || "طريقة تحميل الفيديوهات"}</h3>
            <p className="text-sm text-muted-foreground">{t('loadMode') || "اختر بين التمرير اللانهائي أو زر التحميل"}</p>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setLoadMode("auto")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${loadMode === 'auto' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('autoLoad') || "تلقائي"}
          </button>
          <button
            onClick={() => setLoadMode("manual")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${loadMode === 'manual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('manualLoad') || "يدوي"}
          </button>
        </div>
        {/* Videos per page selector */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{t('videosPerPage')}</span>
          </div>
          <div className="flex items-center gap-2">
            {[6, 12, 18, 24, 30].map(count => (
              <button
                key={count}
                onClick={() => setTempVideosPerPage(count)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  tempVideosPerPage === count
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
