import { Link } from "@tanstack/react-router";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ResponsiveActionMenu } from "#/components/ResponsiveActionMenu";
import { Card, CardContent } from "#/components/ui/card";
import { useTMDB } from "#/hooks/useTMDB";
import { Skeleton } from "#/components/ui/skeleton";
import type { Watchlist } from "#/types/watchlist";

interface WatchlistCardProps {
  itemTitles?: string[];
  onDelete: (watchlist: Watchlist) => void;
  onEdit: (watchlist: Watchlist) => void;
  watchlist: Watchlist;
}

export function WatchlistCard({
  itemTitles = [],
  onDelete,
  onEdit,
  watchlist,
}: WatchlistCardProps) {
  const showsCount = watchlist.tvShows?.length ?? 0;
  const countLabel = showsCount === 1 ? "1 show" : `${showsCount} shows`;
  const visibleItems = itemTitles.slice(0, 2);
  const remainingCount = Math.max(itemTitles.length - visibleItems.length, 0);

  return (
    <Card className="group relative overflow-hidden rounded-4xl border border-border bg-card/80 pt-0 transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <ResponsiveActionMenu
          title="Watchlist actions"
          description={`Manage ${watchlist.title}`}
          triggerClassName="size-6 rounded-full bg-background/85 opacity-100 shadow-sm backdrop-blur md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
          actions={[
            {
              label: "Edit",
              onSelect: () => onEdit(watchlist),
              icon: <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />,
            },
            {
              label: "Delete",
              onSelect: () => onDelete(watchlist),
              destructive: true,
              icon: <HugeiconsIcon icon={Delete02Icon} className="size-4" />,
            },
          ]}
        />
      </div>

      <Link
        to="/watchlists/$title"
        params={{ title: encodeURIComponent(watchlist.title) }}
        className="flex h-[22.5rem] flex-col"
      >
        <WatchlistArtwork itemTitles={itemTitles} title={watchlist.title} />
        <CardContent className="relative z-10 flex flex-1 flex-col gap-3 p-4 pt-0">
          <div className="relative z-10 -mt-10 mb-1 flex">
            <div className="size-20 overflow-hidden rounded-3xl border border-card-foreground/12 shadow-2xl">
              <WatchlistCover itemTitles={itemTitles} title={watchlist.title} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="line-clamp-2 text-lg font-semibold text-foreground">
              {watchlist.title}
            </h2>
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
              {countLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleItems.length > 0 ? (
              <>
                {visibleItems.map(title => (
                  <span
                    key={title}
                    className="max-w-full rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span className="block max-w-28 truncate">{title}</span>
                  </span>
                ))}
                {remainingCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    +{remainingCount} more
                  </span>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No shows added yet.</p>
            )}
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {watchlist.description?.trim() || "No description yet."}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}

function WatchlistArtwork({ itemTitles, title }: { itemTitles: string[]; title: string }) {
  const posterTitles = itemTitles.slice(0, 4);
  const hasMosaic = posterTitles.length >= 4;
  const hasSplitArtwork = posterTitles.length >= 2 && posterTitles.length < 4;
  const backgroundTitles = hasMosaic
    ? posterTitles
    : hasSplitArtwork
      ? posterTitles.slice(0, 2)
      : posterTitles.slice(0, 1);
  const fallbackTone = getPosterFallbackTone(title);
  const hasArtwork = backgroundTitles.length > 0;

  return (
    <div className={`relative h-28 overflow-hidden ${hasArtwork ? "bg-background" : fallbackTone}`}>
      <div className="absolute inset-0 scale-110 blur-sm saturate-120">
        {hasArtwork ? (
          hasSplitArtwork ? (
            <WatchlistPosterSplit posterTitles={backgroundTitles} />
          ) : (
            <WatchlistPosterGrid
              posterTitles={backgroundTitles}
              overflowCount={0}
              tiled={hasMosaic}
            />
          )
        ) : null}
      </div>
      <div className="absolute inset-0 bg-foreground/25" />
      <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-background/18 to-transparent" />
    </div>
  );
}

function WatchlistCover({ itemTitles, title }: { itemTitles: string[]; title: string }) {
  const posterTitles = itemTitles.slice(0, 4);
  const hasMosaic = posterTitles.length >= 4;
  const hasSplitCover = posterTitles.length >= 2 && posterTitles.length < 4;
  const coverTitles = hasMosaic ? posterTitles : posterTitles.slice(0, 1);
  const overflowCount = Math.max(itemTitles.length - 3, 0);

  if (coverTitles.length === 0) {
    return <WatchlistEmptyCover title={title} />;
  }

  if (hasSplitCover) {
    return <WatchlistPosterSplit posterTitles={posterTitles.slice(0, 2)} />;
  }

  return (
    <WatchlistPosterGrid
      posterTitles={coverTitles}
      overflowCount={overflowCount}
      tiled={hasMosaic}
    />
  );
}

function WatchlistPosterSplit({ posterTitles }: { posterTitles: string[] }) {
  return (
    <div className="grid size-full grid-cols-2 gap-px bg-background/35">
      {posterTitles.map((posterTitle, index) => (
        <PosterTile key={`${posterTitle}-${index}`} title={posterTitle} />
      ))}
    </div>
  );
}

function WatchlistEmptyCover({ title }: { title: string }) {
  return (
    <div className="flex size-full items-end bg-background/95">
      <div className="flex size-full items-end rounded-none bg-muted p-0">
        <span className="p-0 text-sm font-semibold text-foreground pb-3 line-clamp-3 pl-3">
          {title}
        </span>
      </div>
    </div>
  );
}

function WatchlistPosterGrid({
  overflowCount,
  posterTitles,
  tiled,
}: {
  overflowCount: number;
  posterTitles: string[];
  tiled: boolean;
}) {
  if (!tiled) {
    return (
      <div className="size-full">
        <PosterTile title={posterTitles[0]} />
      </div>
    );
  }

  return (
    <div className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-background/35">
      {posterTitles.map((posterTitle, index) => (
        <PosterTile
          key={`${posterTitle}-${index}`}
          title={posterTitle}
          overlayLabel={index === 3 && overflowCount > 0 ? `+${overflowCount}` : undefined}
        />
      ))}
    </div>
  );
}

function PosterTile({ overlayLabel, title }: { overlayLabel?: string; title: string }) {
  const { imageUrl } = useTMDB(title);
  const fallbackTone = getPosterFallbackTone(title);

  return (
    <div className={`relative size-full overflow-hidden ${fallbackTone}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          loading="lazy"
        />
      ) : null}
      {overlayLabel ? (
        <>
          <div className="absolute inset-0 bg-foreground/65" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-background text-shadow-sm">
              {overlayLabel}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

function getPosterFallbackTone(title: string) {
  const fallbackTones = [
    "bg-gradient-to-br from-primary via-chart-3 to-chart-2",
    "bg-gradient-to-br from-chart-4 via-primary to-secondary",
    "bg-gradient-to-br from-chart-2 via-chart-4 to-primary",
    "bg-gradient-to-br from-foreground via-chart-4 to-primary",
  ];

  let hash = 0;
  for (const character of title) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return fallbackTones[Math.abs(hash) % fallbackTones.length];
}

export function WatchlistCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-4xl border border-border bg-card/80 pt-0">
      <div className="h-28 bg-muted/50" />
      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <div className="-mt-10 mb-1">
          <Skeleton className="size-20 rounded-3xl" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-20" />
        <div className="mt-2 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <Skeleton className="mt-auto h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}
