"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Heart, Clock, FileText, History, EyeOff, Users,
  Settings, AlertTriangle, type LucideIcon,
  Search, Activity, Database, HardDrive, Trash2, MapPin,
} from "lucide-react";
import ConfirmModal from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";

interface DataManagementSectionProps {
  t: (key: string) => string;
  isRTL: boolean;
}

// ─── Browser-only keys that are safe to clear (ephemeral session data) ───
const BROWSER_ONLY_KEYS = [
  'searchQuery',
  'activeCategory',
  'currentPage',
  'scrollPosition',
  'orchids_sidebar_cat',
  'orchids-language-detected',
  'orchids-language-manually-set',
  'app-user-id',
  'orchids-user-settings',
  'youtube-favorites',
  'youtube-denied-videos',
  'youtube-watch-later',
  'youtube-video-notes',
  'orchids_recent_searches',
  'wb-daily-shorts-temp',
  'wb-daily-time',
  'orchids-parental-pin-hash',
  'lastEyeModalShown',
  'app-prayer-coords',
  'app-prayer-timings-cache',
];

const purgeOptions: { scope: string; labelKey: string; descKey: string; icon: LucideIcon; countKey?: string }[] = [
  { scope: 'favorites', labelKey: 'clearFavorites', descKey: 'purgeFavorites', icon: Heart, countKey: 'favorites' },
  { scope: 'watchLater', labelKey: 'clearWatchLater', descKey: 'purgeWatchLater', icon: Clock, countKey: 'watchLater' },
  { scope: 'notes', labelKey: 'clearNotes', descKey: 'purgeNotes', icon: FileText, countKey: 'notes' },
  { scope: 'history', labelKey: 'clearHistory', descKey: 'purgeHistory', icon: History, countKey: 'history' },
  { scope: 'deniedVideos', labelKey: 'clearDeniedVideos', descKey: 'purgeDeniedVideos', icon: EyeOff, countKey: 'deniedVideos' },
  { scope: 'subscriptions', labelKey: 'clearSubscriptions', descKey: 'purgeSubscriptions', icon: Users, countKey: 'subscriptions' },
  { scope: 'recentSearches', labelKey: 'clearRecentSearches', descKey: 'purgeRecentSearches', icon: Search, countKey: 'recentSearches' },
  { scope: 'parentalPin', labelKey: 'clearParentalPin', descKey: 'purgeParentalPin', icon: Settings, countKey: 'parentalPin' },
  { scope: 'dailyUsage', labelKey: 'clearDailyUsage', descKey: 'purgeDailyUsage', icon: Activity, countKey: 'dailyUsage' },
  { scope: 'prayerData', labelKey: 'clearPrayerData', descKey: 'purgePrayerData', icon: MapPin, countKey: 'prayerData' },
  { scope: 'settings', labelKey: 'clearSettings', descKey: 'purgeSettings', icon: Settings, countKey: 'settings' },
];

