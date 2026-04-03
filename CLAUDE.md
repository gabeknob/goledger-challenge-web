# GoLedger Challenge — CLAUDE.md

## Project overview

IMDB-like TV Shows catalogue built on a Hyperledger Fabric blockchain API. Full CRUD on TV Shows, Seasons, Episodes, and Watchlists.

## Stack

- **Vite + TanStack Router** (file-based routing, `src/routes/`)
- **shadcn/ui + Tailwind CSS** (custom preset from shadcn/create)
- **TanStack Query** for data fetching and cache
- **Axios** with a single configured instance in `src/lib/api.ts`
- **React Hook Form + Zod** for all forms
- **Zustand + persist** for TMDB poster cache
- **Vitest + React Testing Library** for tests
- **js-cookie** for credential storage

## API

- Base URL: `http://ec2-50-19-36-138.compute-1.amazonaws.com/api`
- Auth: HTTP Basic Auth — `Authorization: Basic btoa(user:pass)` on every request
- All writes: `POST /invoke/createAsset`, `PUT /invoke/updateAsset`, `DELETE /invoke/deleteAsset`
- All reads: `POST /query/readAsset`, `POST /query/readAssetHistory`, `POST /query/search`
- Search uses CouchDB Mango selectors with cursor-based pagination (`bookmark`)
- `deleteAsset` is a DELETE with a request body — handled by Axios

## Asset schemas (confirmed via getSchema)

- **tvShows** — key: `name` (string). Fields: `name`, `description`
- **seasons** — composite key: `(number, tvShow→name)`. Fields: `number`, `tvShow`, `year`
- **episodes** — composite key: `(season→(number, tvShow), episodeNumber)`. Fields: `season`, `episodeNumber`, `title`, `releaseDate`, `description`, `rating` (optional)
- **watchlist** — key: `title` (string). Fields: `title`, `description`, `tvShows` (array of tvShow key refs)

## Route structure

```
/login                                                        — public, credential entry
/_auth                                                        — layout: credential gate
/_auth/                                                       — home dashboard
/_auth/shows                                                  — browse + search + sort
/_auth/shows/$showId                                          — show detail + season tabs (?season=N)
/_auth/shows/$showId/episodes/$episode                        — episode detail (s3e10 format)
/_auth/watchlists                                             — all watchlists
/_auth/watchlists/$title                                      — watchlist detail
```

- `/login` `beforeLoad`: redirect to `/_auth/` if credentials exist in cookie
- `/_auth` layout `beforeLoad`: redirect to `/login` if no credentials
- `$episode` param format: `s{seasonNumber}e{episodeNumber}` (e.g. `s3e10`)
- Malformed `$episode` param → per-route `errorComponent` with message + "Back to home" button
- Season context on show detail page is a search param `?season=N`, not a route segment

## Auth pattern

- Credentials stored in cookies via `js-cookie` (not localStorage — intentional architectural signal)
- Axios instance in `src/lib/api.ts` reads cookie and sets `Authorization` header via request interceptor
- On logout: clear cookie, invalidate React Query cache, redirect to `/login`

## Folder structure (type-based)

```
src/
  components/
    ui/          # shadcn primitives
  hooks/         # custom React hooks
  lib/
    api.ts       # axios instance
    queryClient.ts
  routes/        # TanStack Router file-based routes
  stores/        # Zustand stores
  types/         # TypeScript interfaces for all asset types
  schemas/       # Zod validation schemas
  __tests__/     # Vitest + RTL tests
```

## Navigation & layout

- **Desktop:** top navbar (logo left, Home/Shows/Watchlists links, logout right)
- **Mobile:** top navbar collapses + fixed bottom tab bar (Home, Shows, Watchlists, + action)
- **Breadcrumbs:** rendered on all pages below home (`Shows / Breaking Bad / s3e10`). On mobile, collapses to immediate parent only ("← Breaking Bad")

## Home page (`/_auth/`)

