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
import { useCreateEpisode, useUpdateEpisode } from "#/hooks/useEpisodes";
import { getApiErrorMessage } from "#/lib/api/errors";
import { createEpisodeSchema, type EpisodeFormValues } from "#/schemas/episode";
import type { Episode } from "#/types/episode";
import type { SeasonReference } from "#/types/season";

interface EpisodeFormDialogProps {
  existingEpisodes: Episode[];
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (episodeNumber: number) => void;
  open: boolean;
  episode?: Episode | null;
  season: SeasonReference | null;
}

export function EpisodeFormDialog({
  existingEpisodes,
  mode,
  onOpenChange,
  onSubmitted,
  open,
  episode,
  season,
}: EpisodeFormDialogProps) {
  const createEpisode = useCreateEpisode();
  const updateEpisode = useUpdateEpisode();
  const currentEpisode = mode === "edit" ? (episode ?? null) : null;
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(createEpisodeSchema(existingEpisodes, currentEpisode)),
    values: {
      episodeNumber: episode?.episodeNumber ?? existingEpisodes.length + 1,
      title: episode?.title ?? "",
      releaseDate: toDateTimeLocalValue(episode?.releaseDate),
      description: episode?.description ?? "",
      rating: episode?.rating,
    },
  });

  async function onSubmit(values: EpisodeFormValues) {
    if (!season) {
      return;
    }

    try {
      const payload = {
        episodeNumber: values.episodeNumber,
        title: values.title,
        releaseDate: toIsoDateString(values.releaseDate),
        description: values.description,
        rating: values.rating,
      };

      if (mode === "create") {
        await createEpisode.mutateAsync({
          season,
          ...payload,
        });
        toast.success(`Episode ${values.episodeNumber} was created successfully.`);
      } else if (episode) {
        await updateEpisode.mutateAsync({
          current: episode,
          next: payload,
        });
        toast.success(`Episode ${values.episodeNumber} was updated successfully.`);
      }

      onOpenChange(false);
      onSubmitted?.(values.episodeNumber);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          mode === "create" ? "Could not create the episode." : "Could not update the episode.",
        ),
      );
    }
  }

  const isPending = createEpisode.isPending || updateEpisode.isPending;
  const title = mode === "create" ? "Add Episode" : "Edit Episode";
  const description =
    mode === "create"
      ? "Add a new episode to this season with its title, date, and details."
      : "Update this episode without leaving the show detail page.";
  const actionLabel = mode === "create" ? "Create Episode" : "Save Changes";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="episode-number">Episode number</Label>
            <Input
              id="episode-number"
              type="number"
              min={1}
              step={1}
              aria-invalid={Boolean(errors.episodeNumber)}
              {...register("episodeNumber", { valueAsNumber: true })}
            />
            {errors.episodeNumber ? (
              <p className="text-sm text-destructive">{errors.episodeNumber.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="episode-title">Title</Label>
            <Input
              id="episode-title"
              aria-invalid={Boolean(errors.title)}
              placeholder="Pilot"
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="episode-release-date">Release date</Label>
              <Input
                id="episode-release-date"
                type="datetime-local"
                aria-invalid={Boolean(errors.releaseDate)}
                {...register("releaseDate")}
              />
              {errors.releaseDate ? (
                <p className="text-sm text-destructive">{errors.releaseDate.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="episode-rating">Rating</Label>
              <Input
                id="episode-rating"
                type="number"
                min={0}
                max={10}
                step={0.1}
                aria-invalid={Boolean(errors.rating)}
                placeholder="8.5"
                {...register("rating")}
              />
              {errors.rating ? (
                <p className="text-sm text-destructive">{errors.rating.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="episode-description">Description</Label>
            <Textarea
              id="episode-description"
              aria-invalid={Boolean(errors.description)}
              placeholder="A summary of the episode."
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
            <Button type="submit" disabled={isPending || !season}>
              {isPending ? "Saving..." : actionLabel}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  );
}

function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toIsoDateString(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}
