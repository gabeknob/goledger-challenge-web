import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown01Icon,
  Calendar03Icon,
  Delete02Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { DeleteEpisodeDialog } from "#/components/DeleteEpisodeDialog";
import { EpisodeFormDialog } from "#/components/EpisodeFormDialog";
import { RouteErrorState } from "#/components/RouteErrorState";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { useEpisode, useEpisodeHistory, useEpisodes, useShow } from "#/hooks/useShowDetail";
import type { EpisodeHistoryEntry } from "#/types/episode";
import { useTMDB } from "#/hooks/useTMDB";

const EPISODE_PARAM_PATTERN = /^s(\d+)e(\d+)$/i;

export const Route = createFileRoute("/_auth/shows/$showId/episodes/$episode")({
  beforeLoad: ({ params }) => {
    parseEpisodeParam(params.episode);
  },
  loader: ({ params }) => {
    const parsed = parseEpisodeParam(params.episode);

    return {
      crumb: parsed.label,
      episodeNumber: parsed.episodeNumber,
      seasonNumber: parsed.seasonNumber,
    };
  },
  errorComponent: EpisodeParamError,
  component: EpisodeDetailPage,
});

function EpisodeDetailPage() {
  const { showId } = Route.useParams();
  const { episodeNumber, seasonNumber } = Route.useLoaderData();
  const decodedShowId = decodeURIComponent(showId);
  const navigate = Route.useNavigate();
  const [editingEpisodeOpen, setEditingEpisodeOpen] = useState(false);
  const [deletingEpisodeOpen, setDeletingEpisodeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: show, isError: isShowError, isLoading: isShowLoading } = useShow(decodedShowId);
  const {
    data: episode,
    error: episodeError,
    isError: isEpisodeError,
    isLoading: isEpisodeLoading,
  } = useEpisode(show?.["@key"], seasonNumber, episodeNumber);
  const { imageUrl: stillUrl } = useTMDB(episode?.title ?? "", "still");
  const { data: siblingEpisodes = [] } = useEpisodes(episode ? [episode.season["@key"]] : []);
  const {
    data: historyEntries = [],
    error: historyError,
    isError: isHistoryError,
    isLoading: isHistoryLoading,
  } = useEpisodeHistory(episode);

  if (!isShowLoading && isShowError) {
    return (
      <RouteErrorState
        actionLabel="Back to shows"
        description="This TV show doesn't exist or may have been removed."
        onAction={() =>
          navigate({
            to: "/shows",
          })
        }
        title="TV show not found"
      />
    );
  }

  if (!isEpisodeLoading && isEpisodeError) {
    return (
      <RouteErrorState
        actionLabel={`Back to ${decodedShowId}`}
        description={
          episodeError instanceof Error
            ? episodeError.message
            : "This episode doesn't exist or may have been removed."
        }
        onAction={() =>
          navigate({
            to: "/shows/$showId",
            params: { showId },
            search: { season: seasonNumber },
            resetScroll: false,
          })
        }
        title="Episode not found"
      />
    );
  }

  return (
    <main className="pb-16 md:pb-10">
      <EpisodeHeader
        episode={episode ?? null}
        seasonNumber={seasonNumber}
        stillUrl={stillUrl}
        showTitle={decodedShowId}
        isLoading={isEpisodeLoading}
        onDelete={() => setDeletingEpisodeOpen(true)}
        onEdit={() => setEditingEpisodeOpen(true)}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="grid gap-4 md:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]">
          <EpisodeDescriptionCard episode={episode ?? null} isLoading={isEpisodeLoading} />
          <EpisodeMetaCard
            episode={episode ?? null}
            showTitle={decodedShowId}
            isLoading={isEpisodeLoading}
          />
        </section>
        <EpisodeHistoryPanel
          entries={historyEntries}
          error={historyError}
          isError={isHistoryError}
          isLoading={isHistoryLoading}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      </div>

      <EpisodeFormDialog
        existingEpisodes={siblingEpisodes}
        mode="edit"
        onOpenChange={setEditingEpisodeOpen}
        onSubmitted={nextEpisodeNumber =>
          navigate({
            to: "/shows/$showId/episodes/$episode",
            params: {
              showId,
              episode: buildEpisodeParam(seasonNumber, nextEpisodeNumber),
            },
            resetScroll: false,
          })
        }
        open={editingEpisodeOpen}
        episode={episode ?? null}
        season={episode?.season ?? null}
      />
      <DeleteEpisodeDialog
        episode={episode ?? null}
        onDeleted={() =>
          navigate({
            to: "/shows/$showId",
            params: { showId },
            search: { season: seasonNumber },
            resetScroll: false,
          })
        }
        onOpenChange={setDeletingEpisodeOpen}
        open={deletingEpisodeOpen}
      />
    </main>
  );
}

