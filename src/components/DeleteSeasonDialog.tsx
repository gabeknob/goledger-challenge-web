import { toast } from "sonner";
import { useMemo, useState } from "react";

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
import { DeletionTaskList, type DeletionTaskStatus } from "#/components/DeletionTaskList";
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
  const [taskStatuses, setTaskStatuses] = useState<Record<string, DeletionTaskStatus>>({});
  const cascadeTasks = useMemo(
    () => [
      ...episodes.map(episode => ({
        id: `episode:${episode["@key"]}`,
        label: `Delete episode ${episode.episodeNumber} · ${episode.title}`,
      })),
      ...(season
        ? [
            {
              id: `season:${season["@key"]}`,
              label: `Delete Season ${season.number}`,
            },
          ]
        : []),
    ],
    [episodes, season],
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && deleteSeason.isPending) {
      return;
    }

    if (!nextOpen) {
      setTaskStatuses({});
    }

    onOpenChange(nextOpen);
  }

  async function handleDelete() {
    if (!season) {
      return;
    }

    try {
      await deleteSeason.mutateAsync({
        episodes,
        onTaskStatusChange: (taskId, status) =>
          setTaskStatuses(current => ({
            ...current,
            [taskId]: status,
          })),
        season,
      });
      toast.success(`Season ${season.number} was removed successfully.`);
      handleOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the season."));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete season and episodes?</AlertDialogTitle>
          <AlertDialogDescription>
            {season
              ? `This cascade will remove Season ${season.number} and everything inside it.`
              : "This will permanently remove the selected season from the show."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {cascadeTasks.length > 0 ? (
          <DeletionTaskList className="space-y-2" tasks={cascadeTasks} statuses={taskStatuses} />
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSeason.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteSeason.isPending}
            onClick={event => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleteSeason.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
