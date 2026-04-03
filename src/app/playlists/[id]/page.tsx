"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { useI18n } from "@/lib/i18n-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";
import { usePlaylists, type Playlist, type PlaylistItem } from "@/hooks/usePlaylists";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, ArrowLeft, Clock, Lock, Loader2, ListVideo, X } from "lucide-react";
import { toast } from "sonner";

function formatDate(dateString: string, language: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const locale =
    language === "ar"
      ? "ar-SA"
      : language === "zh"
        ? "zh-CN"
        : language === "ja"
          ? "ja-JP"
          : language === "pt"
            ? "pt-BR"
            : `${language}-${language.toUpperCase()}`;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = params.id as string;

  const { t, direction, language } = useI18n();
  const { playlists, deletePlaylist, removeFromPlaylist } = usePlaylists();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout(sidebarOpen);

  useEffect(() => {
    if (window.innerWidth >= 1200) {
      setSidebarOpen(true);
    }
  }, []);

  // Find playlist from the hook's list
  const playlist = playlists.find((p) => p.id === playlistId);

  // Fetch playlist items on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/playlists/${playlistId}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            const serverItems: PlaylistItem[] = data.items.map((item: any) => ({
              id: item.id,
              playlistId: item.playlist_id,
              videoId: item.video_id,
              title: item.title || "",
              thumbnail: item.thumbnail || "",
              channelName: item.channel_name || "",
              duration: item.duration || "",
              addedAt: item.created_at || new Date().toISOString(),
            }));
            setItems(serverItems);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [playlistId]);

  // ── Animation variants ─────────────────────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDeletePlaylist = () => {
    const confirmed = window.confirm(t("deletePlaylistConfirm"));
    if (!confirmed) return;

    deletePlaylist(playlistId);
    toast.success(t("playlistDeleted"));
    window.location.href = "/playlists";
  };

  const handleRemoveItem = (videoId: string) => {
    removeFromPlaylist(playlistId, videoId);
    setItems((prev) => prev.filter((item) => item.videoId !== videoId));
    toast.success(t("videoRemoved"));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className={`${marginClass} ${mainPaddingTop} pb-24 px-4 md:px-8 transition-all duration-300 ease-in-out`}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            {/* ── Back button ────────────────────────────────────────────────── */}
            <Link
              href="/playlists"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform"
              />
              {t("back")}
            </Link>

            {/* ── Playlist header ────────────────────────────────────────────── */}
            {playlist && (
              <div className="flex flex-col sm:flex-row gap-6 mb-10">
                {/* Thumbnail */}
                <div className="relative w-48 h-28 sm:w-56 sm:h-32 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-lg">
                  {playlist.thumbnail ? (
                    <img
                      src={playlist.thumbnail}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-500/20 via-pink-500/15 to-orange-500/20 flex items-center justify-center">
                      <ListVideo className="size-10 text-red-500/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                    {playlist.name}
                  </h1>

                  {playlist.description && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium">
                      {items.length || playlist.videoCount} {t("playlistVideos")}
                    </span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      {formatDate(playlist.createdAt, language)}
                    </span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      <Lock size={12} />
                      {t("private")}
                    </span>
                  </div>

                  <button
                    onClick={handleDeletePlaylist}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                    {t("deletePlaylist")}
                  </button>
                </div>
              </div>
            )}

            {/* ── Playlist not found ─────────────────────────────────────────── */}
            {!isLoading && !playlist && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[2.5rem] p-16 text-center border border-border shadow-sm"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <ListVideo className="size-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {t("video_not_found")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("video_not_found_desc")}
                </p>
                <Link
                  href="/playlists"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  <ArrowLeft size={16} />
                  {t("back")}
                </Link>
              </motion.div>
            )}

            {/* ── Loading state ──────────────────────────────────────────────── */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="size-8 text-red-600 animate-spin" />
                <p className="text-muted-foreground text-sm font-medium animate-pulse">
                  {t("loading")}
                </p>
              </div>
            )}

            {/* ── Empty playlist ─────────────────────────────────────────────── */}
            {playlist && !isLoading && items.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[2.5rem] p-16 text-center border border-border shadow-sm"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <ListVideo className="size-10 text-muted-foreground/40" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {t("emptyPlaylist")}
                </h2>
                <p className="text-muted-foreground">
                  {t("emptyPlaylistDesc")}
                </p>
              </motion.div>
            )}

            {/* ── Video list ─────────────────────────────────────────────────── */}
            {playlist && !isLoading && items.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.videoId}
                      variants={itemVariants}
                      layout
                      exit={{
                        opacity: 0,
                        x: -30,
                        transition: { duration: 0.2 },
                      }}
                      className="group/item flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/60 transition-colors"
                    >
                      {/* Index */}
                      <span className="w-8 text-center text-sm font-bold text-muted-foreground shrink-0 tabular-nums">
                        {index + 1}
                      </span>

                      {/* Thumbnail with play overlay */}
                      <Link
                        href={`/watch/${item.videoId}`}
                        className="relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-muted shrink-0"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="p-2 rounded-full bg-black/60 text-white opacity-0 group-hover/item:opacity-100 scale-75 group-hover/item:scale-100 transition-all">
                            <Play className="size-4 fill-current" />
                          </div>
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-1.5 end-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded flex items-center gap-1">
                            <Clock size={9} />
                            {item.duration}
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/watch/${item.videoId}`}>
                          <h3 className="text-sm font-semibold line-clamp-2 leading-snug hover:text-red-600 transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        {item.channelName && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.channelName}
                          </p>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveItem(item.videoId)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100 active:scale-90 shrink-0"
                        title={t("removeVideo")}
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
