"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { usePlaylists } from "@/hooks/usePlaylists";
import { toast } from "sonner";

interface CreatePlaylistDialogProps {
  trigger?: React.ReactNode;
}

export default function CreatePlaylistDialog({ trigger }: CreatePlaylistDialogProps) {
  const { t } = useI18n();
  const { createPlaylist } = usePlaylists();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      createPlaylist(name.trim(), description.trim() || undefined);
      toast.success(t("playlistCreated"));
      setName("");
      setDescription("");
      setOpen(false);
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const defaultTrigger = (
    <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white gap-2">
      <Plus className="size-4" />
      <span>{t("newPlaylist")}</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newPlaylist")}</DialogTitle>
          <DialogDescription>{t("createPlaylist")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("playlistName")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("playlistNamePlaceholder")}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleCreate();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("playlistDescription")}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("playlistDescriptionPlaceholder")}
              className="w-full min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t("createPlaylist")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
