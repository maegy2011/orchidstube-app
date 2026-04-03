"use client";

import Link from "next/link";
import { ListVideo, Play, MoreVertical, Trash2, Edit3, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { Playlist } from "@/hooks/usePlaylists";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
  onEdit: (playlist: Playlist) => void;
}

export default function PlaylistCard({
  playlist,
  onDelete,
  onEdit,
}: PlaylistCardProps) {
  const { t } = useI18n();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group relative"
    >
      <Link href={`/playlists/${playlist.id}`} className="block">
        {/* Thumbnail area */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500/15 via-pink-500/10 to-orange-500/15 flex items-center justify-center">
              <ListVideo className="size-12 text-red-500/30" />
            </div>
          )}

          {/* Hover overlay with play button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="p-3 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 transform">
              <Play className="size-5 fill-current rtl:rotate-180" />
            </div>
          </div>

          {/* Video count badge */}
          <div className="absolute bottom-2 end-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-medium">
            {playlist.videoCount} {t("playlistVideos")}
          </div>
        </div>

        {/* Info section */}
        <div className="mt-3 space-y-1">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1 leading-snug">
              {playlist.name}
            </h3>
            <Lock className="size-3.5 text-muted-foreground mt-1 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            {playlist.videoCount === 1
              ? t("video_one")
              : `${playlist.videoCount} ${t("playlistVideos")}`}
          </p>
        </div>
      </Link>

      {/* Dropdown menu */}
      <div className="absolute top-2 start-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.preventDefault()}
              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onEdit(playlist);
              }}
            >
              <Edit3 className="size-4 me-2" />
              {t("editPlaylist")}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(playlist.id);
              }}
            >
              <Trash2 className="size-4 me-2" />
              {t("deletePlaylist")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
