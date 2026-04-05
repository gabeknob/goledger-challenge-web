import { useMemo, useState } from "react";
import { Add01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { WatchlistFormDialog } from "#/components/WatchlistFormDialog";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "#/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Button } from "#/components/ui/button";
import { useUpdateWatchlist, useWatchlists } from "#/hooks/useWatchlists";
import { getApiErrorMessage } from "#/lib/api/errors";
import type { TvShowReference } from "#/types/season";
import type { TvShow } from "#/types/tvShow";

interface WatchlistMembershipPopoverProps {
  show: TvShow | undefined;
}

export function WatchlistMembershipPopover({ show }: WatchlistMembershipPopoverProps) {
  const { data: watchlists = [] } = useWatchlists();
  const updateWatchlist = useUpdateWatchlist();
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const showKey = show?.["@key"];

  const filteredWatchlists = useMemo(() => {
    return watchlists.filter(watchlist =>
      watchlist.title.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [search, watchlists]);

  async function toggleMembership(title: string, checked: boolean) {
    if (!show) {
      return;
    }

    const watchlist = watchlists.find(entry => entry.title === title);
    if (!watchlist) {
      return;
    }

    const currentItems = watchlist.tvShows ?? [];
    const nextTvShows = checked
      ? dedupeTvShows([
          ...currentItems,
          {
            "@assetType": "tvShows" as const,
            "@key": show["@key"],
          },
        ])
      : currentItems.filter(reference => reference["@key"] !== show["@key"]);

    try {
      await updateWatchlist.mutateAsync({
        current: watchlist,
        next: {
          title: watchlist.title,
          description: watchlist.description ?? "",
          tvShows: nextTvShows,
        },
      });

      toast.success(
        checked
          ? `Added "${show.title}" to "${watchlist.title}".`
          : `Removed "${show.title}" from "${watchlist.title}".`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update the watchlist membership."));
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button disabled={!show}>+ Watchlist</Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="mx-2 w-[22rem]">
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl bg-popover">
              <CommandInput
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search watchlists..."
                aria-label="Search watchlists"
              />
            </div>

            <div className="overflow-hidden rounded-2xl bg-popover/95 ring-1 ring-border/70">
              <CommandList className="mt-0 max-h-64 gap-0 p-1">
                {filteredWatchlists.length === 0 ? (
                  <CommandEmpty>No watchlists matching your search.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredWatchlists.map(watchlist => {
                      const containsShow = watchlist.tvShows?.some(
                        reference => reference["@key"] === showKey,
                      );
                      const isChecked = Boolean(showKey && containsShow);

                      return (
                        <CommandItem
                          key={watchlist["@key"]}
                          className="justify-between"
                          onClick={() => toggleMembership(watchlist.title, !isChecked)}
                        >
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {watchlist.title}
                          </span>
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              isChecked
                                ? "border-chart-3/60 bg-chart-3/15 text-chart-3"
                                : "border-border bg-background text-transparent"
                            }`}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </div>

            <div className="rounded-2xl bg-popover/95">
              <CommandSeparator />
            </div>

            <div className="rounded-2xl bg-popover pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start gap-2 rounded-2xl px-2 text-sm"
                onClick={() => {
                  setOpen(false);
                  setCreatingWatchlist(true);
                }}
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                New watchlist
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <WatchlistFormDialog
        existingWatchlists={watchlists}
        mode="create"
        onOpenChange={setCreatingWatchlist}
        open={creatingWatchlist}
      />
    </>
  );
}

function dedupeTvShows(tvShows: TvShowReference[]) {
  return tvShows.filter((reference, index, array) => {
    return array.findIndex(entry => entry["@key"] === reference["@key"]) === index;
  });
}
