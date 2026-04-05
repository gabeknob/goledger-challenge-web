import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Cancel01Icon, Search01Icon, Tv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { DeleteShowDialog } from "#/components/DeleteShowDialog";
import { EmptyState } from "#/components/EmptyState";
import { ShowFormDialog } from "#/components/ShowFormDialog";
import { ShowCard, ShowCardSkeleton } from "#/components/ShowCard";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useDebouncedState } from "#/hooks/useDebouncedState";
import { useShowsBrowse } from "#/hooks/useShows";
import type { TvShow } from "#/types/tvShow";

export function ShowsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TvShow | null>(null);
  const [deletingShow, setDeletingShow] = useState<TvShow | null>(null);
  const { debouncedValue: debouncedSearch, isDebouncing } = useDebouncedState(search.trim(), 500);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading } =
    useShowsBrowse(debouncedSearch);

  const shows = data?.pages.flatMap(page => page.items) ?? [];
  const filtered = shows;
  const allShows = shows;
  const lastShowRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();

      if (!node || !hasNextPage || isFetchingNextPage) {
        return;
      }

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting) {
            void fetchNextPage();
          }
        },
        {
          rootMargin: "0px 0px 40px 0px",
        },
      );

      observerRef.current.observe(node);
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="display-title text-3xl font-bold text-foreground">Shows</h1>
        <Button onClick={() => setIsCreateOpen(true)}>New Show</Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sticky flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search shows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          )}
        </div>
      </div>

      {isDebouncing ? (
        <p className="mb-4 text-xs font-medium text-muted-foreground">Updating results…</p>
      ) : null}

      {isError && (
        <p className="text-sm text-destructive">Failed to load shows. Please try again.</p>
      )}

      {isLoading && shows.length === 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <ShowCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-8">
          {search ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Search01Icon} className="size-6" />}
              title={`No shows matching "${search}"`}
              description="Try a different title or clear the current search to see your full catalogue again."
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
              icon={<HugeiconsIcon icon={Tv01Icon} className="size-6" />}
              title="No shows yet"
              description="Add your first show to start building your catalogue and unlock seasons, episodes, and watchlists."
              action={<Button onClick={() => setIsCreateOpen(true)}>Add your first show</Button>}
            />
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((show, index) => {
              const isLast = index === filtered.length - 1;

              return (
                <div key={show["@key"]} ref={isLast ? lastShowRef : undefined}>
                  <ShowCard show={show} onEdit={setEditingShow} onDelete={setDeletingShow} />
                </div>
              );
            })}
          </div>

          {isFetchingNextPage ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <ShowCardSkeleton key={index} />
              ))}
            </div>
          ) : null}
        </>
      )}

      <ShowFormDialog
        existingShows={allShows}
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <ShowFormDialog
        existingShows={allShows}
        mode="edit"
        open={Boolean(editingShow)}
        onOpenChange={open => {
          if (!open) {
            setEditingShow(null);
          }
        }}
        onSubmitted={title => {
          setEditingShow(null);
          void navigate({
            to: "/shows/$showId",
            params: { showId: title },
            search: { season: undefined },
          });
        }}
        show={editingShow}
      />

      <DeleteShowDialog
        open={Boolean(deletingShow)}
        onOpenChange={open => {
          if (!open) {
            setDeletingShow(null);
          }
        }}
        show={deletingShow}
      />
    </main>
  );
}
