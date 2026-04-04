import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Link, Navigate, createFileRoute } from "@tanstack/react-router";
import { Calendar03Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { DeleteSeasonDialog } from "#/components/DeleteSeasonDialog";
import { DeleteShowDialog } from "#/components/DeleteShowDialog";
import { SeasonFormDialog } from "#/components/SeasonFormDialog";
import { ShowFormDialog } from "#/components/ShowFormDialog";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import { useEpisodes, useSeasons, useShow } from "#/hooks/useShowDetail";
import { useShows } from "#/hooks/useShows";
import { useTMDB } from "#/hooks/useTMDB";
import type { Episode } from "#/types/episode";
import type { Season } from "#/types/season";
import type { TvShow } from "#/types/tvShow";

const MOBILE_POSTER_MIN_HEIGHT_REM = 18;
const MOBILE_POSTER_MAX_HEIGHT_REM = 27;
const MOBILE_POSTER_SCROLL_RANGE_PX = 220;

export const Route = createFileRoute("/_auth/shows/$showId/")({
  staticData: { crumb: "Show" },
  validateSearch: search => ({
    season:
      typeof search.season === "number"
        ? search.season
        : typeof search.season === "string" && search.season.trim()
          ? Number(search.season)
          : undefined,
  }),
  loader: ({ params }) => ({
    crumb: decodeURIComponent(params.showId),
  }),
  component: ShowDetailPage,
});

function ShowDetailPage() {
  const { showId } = Route.useParams();
  const decodedShowId = decodeURIComponent(showId);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: allShows = [] } = useShows();
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: show, isLoading: isShowLoading, isError: isShowError } = useShow(decodedShowId);
  const { imageUrl: posterUrl } = useTMDB(show?.title ?? decodedShowId, "poster");
  const {
    data: seasons = [],
    isLoading: isSeasonsLoading,
    isError: isSeasonsError,
  } = useSeasons(show?.["@key"]);
  const activeSeason = getActiveSeason(seasons, search.season);
  const seasonKeys = seasons.map(season => season["@key"]);
  const {
    data: episodes = [],
    isLoading: isEpisodesLoading,
    isError: isEpisodesError,
  } = useEpisodes(seasonKeys);
  const visibleEpisodes = useMemo(
    () =>
      activeSeason
        ? episodes.filter(episode => episode.season["@key"] === activeSeason["@key"])
        : [],
    [activeSeason, episodes],
  );
  const deletingSeasonEpisodes = useMemo(
    () =>
      deletingSeason
        ? episodes.filter(episode => episode.season["@key"] === deletingSeason["@key"])
        : [],
    [deletingSeason, episodes],
  );
  const showReference = show
    ? ({
        "@assetType": "tvShows",
        "@key": show["@key"],
      } as const)
    : null;

  if (!search.season && seasons[0]) {
    return (
      <Navigate
        to="/shows/$showId"
        params={{ showId }}
        search={{ season: seasons[0].number }}
        replace
      />
    );
  }

  return (
    <main className="pb-16 md:pb-10">
      <ShowHero
        show={show}
        fallbackTitle={decodedShowId}
        posterUrl={posterUrl}
        isLoading={isShowLoading}
        isError={isShowError}
        onEdit={() => setIsEditOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
                Seasons
              </p>
              <h2 className="display-title text-2xl font-semibold text-foreground">
                Browse the catalogue
              </h2>
            </div>
            <Button onClick={() => setCreatingSeason(true)} disabled={!show}>
              Add Season
            </Button>
          </div>

          {isSeasonsLoading ? <SeasonTabsSkeleton /> : null}
          {isSeasonsError ? (
            <p className="text-sm text-destructive">Failed to load seasons. Please try again.</p>
          ) : null}

          {!isSeasonsLoading && !isSeasonsError && seasons.length === 0 ? (
            <EmptySeasonState disabled={!show} onAddSeason={() => setCreatingSeason(true)} />
          ) : null}

          {!isSeasonsLoading && !isSeasonsError && seasons.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 rounded-4xl border border-border bg-card/80 p-1">
                {seasons.map(season => {
                  const isActive = season["@key"] === activeSeason?.["@key"];
                  const wrapperClassName = isActive
                    ? "rounded-full bg-primary text-primary-foreground"
                    : "rounded-full bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

                  return (
                    <div
                      key={season["@key"]}
                      className={`inline-flex min-h-10 items-stretch py-1 pl-1 pr-1 ${wrapperClassName}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/shows/$showId",
                            params: { showId },
                            search: { season: season.number },
                          })
                        }
                        className="h-full rounded-full px-3 py-2 text-sm font-medium text-shadow-md"
                      >
                        Season {season.number}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="xs"
                            className={`h-full min-h-0 self-stretch overflow-hidden rounded-full bg-white text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-primary shadow-sm transition-all duration-200 ease-out hover:text-foreground hover:border-foreground ${
                              isActive
                                ? "ml-0.5 max-w-24 px-2.5 opacity-100"
                                : "pointer-events-none ml-0 max-w-0 px-0 opacity-0"
                            }`}
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                            <span>Edit</span>
                            <span className="sr-only">Season actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-32">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onSelect={() => setEditingSeason(season)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeletingSeason(season)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>

              {isEpisodesLoading ? <EpisodeListSkeleton /> : null}
              {isEpisodesError ? (
                <p className="text-sm text-destructive">
                  Failed to load episodes. Please try again.
                </p>
              ) : null}
              {!isEpisodesLoading && !isEpisodesError ? (
                <EpisodeList episodes={visibleEpisodes} season={activeSeason} showId={showId} />
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <ShowFormDialog
        existingShows={allShows}
        mode="edit"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        show={show}
      />
      <SeasonFormDialog
        existingSeasons={seasons}
        mode="create"
        onOpenChange={setCreatingSeason}
        onSubmitted={seasonNumber =>
          navigate({
            to: "/shows/$showId",
            params: { showId },
            search: { season: seasonNumber },
          })
        }
        open={creatingSeason}
        show={showReference}
      />
      <SeasonFormDialog
        existingSeasons={seasons}
        mode="edit"
        onOpenChange={open => {
          if (!open) {
            setEditingSeason(null);
          }
        }}
        onSubmitted={seasonNumber =>
          navigate({
            to: "/shows/$showId",
            params: { showId },
            search: { season: seasonNumber },
          })
        }
        open={Boolean(editingSeason)}
        season={editingSeason}
        show={showReference}
      />
      <DeleteSeasonDialog
        episodes={deletingSeasonEpisodes}
        onDeleted={() => {
          const deletedSeasonWasActive = deletingSeason?.["@key"] === activeSeason?.["@key"];
          const remainingSeasons = seasons.filter(
            season => season["@key"] !== deletingSeason?.["@key"],
          );

          setDeletingSeason(null);
          navigate({
            to: "/shows/$showId",
            params: { showId },
            search: {
              season: deletedSeasonWasActive ? remainingSeasons[0]?.number : activeSeason?.number,
            },
          });
        }}
        onOpenChange={open => {
          if (!open) {
            setDeletingSeason(null);
          }
        }}
        open={Boolean(deletingSeason)}
        season={deletingSeason}
      />
      <DeleteShowDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        show={show ?? null}
        onDeleted={() =>
          navigate({
            to: "/shows",
          })
        }
      />
    </main>
  );
}

function ShowHero({
  show,
  fallbackTitle,
  posterUrl,
  isLoading,
  isError,
  onEdit,
  onDelete,
}: {
  show?: TvShow;
  fallbackTitle: string;
  posterUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const heroTone = getHeroTone(show?.title ?? fallbackTitle);
  const sectionTone = posterUrl ? "bg-background" : heroTone;
  const scrollY = useWindowScrollY();
  const mobilePosterHeight = getMobilePosterHeight(scrollY);
  const mobilePosterWidth = (mobilePosterHeight * 2) / 3;
  const mobilePosterStyle = {
    "--mobile-poster-height": `${mobilePosterHeight}rem`,
    "--mobile-poster-width": `${mobilePosterWidth}rem`,
  } satisfies CSSProperties;

  return (
    <section className={`relative overflow-hidden border-b border-border ${sectionTone}`}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full blur-sm object-cover opacity-70"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/35 to-background" />
      <div className="relative mx-auto flex min-h-[24rem] w-full max-w-7xl flex-col justify-end gap-6 px-4 py-10 md:min-h-[28rem] md:flex-row md:items-end">
        <div
          className="h-[var(--mobile-poster-height)] w-[var(--mobile-poster-width)] shrink-0 self-center md:h-[22rem] md:w-[15rem] md:self-auto"
          style={mobilePosterStyle}
        >
          {posterUrl ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-background/20 shadow-2xl">
              <img
                src={posterUrl}
                alt={`${show?.title ?? fallbackTitle} poster`}
                className="h-full w-full object-cover md:h-[22rem] md:w-[15rem]"
              />
            </div>
          ) : (
            <div
              className={`h-full w-full rounded-[1.75rem] border border-background/20 shadow-2xl md:h-[22rem] md:w-[15rem] ${heroTone}`}
            />
          )}
        </div>

        <div className="max-w-3xl space-y-4 md:pb-2">
          <p className="text-shadow-sm text-xs font-semibold tracking-[0.24em] uppercase text-white/80">
            Show Detail
          </p>
          {isLoading ? <Skeleton className="h-12 w-3/4 bg-background/20" /> : null}
          {!isLoading ? (
            <h1 className="display-title text-4xl font-bold text-shadow-md text-white md:text-6xl">
              {show?.title ?? fallbackTitle}
            </h1>
          ) : null}
          {isLoading ? <Skeleton className="h-20 w-full max-w-2xl bg-background/20" /> : null}
          {!isLoading ? (
            <p className="max-w-2xl text-sm leading-7 text-shadow-sm text-white/88 md:text-base">
              {show?.description ?? "No description available."}
            </p>
          ) : null}
          {isError ? (
            <p className="text-sm font-medium text-shadow-sm text-white/80">
              Failed to load this show.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 md:ml-auto md:self-end">
          <Button variant="secondary" onClick={onEdit} disabled={!show}>
            Edit Show
          </Button>
          <Button variant="secondary" onClick={onDelete} disabled={!show}>
            Delete Show
          </Button>
          <Button variant="outline" disabled>
            + Watchlist
          </Button>
        </div>
      </div>
    </section>
  );
}

function useWindowScrollY() {
  return useSyncExternalStore(subscribeToWindowScroll, getWindowScrollY, () => 0);
}

function subscribeToWindowScroll(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("scroll", onStoreChange, { passive: true });
  window.addEventListener("resize", onStoreChange, { passive: true });

  return () => {
    window.removeEventListener("scroll", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}

function getWindowScrollY() {
  if (typeof window === "undefined") {
    return 0;
  }

  return window.scrollY;
}

function getMobilePosterHeight(scrollY: number) {
  const progress = clamp(scrollY / MOBILE_POSTER_SCROLL_RANGE_PX, 0, 1);
  return (
    MOBILE_POSTER_MAX_HEIGHT_REM -
    (MOBILE_POSTER_MAX_HEIGHT_REM - MOBILE_POSTER_MIN_HEIGHT_REM) * progress
  );
}

function EpisodeList({
  episodes,
  season,
  showId,
}: {
  episodes: Episode[];
  season?: Season;
  showId: string;
}) {
  if (!season) {
    return null;
  }

  if (episodes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="display-title text-2xl font-semibold text-foreground">No episodes yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Season {season.number} is ready for its first episode.
        </p>
        <Button className="mt-4" disabled>
          Add an Episode
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {episodes.map(episode => (
        <EpisodeRow key={episode["@key"]} episode={episode} season={season} showId={showId} />
      ))}
    </div>
  );
}

function EpisodeRow({
  episode,
  season,
  showId,
}: {
  episode: Episode;
  season: Season;
  showId: string;
}) {
  const { imageUrl: stillUrl } = useTMDB(episode.title, "still");

  return (
    <Link
      to="/shows/$showId/episodes/$episode"
      params={{
        showId,
        episode: `s${season.number}e${episode.episodeNumber}`,
      }}
      className="block"
    >
      <article className="grid gap-4 rounded-3xl border border-border bg-card/80 p-4 transition-colors hover:bg-card md:grid-cols-[10rem_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          {stillUrl ? (
            <img
              src={stillUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 ${getEpisodeTone(episode.title)}`} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-foreground/30 via-transparent to-transparent" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              Episode {episode.episodeNumber}
            </span>
            {episode.rating !== undefined ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-primary">
                Rating {episode.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{episode.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{episode.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
            <span>{formatDate(episode.releaseDate)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SeasonTabsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-border bg-card/80 p-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-28 rounded-full" />
      ))}
    </div>
  );
}

function EpisodeListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-3xl border border-border bg-card/80 p-4 md:grid-cols-[10rem_1fr]"
        >
          <Skeleton className="aspect-video rounded-2xl" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySeasonState({
  disabled,
  onAddSeason,
}: {
  disabled: boolean;
  onAddSeason: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <p className="display-title text-2xl font-semibold text-foreground">No seasons yet</p>
      <p className="mt-2 text-sm text-muted-foreground">This show is ready for its first season.</p>
      <Button className="mt-4" disabled={disabled} onClick={onAddSeason}>
        Add a Season
      </Button>
    </div>
  );
}

function getActiveSeason(seasons: Season[], requestedSeason?: number) {
  if (requestedSeason) {
    return seasons.find(season => season.number === requestedSeason) ?? seasons[0];
  }

  return seasons[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getHeroTone(seed: string) {
  const tones = [
    "bg-gradient-to-br from-primary via-chart-4 to-foreground",
    "bg-gradient-to-br from-chart-2 via-primary to-chart-3",
    "bg-gradient-to-br from-chart-4 via-foreground to-primary",
    "bg-gradient-to-br from-primary via-chart-3 to-chart-1",
  ];

  return tones[Math.abs(hashString(seed)) % tones.length];
}

function getEpisodeTone(seed: string) {
  const tones = [
    "bg-gradient-to-br from-primary/80 via-chart-4/80 to-foreground/80",
    "bg-gradient-to-br from-chart-2/80 via-primary/70 to-chart-3/80",
    "bg-gradient-to-br from-chart-4/70 via-foreground/70 to-primary/70",
    "bg-gradient-to-br from-primary/70 via-chart-3/70 to-chart-1/80",
  ];

  return tones[Math.abs(hashString(seed)) % tones.length];
}

function hashString(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return hash;
}
