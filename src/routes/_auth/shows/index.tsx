import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Cancel01Icon,
  Search01Icon,
  SortByDown01Icon,
  SortByUp01Icon,
  Tv01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DeleteShowDialog } from "#/components/DeleteShowDialog";
import { EmptyState } from "#/components/EmptyState";
import { ShowFormDialog } from "#/components/ShowFormDialog";
import { ShowCard, ShowCardSkeleton } from "#/components/ShowCard";
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
import type { TvShow } from "#/types/tvShow";

export const Route = createFileRoute("/_auth/shows/")({
  component: ShowsPage,
});

type SortOrder = "az" | "za";

function ShowsPage() {
  const { data: shows, isLoading, isError } = useShows();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("az");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShow, setEditingShow] = useState<TvShow | null>(null);
  const [deletingShow, setDeletingShow] = useState<TvShow | null>(null);

  const filtered = (shows ?? [])
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
  const allShows = shows ?? [];

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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>
          )}
        </div>

        <Select value={sort} onValueChange={v => setSort(v as SortOrder)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="az">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={SortByUp01Icon} size={15} />
                Alphabetical Asc.
              </span>
            </SelectItem>
            <SelectItem value="za">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={SortByDown01Icon} size={15} />
                Alphabetical Desc.
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load shows. Please try again.</p>
      )}

      {isLoading && (
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map(show => (
            <ShowCard
              key={show["@key"]}
              show={show}
              onEdit={setEditingShow}
              onDelete={setDeletingShow}
            />
          ))}
        </div>
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
