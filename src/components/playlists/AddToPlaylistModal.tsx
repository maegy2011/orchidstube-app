"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPlus, Check, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { usePlaylists } from "@/hooks/usePlaylists";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AddToPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    videoId: string;
    title: string;
    thumbnail?: string;
    channelName?: string;
    duration?: string;
  };
}

export default function AddToPlaylistModal({
  open,
  onOpenChange,
  video,
}: AddToPlaylistModalProps) {
  const { t, language } = useI18n();
  const { playlists, isLoaded, isInPlaylist, addToPlaylist, removeFromPlaylist, createPlaylist } =
    usePlaylists();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleTogglePlaylist = (playlistId: string) => {
    const alreadyIn = isInPlaylist(playlistId, video.videoId);

    if (alreadyIn) {
      removeFromPlaylist(playlistId, video.videoId);
      toast.success(t("removedFromPlaylist"));
    } else {
      addToPlaylist(playlistId, video);
      toast.success(t("addedToPlaylist"));
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const created = createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim() || undefined);
      if (created) {
        // Auto-add the video to the newly created playlist
        addToPlaylist(created.id, video);
        toast.success(t("playlistCreated"));
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        setShowCreateForm(false);
      }
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newPlaylistName.trim()) {
      handleCreatePlaylist();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addToPlaylist")}</DialogTitle>
          <DialogDescription>{t("selectPlaylist")}</DialogDescription>
        </DialogHeader>

        {/* Video preview */}
        {video.thumbnail && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-16 h-10 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{video.title}</p>
              {video.channelName && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {video.channelName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Playlist list */}
        <div className="max-h-72 overflow-y-auto -mx-1">
          {!isLoaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : playlists.length === 0 && !showCreateForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="p-3 rounded-full bg-muted mb-3">
                <ListPlus className="size-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">{t("noPlaylistsYet")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("noPlaylistsYetDesc")}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {playlists.map((playlist) => {
                const inPlaylist = isInPlaylist(playlist.id, video.videoId);

                return (
                  <motion.button
                    key={playlist.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleTogglePlaylist(playlist.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors group"
                  >
                    {/* Thumbnail or fallback */}
                    <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                      {playlist.thumbnail ? (
                        <img
                          src={playlist.thumbnail}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                          <ListPlus className="size-5 text-red-500/60" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-start">
                      <p className="text-sm font-medium truncate">
                        {playlist.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {playlist.videoCount === 1
                          ? (language === 'ar' ? 'فيديو واحد' : '1 video')
                          : (language === 'ar' ? `${playlist.videoCount} فيديو` : `${playlist.videoCount} videos`)}
                      </p>
                    </div>

                    {/* Status icon */}
                    <div
                      className={`shrink-0 p-1.5 rounded-full transition-colors ${
                        inPlaylist
                          ? "bg-red-600 text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                      }`}
                    >
                      {inPlaylist ? (
                        <Check className="size-3.5" />
                      ) : (
                        <ListPlus className="size-3.5" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Create new playlist section */}
        <div className="border-t border-border/50 pt-3 mt-1">
          <AnimatePresence mode="wait">
            {!showCreateForm ? (
              <motion.button
                key="create-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted/70 transition-colors text-sm font-medium text-foreground"
              >
                <Plus size={16} className="text-primary" />
                {t("newPlaylist")}
                <ChevronDown size={14} className="ms-auto text-muted-foreground" />
              </motion.button>
            ) : (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 overflow-hidden"
              >
                <button
                  onClick={() => { setShowCreateForm(false); setNewPlaylistName(""); setNewPlaylistDesc(""); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronUp size={12} />
                  {t("cancel")}
                </button>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder={t("playlistNamePlaceholder")}
                  className="h-9 text-sm"
                  onKeyDown={handleCreateKeyDown}
                  autoFocus
                />
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="w-full h-9 text-sm bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {t("createPlaylist")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
