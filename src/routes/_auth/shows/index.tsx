import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/shows/')({
  staticData: { crumb: 'Shows' },
  component: ShowsPage,
})

function ShowsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="display-title text-3xl font-bold text-foreground">Shows</h1>
      <p className="mt-2 text-muted-foreground">Coming in slice 4.</p>
    </main>
  )
}
