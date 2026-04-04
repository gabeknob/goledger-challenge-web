import { Button } from "#/components/ui/button";

interface RouteErrorStateProps {
  actionLabel: string;
  description: string;
  onAction: () => void;
  title: string;
}

export function RouteErrorState({
  actionLabel,
  description,
  onAction,
  title,
}: RouteErrorStateProps) {
  return (
    <main className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">!</p>
      <h1 className="display-title mt-4 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <Button className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    </main>
  );
}