export default function DataManagementSection({ t, isRTL }: DataManagementSectionProps) {
  const [purgeModalScope, setPurgeModalScope] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [dataStats, setDataStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  // ─── Data stats for purge UI ───
  const fetchDataStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/user-data/stats');
      if (res.ok) {
        const data = await res.json();
        const flat: Record<string, number> = {};
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === 'number') flat[k] = v;
        }
        // Flatten special sub-keys
        if (data.special && typeof data.special === 'object') {
          for (const [k, v] of Object.entries(data.special)) {
            flat[k] = v as number;
          }
        }
        setDataStats(flat);
      }
    } catch {
      // Silently fail — counts are optional UI enhancement
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataStats();
  }, [fetchDataStats]);

  const handleClearBrowserData = async () => {
    try {
      // Clear only browser-only ephemeral keys
      BROWSER_ONLY_KEYS.forEach(key => {
        try { localStorage.removeItem(key); } catch {}
      });
      sessionStorage.clear();

      // Clear caches
      if (typeof window !== 'undefined' && window.caches) {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        } catch (e) {
          // ignore
        }
      }

      toast.success(t('browserDataCleared'));
    } catch (error) {
      toast.error(t('cacheClearFailed'));
    }
  };

  const handlePurgeScope = async (scope: string) => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/user-data/purge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: [scope] }),
      });
      const result = await res.json();
      if (res.ok) {
        const deletedCount = result?.deleted?.[scope] ?? 0;
        toast.success(`${t('serverDataCleared')} (${deletedCount} ${t('itemsWillBeDeleted')})`);
        // Refresh stats after purge
        fetchDataStats();
        // If settings were purged, reload to pick up defaults
        if (scope === 'settings') {
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        toast.error(result?.error || 'Failed to delete data');
      }
    } catch {
      toast.error('Failed to delete data');
    } finally {
      setIsPurging(false);
    }
  };

  const handleDeleteAllData = async () => {
    setIsPurging(true);
    try {
      await fetch('/api/user-data/purge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: ['all'] }),
      });

      // Clear ALL browser data including all localStorage keys
      localStorage.clear();
      sessionStorage.clear();
      if (typeof window !== 'undefined' && window.caches) {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        } catch (e) {
          // ignore
        }
      }

      toast.success(t('allDataDeleted'));
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch {
      toast.error('Failed to delete all data');
      setIsPurging(false);
    }
  };

  return (
    <>
      <div className="p-6 border-b border-border hover:bg-muted/50 transition-colors">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{t('dataManagement')}</h3>
                <p className="text-sm text-muted-foreground">{t('dataManagementDesc')}</p>
              </div>
            </div>
            {/* Total data count badge */}
            {!statsLoading && Object.keys(dataStats).length > 0 && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">
                  {t('totalItems') || 'إجمالي العناصر'}: {Object.values(dataStats).reduce((a, b) => a + b, 0)}
                </span>
                <button
                  onClick={fetchDataStats}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={t('refresh') || 'تحديث'}
                >
                  <Activity className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* A. Clear Browser Data (safe) */}
          <div className="border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{t('clearBrowserData')}</h4>
                <p className="text-xs text-muted-foreground">{t('clearBrowserDataDesc')}</p>
              </div>
            </div>
            <button
              onClick={handleClearBrowserData}
              className="w-full px-4 py-2.5 bg-muted hover:bg-accent rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('clearBrowserData')}
            </button>
          </div>

          {/* B. Granular Server Data Purge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {purgeOptions.map((opt) => {
              const Icon = opt.icon;
              const count = opt.countKey ? (dataStats[opt.countKey] ?? 0) : 0;
              const isEmpty = count === 0;
              return (
                <div
                  key={opt.scope}
                  className={cn(
                    "border rounded-2xl p-5 flex flex-col gap-3 transition-all",
                    isEmpty
                      ? "border-border opacity-60"
                      : "border-border hover:border-red-200 dark:hover:border-red-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{t(opt.labelKey)}</h4>
                        {statsLoading ? (
                          <div className="w-4 h-4 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        ) : (
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full",
                            isEmpty
                              ? "bg-muted text-muted-foreground"
                              : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          )}>
                            {count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t(opt.descKey)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPurgeModalScope(opt.scope)}
                    disabled={isPurging || isEmpty}
                    className="w-full px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors text-xs flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isEmpty ? (t('noData') || 'لا توجد بيانات') : t('clear')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* C. Nuclear Delete All Data (danger zone) */}
          <div className="border-2 border-red-300 dark:border-red-800 rounded-2xl p-5 bg-red-50/50 dark:bg-red-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-red-600">{t('deleteAllData')}</h4>
                <p className="text-xs text-red-500/80">{t('deleteAllDataDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isPurging}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              {t('deleteAllDataButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Purge confirmation modal */}
      <ConfirmModal
        isOpen={purgeModalScope !== null}
        onClose={() => setPurgeModalScope(null)}
        onConfirm={() => {
          if (purgeModalScope) handlePurgeScope(purgeModalScope);
          setPurgeModalScope(null);
        }}
        title={t('delete')}
        description={purgeModalScope ? t(`purge${purgeModalScope.charAt(0).toUpperCase() + purgeModalScope.slice(1)}`) || t('clear') : ''}
        confirmText={t('clear')}
        cancelText={t('cancel')}
        variant="danger"
      />

      {/* Nuclear delete all modal */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAllData}
        title={t('deleteAllData')}
        description={t('confirmDeleteAll')}
        confirmText={t('deleteAllDataButton')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </>
  );
}
