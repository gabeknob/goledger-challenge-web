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
import { useDeleteShow } from "#/hooks/useShows";
import { getApiErrorMessage } from "#/lib/api-errors";
import type { TvShow } from "#/types/tvShow";

interface DeleteShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: TvShow | null;
}

export function DeleteShowDialog({ open, onOpenChange, show }: DeleteShowDialogProps) {
  const deleteShow = useDeleteShow();

  async function handleDelete() {
    if (!show) {
      return;
    }

    try {
      await deleteShow.mutateAsync(show);
      toast.success(`"${show.title}" was removed from the catalogue.`);
      onOpenChange(false);
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not delete the TV show.");

      toast.error(
        message.includes("another asset holds a reference")
          ? "This show is still referenced by another record. Remove its related seasons or watchlist entries first."
          : message,
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete show?</AlertDialogTitle>
          <AlertDialogDescription>
            {show
              ? `This will permanently remove "${show.title}" from the catalogue. This action cannot be undone.`
              : "This will permanently remove the selected TV show from the catalogue."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteShow.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteShow.isPending} onClick={handleDelete}>
            {deleteShow.isPending ? "Deleting..." : "Delete Show"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
