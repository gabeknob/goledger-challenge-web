import type { ReactNode } from "react";
import { MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "#/components/ui/sheet";
import { cn } from "#/lib/utils";

interface ResponsiveActionMenuItem {
  destructive?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}

interface ResponsiveActionMenuProps {
  actions: ResponsiveActionMenuItem[];
  className?: string;
  description?: string;
  title: string;
  triggerClassName?: string;
  triggerIconClassName?: string;
}

const defaultTriggerClassName =
  "rounded-full border border-muted-foreground/40 bg-muted text-muted-foreground shadow-xl hover:bg-muted/90 hover:text-muted-foreground";

export function ResponsiveActionMenu({
  actions,
  className,
  description,
  title,
  triggerClassName,
  triggerIconClassName,
}: ResponsiveActionMenuProps) {
  const trigger = (
    <Button
      size="icon"
      variant="ghost"
      className={cn(defaultTriggerClassName, triggerClassName)}
      onPointerDown={event => {
        event.stopPropagation();
      }}
      onClick={event => {
        event.stopPropagation();
      }}
    >
      <HugeiconsIcon icon={MoreHorizontalIcon} className={cn("size-4", triggerIconClassName)} />
      <span className="sr-only">{title}</span>
    </Button>
  );

  return (
    <div className={className}>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent className="h-auto max-h-[min(22rem,100svh)]">
            <SheetHeader className="pr-12">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </SheetHeader>
            <div className="flex flex-col gap-2">
              {actions.map(action => (
                <Button
                  key={action.label}
                  type="button"
                  variant={action.destructive ? "destructive" : "outline"}
                  className="h-11 justify-start gap-2 rounded-2xl px-4 text-sm"
                  onClick={action.onSelect}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuGroup>
              {actions.map(action => (
                <DropdownMenuItem
                  key={action.label}
                  variant={action.destructive ? "destructive" : undefined}
                  onSelect={event => {
                    event.preventDefault();
                    action.onSelect();
                  }}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
