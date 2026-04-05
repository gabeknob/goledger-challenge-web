import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { DeleteWatchlistDialog } from "#/components/DeleteWatchlistDialog";
import { EmptyState } from "#/components/EmptyState";
import { RouteErrorState } from "#/components/RouteErrorState";
import { WatchlistAddShowsDialog } from "#/components/WatchlistAddShowsDialog";
import { WatchlistFormDialog } from "#/components/WatchlistFormDialog";
import { WatchlistShowCard } from "#/components/WatchlistShowCard";
import { Button } from "#/components/ui/button";
import { useShows } from "#/hooks/useShows";
import { useUpdateWatchlist, useWatchlist, useWatchlists } from "#/hooks/useWatchlists";
import { getApiErrorMessage } from "#/lib/api-errors";
import type { TvShow } from "#/types/tvShow";

export const Route = createFileRoute("/_auth/watchlists/$title")({
  loader: ({ params }) => ({
    crumb: decodeURIComponent(params.title),
  }),
  component: WatchlistDetailPage,
});

function WatchlistDetailPage() {
  const { title } = Route.useParams();
  const decodedTitle = decodeURIComponent(title);
  const navigate = Route.useNavigate();
  const { data: allWatchlists = [] } = useWatchlists();
  const { data: watchlist, isError, isLoading } = useWatchlist(decodedTitle);
  const { data: shows = [] } = useShows();
  const updateWatchlist = useUpdateWatchlist();
  const [addingShows, setAddingShows] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState(false);
  const [deletingWatchlist, setDeletingWatchlist] = useState(false);

  const showMap = new Map(shows.map(show => [show["@key"], show]));
  const watchlistShows = (watchlist?.tvShows ?? [])
    .map(reference => showMap.get(reference["@key"]))
    .filter((show): show is TvShow => Boolean(show));
  const countLabel =
    watchlistShows.length === 1
      ? "1 show in this watchlist"
      : `${watchlistShows.length} shows in this watchlist`;

  async function removeShow(show: TvShow) {
    if (!watchlist) {
      return;
    }

    try {
      await updateWatchlist.mutateAsync({
        current: watchlist,
        next: {
          title: watchlist.title,
          description: watchlist.description ?? "",
          tvShows: (watchlist.tvShows ?? []).filter(
            reference => reference["@key"] !== show["@key"],
          ),
        },
      });

      toast.success(`Removed "${show.title}" from "${watchlist.title}".`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove the show from this watchlist."));
    }
  }

  if (!isLoading && isError) {
    return (
      <RouteErrorState
        actionLabel="Back to watchlists"
        description="This watchlist doesn't exist or may have been removed."
        onAction={() =>
          navigate({
            to: "/watchlists",
          })
        }
        title="Watchlist not found"
      />
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6">
          <section className="rounded-[2rem] border border-border bg-card/70 px-6 py-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Watchlist Detail
                </p>
                <h1 className="display-title text-4xl font-bold text-foreground md:text-5xl">
                  {isLoading ? "Loading..." : (watchlist?.title ?? decodedTitle)}
                </h1>
                {!isLoading ? (
                  <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    {countLabel}
                  </p>
                ) : null}
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  {watchlist?.description?.trim() || "No description for this watchlist yet."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAddingShows(true)} disabled={!watchlist}>
                  Add Show
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditingWatchlist(true)}
                  disabled={!watchlist}
                >
                  Edit Watchlist
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDeletingWatchlist(true)}
                  disabled={!watchlist}
                >
                  Delete Watchlist
                </Button>
              </div>
            </div>
          </section>

          {isLoading ? <p className="text-sm text-muted-foreground">Loading watchlist...</p> : null}

          {!isLoading && watchlist && watchlistShows.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Add01Icon} className="size-6" />}
              title="No shows yet"
              description="Pick shows from your catalogue to start building this watchlist."
              action={<Button onClick={() => setAddingShows(true)}>Add Show</Button>}
            />
          ) : null}

          {!isLoading && watchlistShows.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {watchlistShows.map(show => (
                <WatchlistShowCard key={show["@key"]} show={show} onRemove={removeShow} />
              ))}
            </div>
          ) : null}
        </div>
      </main>

      <WatchlistFormDialog
        existingWatchlists={allWatchlists}
        mode="edit"
        onOpenChange={setEditingWatchlist}
        onSubmitted={nextTitle => {
          navigate({
            to: "/watchlists/$title",
            params: { title: encodeURIComponent(nextTitle) },
            replace: true,
          });
        }}
        open={editingWatchlist}
        watchlist={watchlist ?? null}
      />
      <WatchlistAddShowsDialog
        onOpenChange={setAddingShows}
        open={addingShows}
        shows={shows}
        watchlist={watchlist ?? null}
      />

      <DeleteWatchlistDialog
        onDeleted={() =>
          navigate({
            to: "/watchlists",
          })
        }
        onOpenChange={setDeletingWatchlist}
        open={deletingWatchlist}
        watchlist={watchlist ?? null}
      />
    </>
  );
}
