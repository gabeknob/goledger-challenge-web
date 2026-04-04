import { z } from "zod";

import type { TvShow } from "#/types/tvShow";

export function createTvShowSchema(existingShows: TvShow[], currentTitle?: string) {
  return z
    .object({
      title: z.string().trim().min(1, "Title is required"),
      description: z.string().trim().min(1, "Description is required"),
      recommendedAge: z.coerce
        .number({
          invalid_type_error: "Recommended age is required",
        })
        .int("Recommended age must be a whole number")
        .min(0, "Recommended age cannot be negative"),
    })
    .superRefine((value, ctx) => {
      const normalizedTitle = value.title.toLowerCase();
      const duplicate = existingShows.some(show => {
        if (currentTitle && show.title === currentTitle) {
          return false;
        }

        return show.title.toLowerCase() === normalizedTitle;
      });

      if (duplicate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["title"],
          message: "A TV show with this title already exists",
        });
      }
    });
}

export type TvShowFormValues = z.infer<ReturnType<typeof createTvShowSchema>>;