- **Carousel (top):** most recently added shows, TMDB poster as full-bleed background, clickable to show detail
- **TV Shows row:** horizontal scrollable strip, alphabetical, "View all →" links to `/shows`
- **Watchlists row:** horizontal strip of watchlist cards (title, description, show count)
- All three sections load independently with separate React Query calls + skeletons

## Shows browse page (`/_auth/shows`)

- Search bar + sort controls (A→Z, Z→A, newest first)
- Client-side filtering/sorting — fetch all shows once, filter in memory
- "New Show" button top-right of page header
- Grid of show cards (poster + title + season count + one-line description)
- Overflow `...` menu on each card for Edit and Delete

## Show detail page (`/_auth/shows/$showId`)

- **Hero section:** full-width TMDB poster (blurred background), show title, description, Edit button, Delete button, "+ Watchlist" button (popover)
- **Watchlist popover:** lists all watchlists with checkboxes (pre-checked if show already in list), "New watchlist" shortcut at bottom
- **Season tabs:** tab strip showing "Season 1", "Season 2" etc. — active tab controlled by `?season=N` search param
- **Episode list:** full-width list items per episode (title, description, release date, rating, TMDB thumbnail if available)
- **"Add Season" button:** top-right of seasons section
- **Episode actions:** edit/delete icons appear on hover (long-press on mobile) on each episode list item
- **"Add Episode" button:** at the bottom of the episode list

## Episode detail page (`/_auth/shows/$showId/episodes/$episode`)

- Header: TMDB still thumbnail, title, season/episode number, release date, rating, description
- Edit and Delete buttons in header
- **Blockchain history panel:** collapsible section, shows full on-chain audit trail (timestamp, tx type, data snapshot per entry) via `readAssetHistory`

## Watchlist pages

- `/watchlists`: grid of watchlist cards, "New Watchlist" button top-right, overflow menu for edit/delete
- `/watchlists/$title`: header with title, description, Edit/Delete buttons; grid of show cards in this list

## CRUD UX pattern

- **Create/Edit:** Credenza component (Dialog on desktop, Sheet on mobile)
- **Delete:** AlertDialog for confirmation — never one click away
- Never navigate away to a separate edit page — all mutations happen in-place
- **Duplicate validation:** all create forms prefetch the relevant existing list and use Zod `.superRefine()` to validate uniqueness client-side (e.g. no duplicate season numbers, episode numbers, show names, watchlist titles). API 409 is the final safety net.

## Empty states

- All empty lists show an illustrated empty state with a contextual CTA button (e.g. "Add your first show")
- Search with no results shows "No shows matching '[query]'" + "Clear search" link — no create CTA

## Images

- TMDB API (`VITE_TMDB_API_KEY` env var) for show posters and episode stills
- Zustand `persist` store maps `title.toLowerCase()` → `posterUrl | null`
- `null` = already checked, no result — prevents repeated failed fetches
- Fallback: deterministic gradient when no TMDB result found

## Error handling

- **Zod + React Hook Form:** inline field errors
- **React Query `isError`:** in-page error callout/card
- **Sonner toasts:** mutation success/failure feedback
- **Axios response interceptor:** catches network-level errors globally → fires generic toast

## Blockchain history panel

- Available on episode detail pages via `POST /query/readAssetHistory`
- Rendered as a collapsible section showing the full chain of changes
- Key differentiator — don't skip it

## Testing

- Vitest for unit tests (Zod schemas, pure helpers, auth module)
- React Testing Library for component tests (login form, one create form, one delete dialog)
- No E2E / Playwright

## Environment variables

```
VITE_API_BASE_URL=http://ec2-50-19-36-138.compute-1.amazonaws.com/api
VITE_TMDB_API_KEY=your_key_here
```

Never commit `.env.local`. Document in README.

## CI/CD

- GitHub Actions: run Vitest → `pnpm build` → deploy to AWS Elastic Beanstalk
- Serve `dist/` via nginx Dockerfile on t4g.micro/small
- API URL and TMDB key stored as GitHub Actions secrets
