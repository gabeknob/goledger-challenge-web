import { createFileRoute } from "@tanstack/react-router";

import {
  EpisodeDetailPage,
  EpisodeParamError,
  parseEpisodeParam,
} from "#/pages/_auth/shows/EpisodeDetailPage";

export const Route = createFileRoute("/_auth/shows/$showId/episodes/$episode")({
  beforeLoad: ({ params }) => {
    parseEpisodeParam(params.episode);
  },
  loader: ({ params }) => {
    const parsed = parseEpisodeParam(params.episode);

    return {
      crumb: parsed.label,
      episodeNumber: parsed.episodeNumber,
      seasonNumber: parsed.seasonNumber,
    };
  },
  errorComponent: EpisodeParamError,
  component: EpisodeDetailPage,
});
