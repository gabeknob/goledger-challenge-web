import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { ResponsiveActionMenu } from "#/components/ResponsiveActionMenu";
import { Card, CardContent } from "#/components/ui/card";
import { useTMDB } from "#/hooks/useTMDB";
import type { TvShow } from "#/types/tvShow";

interface WatchlistShowCardProps {
  onRemove: (show: TvShow) => void;
  show: TvShow;
}

export function WatchlistShowCard({ onRemove, show }: WatchlistShowCardProps) {
  const showId = encodeURIComponent(show.title);
  const { imageUrl } = useTMDB(show.title);
  const fallbackTone = getPosterFallbackTone(show.title);

  return (
    <Card className="group relative overflow-hidden rounded-lg border border-border bg-card/80 pt-0 transition-shadow hover:shadow-md">
      <div className="absolute top-2 right-2 z-10">
        <ResponsiveActionMenu
          title="Show actions"
          description={`Manage ${show.title} in this watchlist`}
          triggerClassName="size-7 rounded-full bg-background/88 shadow-md backdrop-blur md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
          actions={[
            {
              label: "Remove from watchlist",
              onSelect: () => onRemove(show),
              destructive: true,
              icon: <HugeiconsIcon icon={Delete02Icon} className="size-4" />,
            },
          ]}
        />
      </div>

      <Link
        to="/shows/$showId"
        params={{ showId }}
        search={{ season: undefined }}
        className="flex flex-col"
      >
        <div className={`relative aspect-[3/4] overflow-hidden ${fallbackTone}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${show.title} poster`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-card/95 via-card/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="line-clamp-2 text-base font-semibold text-white text-shadow-md">
              {show.title}
            </h3>
          </div>
        </div>
        <CardContent className="p-4 pt-3">
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{show.description}</p>
        </CardContent>
      </Link>
    </Card>
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
