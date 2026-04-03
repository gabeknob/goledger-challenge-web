import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/shows/$showId/episodes/$episode')({
  component: EpisodeDetailPage,
})

function EpisodeDetailPage() {
  const { showId, episode } = Route.useParams()
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="display-title text-3xl font-bold text-foreground">
        {showId} — {episode}
      </h1>
      <p className="mt-2 text-muted-foreground">Coming in slice 10.</p>
    </main>
  )
}
