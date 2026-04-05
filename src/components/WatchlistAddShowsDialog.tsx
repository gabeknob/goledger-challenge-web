import { useMemo, useState } from "react";
import { Add01Icon, CheckmarkCircle02Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "#/components/Credenza";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import { Button } from "#/components/ui/button";
import { useTMDB } from "#/hooks/useTMDB";
import { useUpdateWatchlist } from "#/hooks/useWatchlists";
import { getApiErrorMessage } from "#/lib/api/errors";
import type { TvShowReference } from "#/types/season";
import type { TvShow } from "#/types/tvShow";
import type { Watchlist } from "#/types/watchlist";

interface WatchlistAddShowsDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  shows: TvShow[];
  watchlist: Watchlist | null;
}

export function WatchlistAddShowsDialog({
  onOpenChange,
  open,
  shows,
  watchlist,
}: WatchlistAddShowsDialogProps) {
  const updateWatchlist = useUpdateWatchlist();
  const [search, setSearch] = useState("");
  const [selectedShowKeys, setSelectedShowKeys] = useState<string[]>([]);

  const existingShowKeys = useMemo(() => {
    return new Set((watchlist?.tvShows ?? []).map(reference => reference["@key"]));
  }, [watchlist?.tvShows]);

  const availableShows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return shows
      .filter(show => !existingShowKeys.has(show["@key"]))
      .filter(show => show.title.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => left.title.localeCompare(right.title));
  }, [existingShowKeys, search, shows]);

  const selectedCount = selectedShowKeys.length;
  const actionLabel = selectedCount === 1 ? "Add 1 show" : `Add ${selectedCount} shows`;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("");
      setSelectedShowKeys([]);
    }

    onOpenChange(nextOpen);
  }

  function toggleSelection(showKey: string) {
    setSelectedShowKeys(current =>
      current.includes(showKey)
        ? current.filter(entry => entry !== showKey)
        : [...current, showKey],
    );
  }

  async function addSelectedShows() {
    if (!watchlist || selectedShowKeys.length === 0) {
      return;
    }

    const nextTvShows = dedupeTvShows([
      ...(watchlist.tvShows ?? []),
      ...selectedShowKeys.map(showKey => ({
        "@assetType": "tvShows" as const,
        "@key": showKey,
      })),
    ]);

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
        selectedShowKeys.length === 1
          ? `Added 1 show to "${watchlist.title}".`
          : `Added ${selectedShowKeys.length} shows to "${watchlist.title}".`,
      );

      handleOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not add the selected shows."));
    }
  }

  const isEmptyLibrary = shows.length === 0;
  const hasAvailableShows = availableShows.length > 0;
  const isPending = updateWatchlist.isPending;

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaContent className="md:max-w-[32rem]">
        <CredenzaHeader>
          <CredenzaTitle>Add Shows</CredenzaTitle>
          <CredenzaDescription>
            Search your catalogue and select one or more shows to add to this watchlist.
          </CredenzaDescription>
        </CredenzaHeader>

        <div className="flex flex-col gap-4">
          <Command className="overflow-visible">
            <CommandInput
              aria-label="Search shows"
              onChange={event => setSearch(event.target.value)}
              placeholder="Search TV shows..."
              value={search}
            />

            <CommandList className="mt-3 min-h-72 rounded-[1.5rem] border border-border bg-card/65 p-1">
              {isEmptyLibrary ? (
                <CommandEmpty className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background/80">
                      <HugeiconsIcon icon={Tv01Icon} className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No shows available yet</p>
                      <p className="text-sm text-muted-foreground">
                        Add shows to your catalogue first, then come back here to place them in a
                        watchlist.
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              ) : !hasAvailableShows ? (
                <CommandEmpty className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-background/80">
                      <HugeiconsIcon icon={Add01Icon} className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {search ? "No matching shows" : "Everything is already here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Try a different search to find another show from your catalogue."
                          : "This watchlist already contains every show currently available in your library."}
                      </p>
                    </div>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {availableShows.map(show => {
                    const isSelected = selectedShowKeys.includes(show["@key"]);

                    return (
                      <CommandItem
                        key={show["@key"]}
                        className={`justify-between ${isSelected ? "bg-foreground/6" : ""}`}
                        onClick={() => toggleSelection(show["@key"])}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <ShowPickerThumbnail title={show.title} />
                          <span className="min-w-0 flex-1 truncate font-medium">{show.title}</span>
                        </div>
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-chart-2/60 bg-chart-2/15 text-chart-2"
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
          </Command>

          <CredenzaFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={isPending || selectedCount === 0}
              type="button"
              onClick={addSelectedShows}
            >
              {isPending ? "Adding..." : actionLabel}
            </Button>
          </CredenzaFooter>
        </div>
      </CredenzaContent>
    </Credenza>
  );
}

function dedupeTvShows(tvShows: TvShowReference[]) {
  return tvShows.filter((reference, index, array) => {
    return array.findIndex(entry => entry["@key"] === reference["@key"]) === index;
  });
}

function ShowPickerThumbnail({ title }: { title: string }) {
  const { imageUrl } = useTMDB(title);

  return (
    <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-card">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`size-full ${getThumbnailTone(title)}`} />
      )}
    </div>
  );
}

function getThumbnailTone(seed: string) {
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
