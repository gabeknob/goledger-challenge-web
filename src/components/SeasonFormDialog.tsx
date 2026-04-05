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
import { useCreateSeason, useUpdateSeason } from "#/hooks/useSeasons";
import { getApiErrorMessage } from "#/lib/api/errors";
import { createSeasonSchema, type SeasonFormValues } from "#/schemas/season";
import type { Season, TvShowReference } from "#/types/season";

interface SeasonFormDialogProps {
  existingSeasons: Season[];
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmitted?: (seasonNumber: number) => void;
  open: boolean;
  season?: Season | null;
  show: TvShowReference | null;
}

export function SeasonFormDialog({
  existingSeasons,
  mode,
  onOpenChange,
  onSubmitted,
  open,
  season,
  show,
}: SeasonFormDialogProps) {
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();
  const currentSeason = mode === "edit" ? (season ?? null) : null;
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SeasonFormValues>({
    resolver: zodResolver(createSeasonSchema(existingSeasons, currentSeason)),
    values: {
      number: season?.number ?? existingSeasons.length + 1,
      year: season?.year ?? new Date().getFullYear(),
    },
  });

  async function onSubmit(values: SeasonFormValues) {
    if (!show) {
      return;
    }

    try {
      if (mode === "create") {
        await createSeason.mutateAsync({
          number: values.number,
          show,
          year: values.year,
        });
        toast.success(`Season ${values.number} was created successfully.`);
      } else if (season) {
        await updateSeason.mutateAsync({
          current: season,
          next: values,
        });
        toast.success(`Season ${values.number} was updated successfully.`);
      }

      onOpenChange(false);
      onSubmitted?.(values.number);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          mode === "create" ? "Could not create the season." : "Could not update the season.",
        ),
      );
    }
  }

  const isPending = createSeason.isPending || updateSeason.isPending;
  const title = mode === "create" ? "Add Season" : "Edit Season";
  const description =
    mode === "create"
      ? "Add a new season to this show with a season number and release year."
      : "Update this season without leaving the show detail page.";
  const actionLabel = mode === "create" ? "Create Season" : "Save Changes";

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </CredenzaHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-number">Season number</Label>
            <Input
              id="season-number"
              type="number"
              min={1}
              step={1}
              aria-invalid={Boolean(errors.number)}
              readOnly={mode === "edit"}
              className={mode === "edit" ? "bg-muted/60 text-muted-foreground" : undefined}
              {...register("number", { valueAsNumber: true })}
            />
            {errors.number ? (
              <p className="text-sm text-destructive">{errors.number.message}</p>
            ) : null}
            {mode === "edit" ? (
              <p className="text-sm text-muted-foreground">
                Season numbers are locked because episode records reference this season key.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="season-year">Release year</Label>
            <Input
              id="season-year"
              type="number"
              min={1900}
              step={1}
              aria-invalid={Boolean(errors.year)}
              {...register("year", { valueAsNumber: true })}
            />
            {errors.year ? <p className="text-sm text-destructive">{errors.year.message}</p> : null}
          </div>

          <CredenzaFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !show}>
              {isPending ? "Saving..." : actionLabel}
            </Button>
          </CredenzaFooter>
        </form>
      </CredenzaContent>
    </Credenza>
  );
}
