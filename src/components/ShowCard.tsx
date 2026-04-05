import { Link } from "@tanstack/react-router";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTMDB } from "#/hooks/useTMDB";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import {
  DropdownMenuGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { TvShow } from "#/types/tvShow";

interface ShowCardProps {
  show: TvShow;
  onEdit: (show: TvShow) => void;
  onDelete: (show: TvShow) => void;
}

export function ShowCard({ show, onEdit, onDelete }: ShowCardProps) {
  const showId = encodeURIComponent(show.title);
  const { imageUrl } = useTMDB(show.title);
  const fallbackTone = getPosterFallbackTone(show.title);

  return (
    <Card className="group relative flex h-92 flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <Link
        to="/shows/$showId"
        params={{ showId }}
        search={{ season: undefined }}
        className="flex flex-1 flex-col"
      >
        <div className={`relative aspect-[2/3] w-full overflow-hidden ${fallbackTone}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${show.title} poster`}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
        <CardContent className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-2 text-xs text-muted-foreground">{show.description}</p>
        </CardContent>
      </Link>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
              onClick={e => e.preventDefault()}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
              <span className="sr-only">Options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onEdit(show)}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(show)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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

export function ShowCardSkeleton() {
  return (
    <div className="flex h-92 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="aspect-[2/3] w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
