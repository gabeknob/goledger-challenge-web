import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bookmark01Icon,
  Cancel01Icon,
  Search01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { DeleteWatchlistDialog } from "#/components/DeleteWatchlistDialog";
import { EmptyState } from "#/components/EmptyState";
import { WatchlistCard, WatchlistCardSkeleton } from "#/components/WatchlistCard";
import { WatchlistFormDialog } from "#/components/WatchlistFormDialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { useShows } from "#/hooks/useShows";
import { useWatchlists } from "#/hooks/useWatchlists";
import type { Watchlist } from "#/types/watchlist";

export const Route = createFileRoute("/_auth/watchlists/")({
  component: WatchlistsPage,
});

type SortOrder = "az" | "za";

export function WatchlistsPage() {
  const navigate = useNavigate();
  const { data: shows = [] } = useShows();
  const { data: watchlists, isError, isLoading } = useWatchlists();
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [deletingWatchlist, setDeletingWatchlist] = useState<Watchlist | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("az");
  const allWatchlists = watchlists ?? [];
  const showTitleByKey = new Map(shows.map(show => [show["@key"], show.title]));
  const filteredWatchlists = allWatchlists
    .filter(watchlist => watchlist.title.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => {
      if (sort === "az") {
        return left.title.localeCompare(right.title);
      }

      return right.title.localeCompare(left.title);
    });

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="display-title text-3xl font-bold text-foreground">Watchlists</h1>
            <p className="mt-2 pl-1 text-sm text-muted-foreground">
              Organize shows into personal lists you can come back to later.
            </p>
          </div>
          <Button onClick={() => setCreatingWatchlist(true)}>New Watchlist</Button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search watchlists..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="pl-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            ) : null}
          </div>

          <Select value={sort} onValueChange={value => setSort(value as SortOrder)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={SortByUp01Icon} className="size-4" />
                  Alphabetical Asc.
                </span>
              </SelectItem>
              <SelectItem value="za">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={SortByDown01Icon} className="size-4" />
                  Alphabetical Desc.
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <p className="text-sm text-destructive">Failed to load watchlists. Please try again.</p>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <WatchlistCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && filteredWatchlists.length === 0 ? (
          <div className="py-2">
            {search ? (
              <EmptyState
                icon={<HugeiconsIcon icon={Search01Icon} className="size-6" />}
                title={`No watchlists matching "${search}"`}
                description="Try a different name or clear the search to bring your saved collections back into view."
                action={
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Clear search
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={<HugeiconsIcon icon={Bookmark01Icon} className="size-6" />}
                title="No watchlists yet"
                description="Create your first watchlist to start grouping shows by mood, genre, weekend plans, or anything else."
                action={
                  <Button onClick={() => setCreatingWatchlist(true)}>Create watchlist</Button>
                }
              />
            )}
          </div>
        ) : null}

        {!isLoading && !isError && filteredWatchlists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredWatchlists.map(watchlist => (
              <WatchlistCard
                key={watchlist["@key"]}
                itemTitles={(watchlist.tvShows ?? []).map(show => {
                  return showTitleByKey.get(show["@key"]) ?? "Unknown show";
                })}
                watchlist={watchlist}
                onDelete={setDeletingWatchlist}
                onEdit={setEditingWatchlist}
              />
            ))}
          </div>
        ) : null}
      </main>

      <WatchlistFormDialog
        existingWatchlists={allWatchlists}
        mode="create"
        onOpenChange={setCreatingWatchlist}
        open={creatingWatchlist}
      />
      <WatchlistFormDialog
        existingWatchlists={allWatchlists}
        mode="edit"
        onOpenChange={open => {
          if (!open) {
            setEditingWatchlist(null);
          }
        }}
        onSubmitted={title => {
          setEditingWatchlist(null);
          void navigate({
            to: "/watchlists/$title",
            params: { title },
          });
        }}
        open={Boolean(editingWatchlist)}
        watchlist={editingWatchlist}
      />
      <DeleteWatchlistDialog
        onOpenChange={open => {
          if (!open) {
            setDeletingWatchlist(null);
          }
        }}
        open={Boolean(deletingWatchlist)}
        watchlist={deletingWatchlist}
      />
    </>
  );
}
