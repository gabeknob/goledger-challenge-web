import { z } from "zod";

import type { Watchlist } from "#/types/watchlist";

export function createWatchlistSchema(existingWatchlists: Watchlist[], currentTitle?: string) {
  return z
    .object({
      title: z.string().trim().min(1, "Title is required"),
      description: z.string().trim().default(""),
    })
    .superRefine((value, ctx) => {
      const normalizedTitle = value.title.toLowerCase();
      const duplicate = existingWatchlists.some(watchlist => {
        if (currentTitle && watchlist.title === currentTitle) {
          return false;
        }

        return watchlist.title.toLowerCase() === normalizedTitle;
      });

      if (duplicate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["title"],
          message: "A watchlist with this title already exists",
        });
      }
    });
}

export type WatchlistFormValues = z.infer<ReturnType<typeof createWatchlistSchema>>;
