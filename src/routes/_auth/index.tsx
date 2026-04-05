import { useState, type ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";

import { WatchlistCard } from "#/components/WatchlistCard";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useTMDB } from "#/hooks/useTMDB";
import { useShows } from "#/hooks/useShows";
import { api } from "#/lib/api";
import type { SearchResponse, TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});

const recentShowsQueryKey = ["home", "recentShows"] as const;
const alphabeticalShowsQueryKey = ["home", "alphabeticalShows"] as const;
const homeWatchlistsQueryKey = ["home", "watchlists"] as const;
const HOME_ALPHABETICAL_SHOWS_LIMIT = 10;

export function HomePage() {
  const { data: shows = [] } = useShows();
  const recentShowsQuery = useQuery({
    queryKey: recentShowsQueryKey,
    queryFn: fetchRecentShows,
  });
  const alphabeticalShowsQuery = useQuery({
    queryKey: alphabeticalShowsQueryKey,
    queryFn: fetchAlphabeticalShows,
  });
  const watchlistsQuery = useQuery({
    queryKey: homeWatchlistsQueryKey,
    queryFn: fetchHomeWatchlists,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const recentShows = recentShowsQuery.data ?? [];
  const showTitleByKey = new Map(shows.map(show => [show["@key"], show.title]));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <CarouselSection
        activeIndex={activeIndex}
        isError={recentShowsQuery.isError}
        isLoading={recentShowsQuery.isLoading}
        onActiveIndexChange={setActiveIndex}
        shows={recentShows}
      />

      <HorizontalShowsSection
        isError={alphabeticalShowsQuery.isError}
        isLoading={alphabeticalShowsQuery.isLoading}
        shows={alphabeticalShowsQuery.data ?? []}
      />

      <HorizontalWatchlistsSection
        isError={watchlistsQuery.isError}
        isLoading={watchlistsQuery.isLoading}
        watchlists={watchlistsQuery.data ?? []}
        showTitleByKey={showTitleByKey}
      />
    </main>
  );
}

async function fetchRecentShows(): Promise<TvShow[]> {
  const { data } = await api.post<SearchResponse<TvShow>>("/query/search", {
    query: {
      selector: {
        "@assetType": "tvShows",
      },
      limit: 12,
    },
  });

  return [...data.result]
    .sort((left, right) => {
      return (
        new Date(right["@lastUpdated"] ?? 0).getTime() -
        new Date(left["@lastUpdated"] ?? 0).getTime()
      );
    })
    .slice(0, 5);
}

async function fetchAlphabeticalShows(): Promise<TvShow[]> {
  const { data } = await api.post<SearchResponse<TvShow>>("/query/search", {
    query: {
      selector: {
        "@assetType": "tvShows",
      },
      limit: HOME_ALPHABETICAL_SHOWS_LIMIT,
    },
  });

  return [...data.result].sort((left, right) => left.title.localeCompare(right.title));
}

async function fetchHomeWatchlists(): Promise<Watchlist[]> {
  const { data } = await api.post<SearchResponse<Watchlist>>("/query/search", {
    query: {
      selector: {
        "@assetType": "watchlist",
      },
      limit: 16,
    },
  });

  return [...data.result].sort((left, right) => left.title.localeCompare(right.title));
}

function CarouselSection({
  activeIndex,
  isError,
  isLoading,
  onActiveIndexChange,
  shows,
}: {
  activeIndex: number;
  isError: boolean;
  isLoading: boolean;
  onActiveIndexChange: (index: number) => void;
  shows: TvShow[];
}) {
  const activeShow = shows[activeIndex] ?? null;
  const { imageUrl } = useTMDB(activeShow?.title ?? "", "poster");

  if (isLoading) {
    return <CarouselSkeleton />;
  }

  if (isError) {
    return (
      <DashboardSection
        eyebrow="Recently Added"
        title="Cinematic picks"
        description="Failed to load the latest shows."
      />
    );
  }

  if (shows.length === 0 || !activeShow) {
    return (
      <DashboardSection
        eyebrow="Recently Added"
        title="Cinematic picks"
        description="Add a few shows to turn this space into a spotlight carousel."
        action={
          <Button asChild>
            <Link to="/shows">Create your first show</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <Link
        to="/shows/$showId"
        params={{ showId: encodeURIComponent(activeShow.title) }}
        search={{ season: undefined }}
        className="relative block min-h-[24rem] md:min-h-[30rem]"
      >
        <div className={`absolute inset-0 ${getCarouselTone(activeShow.title)}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${activeShow.title} poster`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-background/88 via-background/62 to-background/28 md:from-card/98 md:via-card/78 md:to-card/28" />
        <div className="absolute inset-0 bg-linear-to-t from-background/84 via-background/60 to-background/38 md:from-card/96 md:via-card/20 md:to-transparent" />
        <div className="absolute inset-0 bg-black/18 md:bg-black/15" />

        <div className="relative flex min-h-[24rem] flex-col justify-between p-6 md:min-h-[30rem] md:p-8">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
              Recently Added
            </p>
            <h1 className="display-title text-4xl font-bold text-foreground text-shadow-sm md:text-6xl">
              {activeShow.title}
            </h1>
            <p className="line-clamp-5 max-w-xl text-sm leading-7 text-foreground text-shadow-sm md:text-base">
              {activeShow.description}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onActiveIndexChange((activeIndex - 1 + shows.length) % shows.length);
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                <span className="sr-only">Previous show</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onActiveIndexChange((activeIndex + 1) % shows.length);
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                <span className="sr-only">Next show</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {shows.map((show, index) => (
                <button
                  key={show["@key"]}
                  type="button"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onActiveIndexChange(index);
                  }}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? "w-10 bg-foreground" : "w-2.5 bg-foreground/30"
                  }`}
                >
                  <span className="sr-only">Go to {show.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function HorizontalShowsSection({
  isError,
  isLoading,
  shows,
}: {
  isError: boolean;
  isLoading: boolean;
  shows: TvShow[];
}) {
  const hasMoreShows = shows.length === HOME_ALPHABETICAL_SHOWS_LIMIT;

  return (
    <DashboardSection
      eyebrow="TV Shows"
      title="Alphabetical strip"
      description="A quick-access row of the full catalogue, sorted alphabetically."
      action={
        <Button asChild variant="outline">
          <Link to="/shows">
            View all
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <HorizontalShowSkeletons />
      ) : isError ? (
        <SectionMessage>Could not load the TV shows strip.</SectionMessage>
      ) : shows.length === 0 ? (
        <SectionMessage actionLabel="Create a show" actionTo="/shows">
          No shows yet. Add your first title to start building the dashboard.
        </SectionMessage>
      ) : (
        <div className="-mx-4 -mt-3 overflow-x-auto px-4">
          <div className="flex gap-4 pb-2 pt-4">
            {shows.map(show => (
              <HomeShowCard key={show["@key"]} show={show} />
            ))}
            {hasMoreShows ? <SeeMoreShowsCard /> : null}
          </div>
        </div>
      )}
    </DashboardSection>
  );
}

function HorizontalWatchlistsSection({
  isError,
  isLoading,
  showTitleByKey,
  watchlists,
}: {
  isError: boolean;
  isLoading: boolean;
  showTitleByKey: Map<string, string>;
  watchlists: Watchlist[];
}) {
  const visibleWatchlists = watchlists.slice(0, 4);
  const hasMoreWatchlists = watchlists.length > visibleWatchlists.length;

  return (
    <DashboardSection
      eyebrow="Watchlists"
      title="Personal collections"
      description="A horizontal row of your watchlists with their current sizes."
    >
      {isLoading ? (
        <HorizontalWatchlistSkeletons />
      ) : isError ? (
        <SectionMessage>Could not load the watchlists strip.</SectionMessage>
      ) : watchlists.length === 0 ? (
        <SectionMessage actionLabel="Create a watchlist" actionTo="/watchlists">
          No watchlists yet. Create one to start grouping shows by mood, genre, or occasion.
        </SectionMessage>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex snap-x snap-mandatory gap-4 pb-2">
            {visibleWatchlists.map(watchlist => (
              <div key={watchlist["@key"]} className="w-[18rem] shrink-0 snap-start">
                <WatchlistCard
                  itemTitles={(watchlist.tvShows ?? []).map(show => {
                    return showTitleByKey.get(show["@key"]) ?? "Unknown show";
                  })}
                  watchlist={watchlist}
                  onDelete={() => {}}
                  onEdit={() => {}}
                  showActions={false}
                />
              </div>
            ))}
            {hasMoreWatchlists ? (
              <Card className="w-[18rem] shrink-0 snap-start overflow-hidden rounded-4xl border border-dashed border-border bg-card/80 pt-0 transition-shadow hover:shadow-md">
                <Link to="/watchlists" className="flex h-[22.5rem] flex-col p-5">
                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
                        More to explore
                      </p>
                      <h3 className="display-title text-2xl font-semibold text-foreground">
                        See all watchlists
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {watchlists.length} collections are already in your library.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      Open browse
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </div>
                  </div>
                </Link>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </DashboardSection>
  );
}

function DashboardSection({
  action,
  children,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-card/70 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="display-title text-3xl font-bold text-foreground">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

function SectionMessage({
  actionLabel,
  actionTo,
  children,
}: {
  actionLabel?: string;
  actionTo?: "/shows" | "/watchlists";
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-background/60 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{children}</p>
      {actionLabel && actionTo ? (
        <Button className="mt-4" asChild>
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function HomeShowCard({ show }: { show: TvShow }) {
  const { imageUrl } = useTMDB(show.title);

  return (
    <Link
      to="/shows/$showId"
      params={{ showId: encodeURIComponent(show.title) }}
      search={{ season: undefined }}
      className="group w-[11rem] shrink-0"
    >
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm transition-transform duration-200 group-hover:-translate-y-1">
        <div className={`relative aspect-[2/3] ${getCarouselTone(show.title)}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${show.title} poster`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="line-clamp-2 text-sm font-semibold text-foreground text-shadow-sm">
              {show.title}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SeeMoreShowsCard() {
  return (
    <Card className="aspect-[2/3] w-[11rem] shrink-0 overflow-hidden rounded-[1.5rem] border border-dashed border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to="/shows" className="flex h-full flex-col justify-between p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-muted-foreground">
            More to browse
          </p>
          <h3 className="display-title text-2xl font-semibold text-foreground">See more</h3>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            Open the full catalogue to keep exploring your shows.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          View all
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
        </div>
      </Link>
    </Card>
  );
}

function CarouselSkeleton() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="min-h-[24rem] animate-pulse rounded-[1.5rem] bg-muted/50 md:min-h-[30rem]" />
    </section>
  );
}

function HorizontalShowSkeletons() {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-4 pb-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="w-[11rem] shrink-0">
            <Skeleton className="aspect-[2/3] rounded-[1.5rem]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalWatchlistSkeletons() {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-4 pb-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-[16rem] shrink-0">
            <Skeleton className="h-64 rounded-[1.75rem]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getCarouselTone(seed: string) {
  const tones = [
    "bg-gradient-to-br from-primary via-chart-3 to-chart-2",
    "bg-gradient-to-br from-chart-4 via-primary to-secondary",
    "bg-gradient-to-br from-chart-2 via-chart-4 to-primary",
    "bg-gradient-to-br from-foreground via-chart-4 to-primary",
  ];

  let hash = 0;
  for (const character of seed) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return tones[Math.abs(hash) % tones.length];
}
