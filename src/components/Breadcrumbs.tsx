import { Link, useMatches } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import {cn} from "#/lib/utils.ts";

interface Crumb {
  label: string
  href: string
}

function useBreadcrumbs(): Crumb[] {
  const matches = useMatches()

  return matches
    .filter((m) => {
      const staticCrumb = (m.staticData as Record<string, unknown> | undefined)?.crumb
      const loaderCrumb = (m.loaderData as Record<string, unknown> | undefined)?.crumb
      return staticCrumb !== undefined || loaderCrumb !== undefined
    })
    .map((m) => ({
      label: String(
        (m.loaderData as Record<string, unknown> | undefined)?.crumb ??
          (m.staticData as Record<string, unknown> | undefined)?.crumb,
      ),
      href: m.pathname,
    }))
}

export function Breadcrumbs() {
  const crumbs = useBreadcrumbs()

  if (crumbs.length === 0) return null

  const last = crumbs[crumbs.length - 1]
  const rest = crumbs.slice(0, -1)

  return (
    <div className={cn("border-b border-border bg-background/60 px-4 py-2", rest.length === 0 && "hidden md:block")}>
      <div className="mx-auto max-w-5xl">
        {/* Mobile: immediate parent only */}
        {rest.length > 0 && (
          <Link
            to={rest[rest.length - 1].href as never}
            className="text-sm text-muted-foreground hover:text-foreground md:hidden"
          >
            ← {rest[rest.length - 1].label}
          </Link>
        )}

        {/* Desktop: full trail */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {rest.map((crumb, i) => (
              <BreadcrumbItem key={i}>
                <BreadcrumbLink asChild>
                  <Link to={crumb.href as never}>{crumb.label}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            ))}
            <BreadcrumbItem>
              <BreadcrumbPage>{last.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  )
}
