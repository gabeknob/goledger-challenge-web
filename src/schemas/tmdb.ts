import { z } from "zod";

export const tmdbSearchResultSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  original_name: z.string().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
});

export const tmdbSearchResponseSchema = z.object({
  results: z.array(tmdbSearchResultSchema).default([]),
});

export const tmdbEpisodeDetailsSchema = z.object({
  still_path: z.string().nullable().optional(),
});

export const tmdbEpisodeImagesResponseSchema = z.object({
  stills: z
    .array(
      z.object({
        file_path: z.string(),
      }),
    )
    .default([]),
});

export type TMDBSearchResponse = z.infer<typeof tmdbSearchResponseSchema>;
