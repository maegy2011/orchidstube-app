"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { useI18n } from "@/lib/i18n-context";
import { useUser } from "@/hooks/use-user";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";
import { usePlaylists, type Playlist, type PlaylistItem } from "@/hooks/usePlaylists";
import { usePlaylistQueue } from "@/lib/playlist-queue-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Trash2,
  ArrowLeft,
  Clock,
  Lock,
  Loader2,
  ListVideo,
  X,
  Shuffle,
  Repeat,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Edit3,
  Check,
  GripVertical,
  Pencil,
  CirclePlay,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

function formatDate(dateString: string, language: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
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

function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function formatTotalDuration(seconds: number, language: string): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    if (language === "ar") return `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ""}`;
    if (language === "ja") return `${h}時間${m > 0 ? `${m}分` : ""}`;
    if (language === "zh") return `${h}小时${m > 0 ? `${m}分钟` : ""}`;
    if (language === "fr") return `${h}h${m > 0 ? `${m}min` : ""}`;
    if (language === "de") return `${h} Std.${m > 0 ? ` ${m} Min.` : ""}`;
    if (language === "pt") return `${h}h${m > 0 ? `${m}min` : ""}`;
    if (language === "tr") return `${h} saat${m > 0 ? ` ${m} dk` : ""}`;
    if (language === "it") return `${h}h${m > 0 ? `${m}min` : ""}`;
    if (language === "es") return `${h}h${m > 0 ? `${m}min` : ""}`;
    return `${h}h ${m > 0 ? `${m}m` : ""}`;
  }
  if (language === "ar") return `${m} دقيقة`;
  if (language === "ja") return `${m}分`;
  if (language === "zh") return `${m}分钟`;
  return `${m} min`;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const { t, direction, language } = useI18n();
  const { isAuthenticated } = useUser();
  const {
    playlists,
    deletePlaylist,
    updatePlaylist,
    removeFromPlaylist,
    reorderPlaylistItems,
    itemsMap,
    isLoaded: playlistsLoaded,
  } = usePlaylists();
  const { playPlaylist } = usePlaylistQueue();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverItems, setServerItems] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetVideoId, setDeleteTargetVideoId] = useState<string | null>(null);

  // Auto-play toggle
  const [autoPlay, setAutoPlay] = useState(true);

  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout(sidebarOpen);

  // Find playlist from the hook's list
  const playlist = playlists.find((p) => p.id === playlistId);

  // For unauthenticated users, items come from localStorage via usePlaylists hook
  const items = isAuthenticated ? serverItems : (itemsMap[playlistId] || []);

  useEffect(() => {
    if (window.innerWidth >= 1200) {
      setSidebarOpen(true);
    }
  }, []);

  // Fetch playlist items on mount (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

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
            const mapped: PlaylistItem[] = data.items.map((item: any) => ({
              id: item.id,
              playlistId: item.playlist_id,
              videoId: item.video_id,
              title: item.title || "",
              thumbnail: item.thumbnail || "",
              channelName: item.channel_name || "",
              duration: item.duration || "",
              addedAt: item.created_at || new Date().toISOString(),
            }));
            setServerItems(mapped);
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
  }, [playlistId, isAuthenticated]);

  // ── Computed values ───────────────────────────────────────────────────────

  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + parseDuration(item.duration), 0),
    [items]
  );

  // ── Animation variants ─────────────────────────────────────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const itemVariants = {
    hidden: { x: direction === "rtl" ? 20 : -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 260, damping: 20 },
    },
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDeletePlaylist = () => {
    deletePlaylist(playlistId);
    toast.success(t("playlistDeleted"));
    router.push("/playlists");
  };

  const handleRemoveItem = (videoId: string) => {
    setDeleteTargetVideoId(videoId);
  };

  const confirmRemoveItem = () => {
    if (!deleteTargetVideoId) return;
    removeFromPlaylist(playlistId, deleteTargetVideoId);
    setServerItems((prev) => prev.filter((item) => item.videoId !== deleteTargetVideoId));
    toast.success(t("videoRemoved"));
    setDeleteTargetVideoId(null);
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    if (reorderPlaylistItems) {
      reorderPlaylistItems(playlistId, newItems.map((item) => item.id));
    }
  };

  const handlePlayAll = (startIndex = 0) => {
    if (items.length === 0) return;
    playPlaylist(playlistId, playlist?.name || "", items, startIndex);
    router.push(`/watch/${items[startIndex].videoId}`);
  };

  const handleShufflePlay = () => {
    if (items.length === 0) return;
    const randomIndex = Math.floor(Math.random() * items.length);
    playPlaylist(playlistId, playlist?.name || "", items, randomIndex);
    router.push(`/watch/${items[randomIndex].videoId}`);
  };

  const handleStartEdit = () => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditDesc(playlist.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error(t("playlistNameRequired"));
      return;
    }
    updatePlaylist(playlistId, { name: editName.trim(), description: editDesc.trim() });
    toast.success(t("playlistUpdated"));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
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
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-56 sm:h-32 rounded-2xl overflow-hidden bg-muted shrink-0 shadow-lg">
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
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xl font-bold h-10"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                      />
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder={t("playlistDescriptionPlaceholder")}
                        className="text-sm h-9"
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSaveEdit} className="bg-primary text-primary-foreground gap-1.5">
                          <Check size={14} />
                          {t("savePlaylist")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                          {items.length} {t("playlistVideos")}
                        </span>
                        {totalDuration > 0 && (
                          <>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} />
                              {formatTotalDuration(totalDuration, language)}
                            </span>
                          </>
                        )}
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
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Action Bar ─────────────────────────────────────────────────── */}
            {playlist && !isLoading && items.length > 0 && (
              <div className="flex items-center justify-between gap-3 mb-6 p-3 bg-muted/50 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handlePlayAll(0)}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2 rounded-full px-5"
                    size="sm"
                  >
                    <Play size={16} className="fill-current" />
                    {t("playAll")}
                  </Button>
                  <Button
                    onClick={handleShufflePlay}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full"
                  >
                    <Shuffle size={14} />
                    {t("shuffle")}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Autoplay toggle */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
                    <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                      {t("autoplay")}
                    </span>
                    <Switch
                      checked={autoPlay}
                      onCheckedChange={setAutoPlay}
                      className="scale-75"
                    />
                  </div>

                  {/* More actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={handleStartEdit}>
                        <Edit3 size={14} className="me-2" />
                        {t("editPlaylistTitle")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 size={14} className="me-2" />
                        {t("deletePlaylist")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  {t("playlistNotFound")}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t("emptyPlaylistDesc")}
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
            {playlist && !isLoading && items.length === 0 && !isEditing && (
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
                className="space-y-1"
              >
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.videoId}
                      variants={itemVariants}
                      layout
                      exit={{
                        opacity: 0,
                        x: direction === "rtl" ? 30 : -30,
                        transition: { duration: 0.2 },
                      }}
                      className="group/item flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/60 transition-colors"
                    >
                      {/* Index / Drag Handle */}
                      <div className="flex items-center gap-0.5 w-12 shrink-0">
                        <span className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">
                          {index + 1}
                        </span>
                        <button
                          className="p-0.5 text-muted-foreground/0 group-hover/item:text-muted-foreground/50 hover:!text-foreground transition-colors cursor-grab active:cursor-grabbing"
                          title={direction === "rtl" ? t("moveDown") : t("moveUp")}
                        >
                          <GripVertical size={14} />
                        </button>
                      </div>

                      {/* Thumbnail with play overlay */}
                      <button
                        onClick={() => handlePlayAll(index)}
                        className="relative w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-muted shrink-0"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="p-2.5 rounded-full bg-black/60 text-white opacity-0 group-hover/item:opacity-100 scale-75 group-hover/item:scale-100 transition-all">
                            <Play className="size-4 fill-current" />
                          </div>
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-1.5 end-1.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold rounded flex items-center gap-1">
                            <Clock size={9} />
                            {item.duration}
                          </div>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handlePlayAll(index)}
                          className="text-start w-full"
                        >
                          <h3 className="text-sm font-semibold line-clamp-2 leading-snug hover:text-red-600 transition-colors">
                            {item.title}
                          </h3>
                        </button>
                        {item.channelName && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.channelName}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Move up/down */}
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveItem(index, "up")}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all opacity-0 group-hover/item:opacity-100 active:scale-90"
                            title={t("moveUp")}
                          >
                            <ChevronUp size={14} />
                          </button>
                        )}
                        {index < items.length - 1 && (
                          <button
                            onClick={() => handleMoveItem(index, "down")}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all opacity-0 group-hover/item:opacity-100 active:scale-90"
                            title={t("moveDown")}
                          >
                            <ChevronDown size={14} />
                          </button>
                        )}
                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveItem(item.videoId)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/item:opacity-100 active:scale-90"
                          title={t("removeVideo")}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Footer count bar ───────────────────────────────────────────── */}
            {playlist && !isLoading && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex items-center justify-between px-4 py-2.5 bg-muted/40 rounded-xl text-xs text-muted-foreground border border-border/30"
              >
                <span className="font-medium">
                  {items.length} {t("playlistVideos")}
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatTotalDuration(totalDuration, language)}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── Delete Playlist Dialog ─────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePlaylistConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeletePlaylist")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaylist}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("deletePlaylist")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Remove Video Dialog ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTargetVideoId} onOpenChange={() => setDeleteTargetVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeFromPlaylistConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeletePlaylist")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveItem}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("removeVideo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
