import type { ComponentProps } from "react";

import { cn } from "#/lib/utils";

function Command({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="command"
      className={cn("flex flex-col overflow-hidden rounded-[1.5rem] bg-transparent", className)}
      {...props}
    />
  );
}

function CommandInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="command-input"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-background/70 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15",
        className,
      )}
      {...props}
    />
  );
}

function CommandList({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="command-list"
      className={cn("mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="command-empty"
      className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="command-group" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function CommandItem({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="command-item"
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-foreground transition-colors outline-none hover:bg-foreground/6 focus-visible:bg-foreground/6",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="command-separator"
      className={cn("my-1 h-px bg-border/70", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
