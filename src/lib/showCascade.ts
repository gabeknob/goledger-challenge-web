import { api } from "#/lib/api";
import { searchAllAssets } from "#/lib/search";
import type { Episode } from "#/types/episode";
import type { Season, TvShowReference } from "#/types/season";
import type { TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

export type ShowCascadeTaskStatus = "pending" | "running" | "completed" | "failed";

export interface ShowCascadeTask {
  id: string;
  kind: "watchlist" | "episode" | "season" | "show";
  label: string;
}

export interface ShowCascadePlan {
  tasks: ShowCascadeTask[];
  deletedEpisodes: number;
  deletedSeasons: number;
  updatedWatchlists: number;
}

export interface ShowRenamePlan {
  tasks: ShowCascadeTask[];
  recreatedEpisodes: number;
  recreatedSeasons: number;
  updatedWatchlists: number;
}

interface CascadeDeleteResult {
  deletedEpisodes: number;
  deletedSeasons: number;
  updatedWatchlists: number;
}

interface CascadeDeleteShowPayload {
  onPlanChange?: (plan: ShowCascadePlan) => void;
  onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
  show: TvShow;
}

interface UpdateShowPayload {
  current: TvShow;
  next: { title: string; description: string; recommendedAge: number };
  onPlanChange?: (plan: ShowRenamePlan) => void;
  onTaskStatusChange?: (taskId: string, status: ShowCascadeTaskStatus) => void;
}

// ---------------------------------------------------------------------------
// Asset builders (self-contained copies — cascade is independent of useShows)
// ---------------------------------------------------------------------------

function buildShowAsset(payload: { title: string; description: string; recommendedAge: number }) {
  return {
    "@assetType": "tvShows",
    title: payload.title,
    description: payload.description,
    recommendedAge: payload.recommendedAge,
  };
}

function buildWatchlistAsset(payload: {
  description: string;
  title: string;
  tvShows?: TvShowReference[];
}) {
  return {
    "@assetType": "watchlist",
    title: payload.title,
    description: payload.description,
    ...(payload.tvShows ? { tvShows: payload.tvShows } : {}),
  };
}

function buildSeasonKey(season: Pick<Season, "number" | "tvShow">) {
  return {
    "@assetType": "seasons",
    number: season.number,
    tvShow: season.tvShow,
  };
}

function buildEpisodeKey(episode: Pick<Episode, "season" | "episodeNumber">) {
  return {
    "@assetType": "episodes",
    season: episode.season,
    episodeNumber: episode.episodeNumber,
  };
}

function dedupeTvShows(tvShows: TvShowReference[]) {
  return tvShows.filter((reference, index, array) => {
    return array.findIndex(entry => entry["@key"] === reference["@key"]) === index;
  });
}

// ---------------------------------------------------------------------------
// API helpers (used only within cascade flows)
// ---------------------------------------------------------------------------

async function fetchShow(title: string): Promise<TvShow> {
  const { data } = await api.post<TvShow>("/query/readAsset", {
    key: {
      "@assetType": "tvShows",
      title,
    },
  });

  return data;
}

async function createShow(payload: { title: string; description: string; recommendedAge: number }) {
  await api.post("/invoke/createAsset", {
    asset: [buildShowAsset(payload)],
  });
}

async function createSeasonAsset(payload: {
  number: number;
  tvShow: TvShowReference;
  year: number;
}) {
  await api.post("/invoke/createAsset", {
    asset: [
      {
        "@assetType": "seasons",
        number: payload.number,
        tvShow: payload.tvShow,
        year: payload.year,
      },
    ],
  });
}

async function createEpisodeAsset(payload: {
  season: Episode["season"];
  episodeNumber: number;
  title: string;
  releaseDate: string;
  description: string;
  rating?: number;
}) {
  await api.post("/invoke/createAsset", {
    asset: [
      {
        "@assetType": "episodes",
        season: payload.season,
        episodeNumber: payload.episodeNumber,
        title: payload.title,
        releaseDate: payload.releaseDate,
        description: payload.description,
        ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Cascade delete
// ---------------------------------------------------------------------------

export async function buildShowCascadePlan(show: TvShow): Promise<{
  plan: ShowCascadePlan;
  relatedEpisodes: Episode[];
  relatedSeasons: Season[];
  relatedWatchlists: Watchlist[];
}> {
  const [watchlists, seasons] = await Promise.all([
    searchAllAssets<Watchlist>({ assetType: "watchlist" }),
    searchAllAssets<Season>({ assetType: "seasons" }),
  ]);

  const relatedWatchlists = watchlists.filter(watchlist =>
    (watchlist.tvShows ?? []).some(reference => reference["@key"] === show["@key"]),
  );
  const relatedSeasons = seasons.filter(season => season.tvShow?.["@key"] === show["@key"]);
  const relatedSeasonKeys = new Set(relatedSeasons.map(season => season["@key"]));
  const relatedEpisodes =
    relatedSeasonKeys.size > 0
      ? (await searchAllAssets<Episode>({ assetType: "episodes", limit: 500 })).filter(episode =>
          relatedSeasonKeys.has(episode.season?.["@key"] ?? ""),
        )
      : [];

  const seasonNumberByKey = new Map(
    relatedSeasons.map(season => [season["@key"], season.number] as const),
  );
  const tasks: ShowCascadeTask[] = [
    ...relatedWatchlists.map(watchlist => ({
      id: `watchlist:${watchlist["@key"]}`,
      kind: "watchlist" as const,
      label: `Remove from watchlist "${watchlist.title}"`,
    })),
    ...relatedEpisodes.map(episode => ({
      id: `episode:${episode["@key"]}`,
      kind: "episode" as const,
      label: `Delete S${seasonNumberByKey.get(episode.season["@key"]) ?? "?"}E${episode.episodeNumber} · ${episode.title}`,
    })),
    ...relatedSeasons.map(season => ({
      id: `season:${season["@key"]}`,
      kind: "season" as const,
      label: `Delete Season ${season.number}`,
    })),
    {
      id: `show:${show["@key"]}`,
      kind: "show" as const,
      label: `Delete "${show.title}"`,
    },
  ];

  return {
    plan: {
      tasks,
      deletedEpisodes: relatedEpisodes.length,
      deletedSeasons: relatedSeasons.length,
      updatedWatchlists: relatedWatchlists.length,
    },
    relatedEpisodes,
    relatedSeasons,
    relatedWatchlists,
  };
}

export async function cascadeDeleteShow({
  onPlanChange,
  onTaskStatusChange,
  show,
}: CascadeDeleteShowPayload): Promise<CascadeDeleteResult> {
  const { plan, relatedEpisodes, relatedSeasons, relatedWatchlists } =
    await buildShowCascadePlan(show);

  onPlanChange?.(plan);

  const runTask = async (taskId: string, action: () => Promise<void>) => {
    onTaskStatusChange?.(taskId, "running");
    try {
      await action();
      onTaskStatusChange?.(taskId, "completed");
    } catch (error) {
      onTaskStatusChange?.(taskId, "failed");
      throw error;
    }
  };

  for (const watchlist of relatedWatchlists) {
    await runTask(`watchlist:${watchlist["@key"]}`, () =>
      api.put("/invoke/updateAsset", {
        update: buildWatchlistAsset({
          title: watchlist.title,
          description: watchlist.description ?? "",
          tvShows: (watchlist.tvShows ?? []).filter(
            reference => reference["@key"] !== show["@key"],
          ),
        }),
      }),
    );
  }

  for (const episode of relatedEpisodes) {
    await runTask(`episode:${episode["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildEpisodeKey(episode),
        },
      }),
    );
  }

  for (const season of relatedSeasons) {
    await runTask(`season:${season["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildSeasonKey(season),
        },
      }),
    );
  }

  await runTask(`show:${show["@key"]}`, () =>
    api.delete("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: show.title,
        },
      },
    }),
  );

  return {
    deletedEpisodes: relatedEpisodes.length,
    deletedSeasons: relatedSeasons.length,
    updatedWatchlists: relatedWatchlists.length,
  };
}

// ---------------------------------------------------------------------------
// Rename (cascade re-creation under a new title)
// ---------------------------------------------------------------------------

export async function buildShowRenamePlan(show: TvShow): Promise<{
  plan: ShowRenamePlan;
  relatedEpisodes: Episode[];
  relatedSeasons: Season[];
  relatedWatchlists: Watchlist[];
}> {
  const [watchlists, seasons] = await Promise.all([
    searchAllAssets<Watchlist>({ assetType: "watchlist" }),
    searchAllAssets<Season>({ assetType: "seasons" }),
  ]);

  const relatedWatchlists = watchlists.filter(watchlist =>
    (watchlist.tvShows ?? []).some(reference => reference["@key"] === show["@key"]),
  );
  const relatedSeasons = seasons.filter(season => season.tvShow?.["@key"] === show["@key"]);
  const relatedSeasonKeys = new Set(relatedSeasons.map(season => season["@key"]));
  const relatedEpisodes =
    relatedSeasonKeys.size > 0
      ? (await searchAllAssets<Episode>({ assetType: "episodes", limit: 500 })).filter(episode =>
          relatedSeasonKeys.has(episode.season?.["@key"] ?? ""),
        )
      : [];

  const tasks: ShowCascadeTask[] = [
    {
      id: `show:create:${show["@key"]}`,
      kind: "show",
      label: `Create renamed show`,
    },
    ...relatedSeasons.map(season => ({
      id: `season:create:${season["@key"]}`,
      kind: "season" as const,
      label: `Recreate Season ${season.number}`,
    })),
    ...relatedEpisodes.map(episode => ({
      id: `episode:create:${episode["@key"]}`,
      kind: "episode" as const,
      label: `Recreate episode ${episode.episodeNumber} · ${episode.title}`,
    })),
    ...relatedWatchlists.map(watchlist => ({
      id: `watchlist:update:${watchlist["@key"]}`,
      kind: "watchlist" as const,
      label: `Update watchlist "${watchlist.title}"`,
    })),
    ...relatedEpisodes.map(episode => ({
      id: `episode:delete:${episode["@key"]}`,
      kind: "episode" as const,
      label: `Delete old episode ${episode.episodeNumber} · ${episode.title}`,
    })),
    ...relatedSeasons.map(season => ({
      id: `season:delete:${season["@key"]}`,
      kind: "season" as const,
      label: `Delete old Season ${season.number}`,
    })),
    {
      id: `show:delete:${show["@key"]}`,
      kind: "show",
      label: `Delete old show "${show.title}"`,
    },
  ];

  return {
    plan: {
      tasks,
      recreatedEpisodes: relatedEpisodes.length,
      recreatedSeasons: relatedSeasons.length,
      updatedWatchlists: relatedWatchlists.length,
    },
    relatedEpisodes,
    relatedSeasons,
    relatedWatchlists,
  };
}

export async function renameShow({
  current,
  next,
  onPlanChange,
  onTaskStatusChange,
}: UpdateShowPayload) {
  const { plan, relatedEpisodes, relatedSeasons, relatedWatchlists } =
    await buildShowRenamePlan(current);

  onPlanChange?.(plan);

  const runTask = async (taskId: string, action: () => Promise<void>) => {
    onTaskStatusChange?.(taskId, "running");
    try {
      await action();
      onTaskStatusChange?.(taskId, "completed");
    } catch (error) {
      onTaskStatusChange?.(taskId, "failed");
      throw error;
    }
  };

  await runTask(`show:create:${current["@key"]}`, () => createShow(next));

  const renamedShow = await fetchShow(next.title);
  const renamedShowReference = {
    "@assetType": "tvShows" as const,
    "@key": renamedShow["@key"],
  };

  for (const season of relatedSeasons) {
    await runTask(`season:create:${season["@key"]}`, () =>
      createSeasonAsset({
        number: season.number,
        tvShow: renamedShowReference,
        year: season.year,
      }),
    );
  }

  const recreatedSeasons = (await searchAllAssets<Season>({ assetType: "seasons" })).filter(
    season => season.tvShow?.["@key"] === renamedShow["@key"],
  );
  const recreatedSeasonByNumber = new Map(
    recreatedSeasons.map(season => [season.number, season] as const),
  );
  const oldSeasonNumberByKey = new Map(
    relatedSeasons.map(season => [season["@key"], season.number] as const),
  );

  for (const episode of relatedEpisodes) {
    const seasonNumber = oldSeasonNumberByKey.get(episode.season["@key"]);
    const recreatedSeason = seasonNumber ? recreatedSeasonByNumber.get(seasonNumber) : undefined;

    if (!recreatedSeason) {
      throw new Error(
        `Could not locate recreated Season ${seasonNumber ?? "?"} for the renamed show.`,
      );
    }

    await runTask(`episode:create:${episode["@key"]}`, () =>
      createEpisodeAsset({
        season: {
          "@assetType": "seasons",
          "@key": recreatedSeason["@key"],
        },
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        releaseDate: episode.releaseDate,
        description: episode.description,
        rating: episode.rating,
      }),
    );
  }

  for (const watchlist of relatedWatchlists) {
    await runTask(`watchlist:update:${watchlist["@key"]}`, () =>
      api.put("/invoke/updateAsset", {
        update: buildWatchlistAsset({
          title: watchlist.title,
          description: watchlist.description ?? "",
          tvShows: dedupeTvShows([
            ...(watchlist.tvShows ?? []).filter(reference => reference["@key"] !== current["@key"]),
            renamedShowReference,
          ]),
        }),
      }),
    );
  }

  for (const episode of relatedEpisodes) {
    await runTask(`episode:delete:${episode["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildEpisodeKey(episode),
        },
      }),
    );
  }

  for (const season of relatedSeasons) {
    await runTask(`season:delete:${season["@key"]}`, () =>
      api.delete("/invoke/deleteAsset", {
        data: {
          key: buildSeasonKey(season),
        },
      }),
    );
  }

  await runTask(`show:delete:${current["@key"]}`, () =>
    api.delete("/invoke/deleteAsset", {
      data: {
        key: {
          "@assetType": "tvShows",
          title: current.title,
        },
      },
    }),
  );
}
