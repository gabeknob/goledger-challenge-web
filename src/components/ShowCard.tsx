import { Link } from "@tanstack/react-router";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

  return (
    <Card className="group relative flex flex-col pt-0 overflow-hidden transition-shadow hover:shadow-md">
      <Link to="/shows/$showId" params={{ showId }} className="flex flex-col flex-1">
        <div className="aspect-[2/3] w-full bg-muted" />
        <CardContent className="flex flex-1 flex-col gap-1 p-3">
          <p className="line-clamp-1 font-semibold leading-snug">{show.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{show.description}</p>
        </CardContent>
      </Link>

      <div className="absolute right-2 top-2">
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

export function ShowCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className="aspect-[2/3] w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
