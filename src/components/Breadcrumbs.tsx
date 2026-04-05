import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { cn } from "#/lib/utils.ts";

interface Crumb {
  label: string;
  href: string;
}

function useBreadcrumbs(): Crumb[] {
  const matches = useMatches();

  return matches
    .filter(m => {
      const staticCrumb = (m.staticData as Record<string, unknown> | undefined)?.crumb;
      const loaderCrumb = (m.loaderData as Record<string, unknown> | undefined)?.crumb;
      return staticCrumb !== undefined || loaderCrumb !== undefined;
    })
    .map(m => ({
      label: String(
        (m.loaderData as Record<string, unknown> | undefined)?.crumb ??
          (m.staticData as Record<string, unknown> | undefined)?.crumb,
      ),
      href: m.pathname,
    }));
}

export function Breadcrumbs() {
  const crumbs = useBreadcrumbs();

  if (crumbs.length === 0) return null;

  const last = crumbs[crumbs.length - 1];
  const rest = crumbs.slice(0, -1);

  return (
    <div
      className={cn(
        "border-b border-border bg-background/60 py-2",
        rest.length === 0 && "hidden md:block",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 md:pl-5">
        {/* Mobile: immediate parent only */}
        {rest.length > 0 && (
          <Link
            to={rest[rest.length - 1].href as never}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:hidden"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            <span>{rest[rest.length - 1].label}</span>
          </Link>
        )}

        {/* Desktop: full trail */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {rest.map(crumb => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem key={crumb.href}>
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href as never}>{crumb.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{last.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
