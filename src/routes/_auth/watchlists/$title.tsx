import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/watchlists/$title')({
  component: WatchlistDetailPage,
})

function WatchlistDetailPage() {
  const { title } = Route.useParams()
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="display-title text-3xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-muted-foreground">Coming in slice 12.</p>
    </main>
  )
}
