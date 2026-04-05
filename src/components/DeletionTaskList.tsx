interface DeletionTaskListItem {
  id: string;
  label: string;
}

export type DeletionTaskStatus = "pending" | "running" | "completed" | "failed";

interface DeletionTaskListProps {
  tasks: DeletionTaskListItem[];
  statuses: Record<string, DeletionTaskStatus>;
  className?: string;
  showStatusLabel?: boolean;
}

export function DeletionTaskList({
  tasks,
  statuses,
  className,
  showStatusLabel = false,
}: DeletionTaskListProps) {
  return (
    <div className={className}>
      {tasks.map(task => {
        const status = statuses[task.id] ?? "pending";

        return (
          <div
            key={task.id}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-2 transition-colors ${
              status === "completed"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "failed"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : status === "running"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background/70 text-muted-foreground"
            }`}
          >
            <div
              className={`size-2.5 rounded-full ${
                status === "completed"
                  ? "bg-emerald-500"
                  : status === "failed"
                    ? "bg-destructive"
                    : status === "running"
                      ? "bg-chart-2"
                      : "bg-muted-foreground/40"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${status === "running" ? "text-primary" : ""}`}
              >
                {task.label}
              </p>
            </div>
            {showStatusLabel ? (
              <p
                className={`text-[0.65rem] font-semibold tracking-[0.16em] uppercase ${
                  status === "running" ? "text-chart-2" : ""
                }`}
              >
                {status === "completed"
                  ? "Done"
                  : status === "failed"
                    ? "Failed"
                    : status === "running"
                      ? "Deleting"
                      : "Queued"}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
