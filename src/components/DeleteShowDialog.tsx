import { useState } from "react";
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
import { Input } from "#/components/ui/input";
import {
  type ShowCascadePlan,
  type ShowCascadeTaskStatus,
  useCascadeDeleteShow,
} from "#/hooks/useShows";
import { getApiErrorMessage } from "#/lib/api-errors";
import type { TvShow } from "#/types/tvShow";

interface DeleteShowDialogProps {
  onDeletingChange?: (deleting: boolean) => void;
  onPlanChange?: (plan: ShowCascadePlan | null) => void;
  onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: TvShow | null;
  onDeleted?: () => void;
}

export function DeleteShowDialog({
  onDeletingChange,
  onPlanChange,
  onTaskStatusChange,
  open,
  onOpenChange,
  show,
  onDeleted,
}: DeleteShowDialogProps) {
  const cascadeDeleteShow = useCascadeDeleteShow();
  const [confirmation, setConfirmation] = useState("");
  const confirmationTarget = show ? `delete ${show.title}` : "delete this_show";
  const confirmationMatches = confirmation.trim() === confirmationTarget;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmation("");
      onPlanChange?.(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleDelete() {
    if (!show || !confirmationMatches) {
      return;
    }

    onDeletingChange?.(true);
    onOpenChange(false);

    try {
      const result = await cascadeDeleteShow.mutateAsync({
        onPlanChange: plan => onPlanChange?.(plan),
        onTaskStatusChange,
        show,
      });
      const details = [
        `${result.updatedWatchlists} watchlists`,
        `${result.deletedSeasons} seasons`,
        `${result.deletedEpisodes} episodes`,
      ].join(", ");

      toast.success(`"${show.title}" was deleted with cascade cleanup: ${details}.`);
      handleOpenChange(false);
      onDeleted?.();
    } catch (error) {
      onDeletingChange?.(false);
      onPlanChange?.(null);
      toast.error(getApiErrorMessage(error, "Could not cascade delete the TV show."));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete show and related data?</AlertDialogTitle>
          <AlertDialogDescription>
            {show
              ? `This will remove "${show.title}" from the catalogue, take it out of every watchlist, delete its episodes, and then delete its seasons. Type ${confirmationTarget} to confirm.`
              : "This will permanently remove the selected TV show from the catalogue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label htmlFor="delete-show-confirmation" className="text-sm font-medium text-foreground">
            Type <span className="display-title text-xs italic">{confirmationTarget}</span> to
            confirm
          </label>
          <Input
            id="delete-show-confirmation"
            value={confirmation}
            onChange={event => setConfirmation(event.target.value)}
            placeholder={confirmationTarget}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cascadeDeleteShow.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={cascadeDeleteShow.isPending || !confirmationMatches}
            onClick={handleDelete}
          >
            {cascadeDeleteShow.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
