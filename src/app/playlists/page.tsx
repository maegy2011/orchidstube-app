"use client";

import React, { useState, useEffect } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { useI18n } from "@/lib/i18n-context";
import { useSidebarLayout } from "@/hooks/use-sidebar-layout";
import { useTopPadding } from "@/hooks/use-top-padding";
import { usePlaylists, type Playlist } from "@/hooks/usePlaylists";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import CreatePlaylistDialog from "@/components/playlists/CreatePlaylistDialog";
import { motion, AnimatePresence } from "framer-motion";
import { ListVideo } from "lucide-react";
import { toast } from "sonner";

export default function PlaylistsPage() {
  const { t, direction, language } = useI18n();
  const { playlists, isLoaded, deletePlaylist, updatePlaylist } = usePlaylists();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainPaddingTop = useTopPadding();
  const { marginClass } = useSidebarLayout(sidebarOpen);

  useEffect(() => {
    if (window.innerWidth >= 1200) {
      setSidebarOpen(true);
    }
  }, []);

  // ── Animation variants (same pattern as favorites page) ─────────────────────

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(t("deletePlaylistConfirm"));
    if (!confirmed) return;

    deletePlaylist(id);
    toast.success(t("playlistDeleted"));
  };

  const handleEdit = (playlist: Playlist) => {
    const newName = window.prompt(t("renamePlaylist"), playlist.name);
    if (newName === null || !newName.trim()) return;
    if (newName.trim() === playlist.name) return;

    updatePlaylist(playlist.id, { name: newName.trim() });
    toast.success(t("playlistUpdated"));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground" dir={direction}>
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className={`${marginClass} ${mainPaddingTop} pb-24 px-4 md:px-8 transition-all duration-300 ease-in-out`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-8 md:py-12"
          >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                  <ListVideo className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {t("playlists")}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isLoaded
                      ? `${playlists.length} ${t("playlistVideos")}`
                      : t("loading")}
                  </p>
                </div>
              </div>

              <CreatePlaylistDialog />
            </div>

            {/* ── Loading state ──────────────────────────────────────────────── */}
            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-red-100 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground text-sm font-medium animate-pulse tracking-wide">
                  {t("loading")}
                </p>
              </div>
            ) : playlists.length === 0 ? (
              /* ── Empty state ─────────────────────────────────────────────── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[2.5rem] p-16 text-center border border-border shadow-sm max-w-xl mx-auto"
              >
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ListVideo className="w-12 h-12 text-red-200" />
                </div>
                <h2 className="text-2xl font-bold mb-4">
                  {t("noPlaylistsYet")}
                </h2>
                <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
                  {t("noPlaylistsYetDesc")}
                </p>
                <CreatePlaylistDialog />
              </motion.div>
            ) : (
              /* ── Playlist grid ───────────────────────────────────────────── */
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {playlists.map((playlist) => (
                    <motion.div
                      key={playlist.id}
                      variants={itemVariants}
                      layout
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <PlaylistCard
                        playlist={playlist}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Footer count ───────────────────────────────────────────────── */}
            {isLoaded && playlists.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 text-center"
              >
                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border">
                  <span>
                    {playlists.length} {t("playlistVideos")}
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
