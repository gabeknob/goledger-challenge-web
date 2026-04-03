import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="display-title text-3xl font-bold text-foreground">Home</h1>
      <p className="mt-2 text-muted-foreground">Dashboard coming soon.</p>
    </main>
  );
}
