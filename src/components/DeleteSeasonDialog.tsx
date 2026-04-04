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
import { useDeleteSeason } from "#/hooks/useSeasons";
import { getApiErrorMessage } from "#/lib/api-errors";
import type { Episode } from "#/types/episode";
import type { Season } from "#/types/season";

interface DeleteSeasonDialogProps {
  episodes: Episode[];
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  season: Season | null;
}

export function DeleteSeasonDialog({
  episodes,
  onDeleted,
  onOpenChange,
  open,
  season,
}: DeleteSeasonDialogProps) {
  const deleteSeason = useDeleteSeason();

  async function handleDelete() {
    if (!season) {
      return;
    }

    try {
      await deleteSeason.mutateAsync({
        episodes,
        season,
      });
      toast.success(`Season ${season.number} was removed successfully.`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the season."));
    }
  }

  const episodeCountLabel =
    episodes.length === 1
      ? "1 episode will also be removed."
      : `${episodes.length} episodes will also be removed.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete season?</AlertDialogTitle>
          <AlertDialogDescription>
            {season
              ? `This will permanently remove Season ${season.number} from the show. ${episodeCountLabel}`
              : "This will permanently remove the selected season from the show."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSeason.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteSeason.isPending} onClick={handleDelete}>
            {deleteSeason.isPending ? "Deleting..." : "Delete Season"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
