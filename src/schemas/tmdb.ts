import { z } from "zod";

export const tmdbSearchResultSchema = z.object({
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
});

export const tmdbSearchResponseSchema = z.object({
  results: z.array(tmdbSearchResultSchema).default([]),
});

export type TMDBSearchResponse = z.infer<typeof tmdbSearchResponseSchema>;
