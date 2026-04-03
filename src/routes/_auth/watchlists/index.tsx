import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/watchlists/')({
  staticData: { crumb: 'Watchlists' },
  component: WatchlistsPage,
})

function WatchlistsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="display-title text-3xl font-bold text-foreground">Watchlists</h1>
      <p className="mt-2 text-muted-foreground">Coming in slice 11.</p>
    </main>
  )
}
