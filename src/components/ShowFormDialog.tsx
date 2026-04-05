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
import { type ShowCascadeTaskStatus, type ShowRenamePlan, useCreateShow, useUpdateShow } from "#/hooks/useShows";
import { getApiErrorMessage } from "#/lib/api-errors";
import { createTvShowSchema, type TvShowFormValues } from "#/schemas/tvShow";
import type { TvShow } from "#/types/tvShow";

interface ShowFormDialogProps {
  existingShows: TvShow[];
  mode: "create" | "edit";
  onRenamePlanChange?: (plan: ShowRenamePlan | null) => void;
  onRenameTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
  onRenamingChange?: (renaming: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (title: string) => void;
  show?: TvShow | null;
}

export function ShowFormDialog({
  existingShows,
  mode,
  onRenamePlanChange,
  onRenameTaskStatusChange,
  onRenamingChange,
  open,
  onOpenChange,
  onSubmitted,
  show,
}: ShowFormDialogProps) {
  const createShow = useCreateShow();
  const updateShow = useUpdateShow();
  const currentTitle = mode === "edit" ? show?.title : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TvShowFormValues>({
    resolver: zodResolver(createTvShowSchema(existingShows, currentTitle)),
    values: {
      title: show?.title ?? "",
      description: show?.description ?? "",
      recommendedAge: show?.recommendedAge ?? 16,
    },
  });

  async function onSubmit(values: TvShowFormValues) {
    try {
      if (mode === "create") {
        await createShow.mutateAsync(values);
        toast.success(`"${values.title}" was created successfully.`);
      } else if (show) {
        const titleChanged = values.title !== show.title;
        if (titleChanged) {
          onRenamingChange?.(true);
        }

        await updateShow.mutateAsync({
          current: show,
          next: {
            title: values.title,
            description: values.description,
            recommendedAge: values.recommendedAge,
          },
          onPlanChange: plan => onRenamePlanChange?.(plan),
          onTaskStatusChange: onRenameTaskStatusChange,
        });
        toast.success(
          titleChanged
            ? `"${values.title}" was renamed successfully.`
            : `"${values.title}" was updated successfully.`,
        );
      }

      onOpenChange(false);
      onSubmitted?.(values.title);
    } catch (error) {
      onRenamingChange?.(false);
      onRenamePlanChange?.(null);
      toast.error(
        getApiErrorMessage(
          error,
          mode === "create" ? "Could not create the TV show." : "Could not update the TV show.",
        ),
      );
    }
  }

  const isPending = createShow.isPending || updateShow.isPending;
  const title = mode === "create" ? "New Show" : "Edit Show";
  const description =
    mode === "create"
      ? "Add a new title to your catalogue with a clear name and description."
      : "Update the current show details without leaving the browse page.";
  const actionLabel = mode === "create" ? "Create Show" : "Save Changes";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="show-title">Title</Label>
            <Input
              id="show-title"
              aria-invalid={Boolean(errors.title)}
              placeholder="Breaking Bad"
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
            {mode === "edit" ? (
              <p className="text-sm text-muted-foreground">
                Title changes will cascade through related seasons, episodes, and watchlists.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="show-description">Description</Label>
            <Textarea
              id="show-description"
              aria-invalid={Boolean(errors.description)}
              placeholder="A gripping summary that helps you recognize the show later."
              {...register("description")}
            />
            {errors.description ? (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="show-recommended-age">Recommended age</Label>
            <Input
              id="show-recommended-age"
              type="number"
              min={0}
              step={1}
              aria-invalid={Boolean(errors.recommendedAge)}
              placeholder="16"
              {...register("recommendedAge", { valueAsNumber: true })}
            />
            {errors.recommendedAge ? (
              <p className="text-sm text-destructive">{errors.recommendedAge.message}</p>
            ) : null}
          </div>

          <CredenzaFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : actionLabel}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  );
}
