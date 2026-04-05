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
import { useDeleteWatchlist } from "#/hooks/useWatchlists";
import { getApiErrorMessage } from "#/lib/api-errors";
import type { Watchlist } from "#/types/watchlist";

interface DeleteWatchlistDialogProps {
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  watchlist: Watchlist | null;
}

export function DeleteWatchlistDialog({
  onDeleted,
  onOpenChange,
  open,
  watchlist,
}: DeleteWatchlistDialogProps) {
  const deleteWatchlist = useDeleteWatchlist();

  async function handleDelete() {
    if (!watchlist) {
      return;
    }

    try {
      await deleteWatchlist.mutateAsync(watchlist);
      toast.success(`"${watchlist.title}" was removed successfully.`);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete the watchlist."));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete watchlist?</AlertDialogTitle>
          <AlertDialogDescription>
            {watchlist
              ? `This will permanently remove "${watchlist.title}". This action cannot be undone.`
              : "This will permanently remove the selected watchlist."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWatchlist.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={deleteWatchlist.isPending} onClick={handleDelete}>
            {deleteWatchlist.isPending ? "Deleting..." : "Delete Watchlist"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
