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
} from "#/components/ui/alert-dialog";
import { useDeleteEpisode } from "#/hooks/useEpisodes";
import { getApiErrorMessage } from "#/lib/api/errors";
import type { Episode } from "#/types/episode";

interface DeleteEpisodeDialogProps {
  episode: Episode | null;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function DeleteEpisodeDialog({
  episode,
  onDeleted,
  onOpenChange,
  open,
}: DeleteEpisodeDialogProps) {
  const deleteEpisode = useDeleteEpisode();

  async function handleDelete() {
    if (!episode) {
      return;
    }

    try {
      await deleteEpisode.mutateAsync(episode);
      toast.success(`Episode ${episode.episodeNumber} was removed successfully.`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the episode."));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete episode?</AlertDialogTitle>
          <AlertDialogDescription>
            {episode
              ? `This will permanently remove Episode ${episode.episodeNumber}, "${episode.title}".`
              : "This will permanently remove the selected episode."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteEpisode.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteEpisode.isPending} onClick={handleDelete}>
            {deleteEpisode.isPending ? "Deleting..." : "Delete Episode"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
