import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

interface EmptyStateProps {
  action?: ReactNode;
  className?: string;
  description: string;
  icon: ReactNode;
  title: string;
}

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-4xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-border bg-background/85 shadow-sm">
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <h2 className="display-title mt-5 text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
