# GoLedger Challenge — TV Shows Catalogue (Write final piece in Brazilian Portuguese)

## Stack

- **Framework:** Vite + TanStack Router (file-based routing, full type safety)
- **UI:** shadcn/ui + Tailwind CSS (custom preset)
- **Data fetching:** TanStack Query + Axios (Basic Auth interceptor)
- **Forms:** React Hook Form + Zod
- **State:** Zustand (poster cache with persistence)
- **Images:** TMDB API
- **Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions → AWS Elastic Beanstalk
- **Devtools** JetBrains Webstorm + Claude Code

## How to run

## Git strategy

- [ ] Trunk-based development — short-lived `feat/` and `chore/` branches off `master`, merged via PR. `master` is always deployable. No long-lived branches.

## Architecture decisions

- [ ] Why Vite + TanStack Router over Next.js
- [ ] Authentication strategy: Basic Auth via a client-managed `js-cookie` credential cookie, credential gate layout (plain `lib/auth.ts` for outside-React contexts like `beforeLoad` guards + Axios interceptor; `useAuth` hook for React-aware actions like logout with cache invalidation)
- [ ] No code generation (Orval) — manual types from getSchema
- [ ] Responsive CRUD modals: Dialog on desktop, Sheet on mobile (Credenza)
- [ ] No Zustand for auth/user state — the API has no user profile; credentials live in a cookie which is already the source of truth. A store would shadow it with no benefit. Zustand is used only for TMDB poster caching where a persistent cross-session cache has clear value.
- [ ] TMDB poster caching via Zustand persist
- [ ] Blockchain history panel on episode detail pages
- [ ] Cursor-based pagination (CouchDB bookmark)
- [ ] Create-delete pattern for key changes (show title / episode number): some fields are part of the blockchain asset identity, so “renames” cannot be plain updates and currently require creating the new asset plus deleting the old one. Explain tradeoffs and the follow-up cascading-rename chore.
- [ ] Claude integrations using skills for a comprehensive plan based on extensive stack and project decision session (Highlight `/grill-me`)

## Compromises & production notes

- [ ] Credentials stored in client-side cookies — in production this would be an HttpOnly cookie set by a BFF/server
- [ ] TMDB API key exposed as `VITE_TMDB_API_KEY` — in production would be proxied server-side

## Deployment

- [ ] CI/CD pipeline walkthrough
- [ ] AWS Elastic Beanstalk setup
