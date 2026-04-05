import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "#/components/Credenza";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import { useCreateWatchlist, useUpdateWatchlist } from "#/hooks/useWatchlists";
import { getApiErrorMessage } from "#/lib/api-errors";
import { createWatchlistSchema, type WatchlistFormValues } from "#/schemas/watchlist";
import type { Watchlist } from "#/types/watchlist";

interface WatchlistFormDialogProps {
  existingWatchlists: Watchlist[];
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (title: string) => void;
  open: boolean;
  watchlist?: Watchlist | null;
}

export function WatchlistFormDialog({
  existingWatchlists,
  mode,
  onOpenChange,
  onSubmitted,
  open,
  watchlist,
}: WatchlistFormDialogProps) {
  const createWatchlist = useCreateWatchlist();
  const updateWatchlist = useUpdateWatchlist();
  const currentTitle = mode === "edit" ? watchlist?.title : undefined;

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<WatchlistFormValues>({
    resolver: zodResolver(createWatchlistSchema(existingWatchlists, currentTitle)),
    values: {
      description: watchlist?.description ?? "",
      title: watchlist?.title ?? "",
    },
  });

  async function onSubmit(values: WatchlistFormValues) {
    try {
      if (mode === "create") {
        await createWatchlist.mutateAsync(values);
        toast.success(`"${values.title}" was created successfully.`);
      } else if (watchlist) {
        await updateWatchlist.mutateAsync({
          current: watchlist,
          next: values,
        });
        toast.success(`"${values.title}" was updated successfully.`);
      }

      onOpenChange(false);
      onSubmitted?.(values.title);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          mode === "create" ? "Could not create the watchlist." : "Could not update the watchlist.",
        ),
      );
    }
  }

  const actionLabel = mode === "create" ? "Create Watchlist" : "Save Changes";
  const description =
    mode === "create"
      ? "Create a new watchlist with a title and optional description."
      : "Update the watchlist details without leaving the browse page.";
  const isPending = createWatchlist.isPending || updateWatchlist.isPending;
  const title = mode === "create" ? "New Watchlist" : "Edit Watchlist";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>

        <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="watchlist-title">Title</Label>
            <Input
              id="watchlist-title"
              aria-invalid={Boolean(errors.title)}
              placeholder="Weekend Comfort Shows"
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="watchlist-description">Description</Label>
            <Textarea
              id="watchlist-description"
              aria-invalid={Boolean(errors.description)}
              placeholder="A quick note about what belongs in this list."
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <CredenzaFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : actionLabel}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  );
}
