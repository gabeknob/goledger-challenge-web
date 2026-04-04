import { z } from "zod";

import type { Episode } from "#/types/episode";

function normalizeOptionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}

export function createEpisodeSchema(existingEpisodes: Episode[], currentEpisode?: Episode | null) {
  return z
    .object({
      episodeNumber: z.coerce
        .number({
          invalid_type_error: "Episode number is required",
        })
        .int("Episode number must be a whole number")
        .min(1, "Episode number must be at least 1"),
      title: z.string().trim().min(1, "Title is required"),
      releaseDate: z
        .string()
        .trim()
        .min(1, "Release date is required")
        .refine(value => !Number.isNaN(new Date(value).getTime()), "Release date must be valid"),
      description: z.string().trim().min(1, "Description is required"),
      rating: z.preprocess(
        normalizeOptionalNumber,
        z
          .number({
            invalid_type_error: "Rating must be a number",
          })
          .min(0, "Rating cannot be negative")
          .max(10, "Rating cannot be greater than 10")
          .optional(),
      ),
    })
    .superRefine((value, ctx) => {
      const duplicateEpisode = existingEpisodes.some(episode => {
        if (currentEpisode && episode["@key"] === currentEpisode["@key"]) {
          return false;
        }

        return episode.episodeNumber === value.episodeNumber;
      });

      if (duplicateEpisode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["episodeNumber"],
          message: "This season already has an episode with that number",
        });
      }
    });
}

export type EpisodeFormValues = z.infer<ReturnType<typeof createEpisodeSchema>>;