function EpisodeHeader({
  episode,
  seasonNumber,
  stillUrl,
  showTitle,
  isLoading,
  onDelete,
  onEdit,
}: {
  episode: {
    description: string;
    episodeNumber: number;
    rating?: number;
    releaseDate: string;
    title: string;
  } | null;
  seasonNumber: number;
  stillUrl: string | null;
  showTitle: string;
  isLoading: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      {stillUrl ? (
        <img
          src={stillUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover blur-sm opacity-60"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background" />

      <div className="relative mx-auto grid min-h-[23rem] w-full max-w-6xl gap-6 px-4 py-8 md:min-h-[26rem] md:grid-cols-[18rem_minmax(0,1fr)] md:items-end">
        <div className="relative aspect-video overflow-hidden rounded-4xl border border-background/20 shadow-2xl md:aspect-[4/5]">
          {isLoading ? (
            <Skeleton className="size-full rounded-none bg-background/20" />
          ) : stillUrl ? (
            <img
              src={stillUrl}
              alt={`${episode?.title ?? "Episode"} still`}
              className="size-full object-cover"
            />
          ) : (
            <div className={`size-full ${getEpisodeTone(episode?.title ?? showTitle)}`} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-foreground/40 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col gap-4 pb-1">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.24em] uppercase text-white/75">
              Episode Detail
            </p>
            {isLoading ? <Skeleton className="h-12 w-2/3 bg-background/20" /> : null}
            {!isLoading ? (
              <h1 className="display-title text-4xl font-bold text-white text-shadow-md md:text-6xl">
                {episode?.title}
              </h1>
            ) : null}
            {isLoading ? <Skeleton className="h-6 w-44 bg-background/20" /> : null}
            {!isLoading && episode ? (
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white/85 text-shadow-sm">
                <span className="rounded-full bg-background/18 px-3 py-1.5 backdrop-blur-sm">
                  Season {seasonNumber}
                </span>
                <span className="rounded-full bg-background/18 px-3 py-1.5 backdrop-blur-sm">
                  Episode {episode.episodeNumber}
                </span>
                <span className="rounded-full bg-background/18 px-3 py-1.5 backdrop-blur-sm">
                  {formatDate(episode.releaseDate)}
                </span>
                {episode.rating !== undefined ? (
                  <span className="rounded-full bg-background/18 px-3 py-1.5 backdrop-blur-sm">
                    Rating {episode.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onEdit} disabled={!episode}>
              <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
              Edit Episode
            </Button>
            <Button variant="secondary" onClick={onDelete} disabled={!episode}>
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              Delete Episode
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EpisodeDescriptionCard({
  episode,
  isLoading,
}: {
  episode: {
    description: string;
  } | null;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-4xl border border-border bg-card/80 p-6">
      <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
        Synopsis
      </p>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-foreground/90">
          {episode?.description ?? "No description available."}
        </p>
      )}
    </section>
  );
}

function EpisodeMetaCard({
  episode,
  showTitle,
  isLoading,
}: {
  episode: {
    "@lastTx"?: string;
    "@lastUpdated"?: string;
    episodeNumber: number;
    rating?: number;
    releaseDate: string;
  } | null;
  showTitle: string;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-4xl border border-border bg-card/80 p-6">
      <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
        Metadata
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mt-4 grid gap-4">
          <MetaRow label="Show" value={showTitle} />
          <MetaRow label="Episode" value={`Episode ${episode?.episodeNumber ?? "—"}`} />
          <MetaRow
            label="Release date"
            value={formatDate(episode?.releaseDate)}
            icon={Calendar03Icon}
          />
          <MetaRow
            label="Rating"
            value={episode?.rating !== undefined ? episode.rating.toFixed(1) : "Not rated"}
          />
          <MetaRow label="Latest transaction" value={episode?.["@lastTx"] ?? "Unknown"} />
          <MetaRow label="Last updated" value={formatDateTime(episode?.["@lastUpdated"])} />
        </dl>
      )}
    </section>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: typeof Calendar03Icon;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/60 px-4 py-3">
      <dt className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
        {icon ? <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" /> : null}
        <span>{value}</span>
      </dd>
    </div>
  );
}

function EpisodeHistoryPanel({
  entries,
  error,
  isError,
  isLoading,
  open,
  onOpenChange,
}: {
  entries: EpisodeHistoryEntry[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <section className="rounded-4xl border border-border bg-card/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => onOpenChange(!open)}
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">
            Blockchain History
          </p>
          <p className="mt-2 text-sm text-foreground/85">
            {isLoading ? "Loading on-chain history..." : `${entries.length} recorded entries`}
          </p>
        </div>
        <span
          className={`rounded-full border border-border bg-background/70 p-2 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
        </span>
      </button>

      {open ? (
        <div className="border-t border-border px-6 py-5">
          {isLoading ? <HistorySkeleton /> : null}
          {isError ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Could not load blockchain history."}
            </p>
          ) : null}
          {!isLoading && !isError && entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blockchain history was found.</p>
          ) : null}
          {!isLoading && !isError && entries.length > 0 ? (
            <div className="flex flex-col gap-4">
              {entries.map(entry => (
                <HistoryEntryCard key={`${entry._txId}-${entry._timestamp}`} entry={entry} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function HistoryEntryCard({ entry }: { entry: EpisodeHistoryEntry }) {
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  return (
    <article className="rounded-3xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-primary">
              {entry._isDelete ? "deleteAsset" : (entry["@lastTx"] ?? "unknown")}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(entry._timestamp)}
            </span>
          </div>
          <p className="mt-3 break-words text-xs font-medium text-muted-foreground">
            TX {entry._txId}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sm:shrink-0"
          onClick={() => setIsSnapshotOpen(open => !open)}
        >
          {isSnapshotOpen ? "Hide JSON snapshot" : "Show JSON snapshot"}
        </Button>
      </div>
      {isSnapshotOpen ? (
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-border/70 bg-card px-4 py-3 text-xs leading-6 text-foreground">
          {JSON.stringify(getHistorySnapshot(entry), null, 2)}
        </pre>
      ) : null}
    </article>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-border/70 bg-background/60 p-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="mt-3 h-4 w-52" />
          <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

function EpisodeParamError() {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-[0.7rem] font-semibold tracking-[0.24em] uppercase text-muted-foreground">
        Invalid Episode URL
      </p>
      <h1 className="display-title mt-4 text-3xl font-bold text-foreground">
        This episode path is malformed
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Episode URLs should follow the format <code>s3e10</code>.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </main>
  );
}

function parseEpisodeParam(value: string) {
  const match = EPISODE_PARAM_PATTERN.exec(value);

  if (!match) {
    throw new Error('Episode URL must follow the "s3e10" format.');
  }

  const seasonNumber = Number(match[1]);
  const episodeNumber = Number(match[2]);

  return {
    episodeNumber,
    label: buildEpisodeParam(seasonNumber, episodeNumber).toUpperCase(),
    seasonNumber,
  };
}

function buildEpisodeParam(seasonNumber: number, episodeNumber: number) {
  return `s${seasonNumber}e${episodeNumber}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEpisodeTone(seed: string) {
  const tones = [
    "bg-gradient-to-br from-primary/80 via-chart-4/80 to-foreground/80",
    "bg-gradient-to-br from-chart-2/80 via-primary/70 to-chart-3/80",
    "bg-gradient-to-br from-chart-4/70 via-foreground/70 to-primary/70",
    "bg-gradient-to-br from-primary/70 via-chart-3/70 to-chart-1/80",
  ];

  return tones[Math.abs(hashString(seed)) % tones.length];
}

function getHistorySnapshot(entry: EpisodeHistoryEntry) {
  const snapshot = { ...entry };

  delete snapshot._isDelete;
  delete snapshot._timestamp;
  delete snapshot._txId;

  return snapshot;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}
