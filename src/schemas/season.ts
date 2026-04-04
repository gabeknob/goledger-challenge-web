import { z } from "zod";

import type { Season } from "#/types/season";

export function createSeasonSchema(existingSeasons: Season[], currentSeason?: Season | null) {
  return z
    .object({
      number: z.coerce
        .number({
          invalid_type_error: "Season number is required",
        })
        .int("Season number must be a whole number")
        .min(1, "Season number must be at least 1"),
      year: z.coerce
        .number({
          invalid_type_error: "Release year is required",
        })
        .int("Release year must be a whole number")
        .min(1900, "Release year must be 1900 or later"),
    })
    .superRefine((value, ctx) => {
      const duplicateSeason = existingSeasons.some(season => {
        if (currentSeason && season["@key"] === currentSeason["@key"]) {
          return false;
        }

        return season.number === value.number;
      });

      if (duplicateSeason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["number"],
          message: "This show already has a season with that number",
        });
      }
    });
}

export type SeasonFormValues = z.infer<ReturnType<typeof createSeasonSchema>>;
