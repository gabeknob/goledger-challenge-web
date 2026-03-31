# GoLedger Challenge — TV Shows Catalogue

## Stack

- **Framework:** Vite + TanStack Router (file-based routing, full type safety)
- **UI:** shadcn/ui + Tailwind CSS (custom preset)
- **Data fetching:** TanStack Query + Axios (Basic Auth interceptor)
- **Forms:** React Hook Form + Zod
- **State:** Zustand (poster cache with persistence)
- **Images:** TMDB API
- **Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions → AWS Elastic Beanstalk

## How to run

## Architecture decisions

- [ ] Why Vite + TanStack Router over Next.js
- [ ] Authentication strategy: Basic Auth via cookies, credential gate layout
- [ ] No code generation (Orval) — manual types from getSchema
- [ ] Responsive CRUD modals: Dialog on desktop, Sheet on mobile (Credenza)
- [ ] TMDB poster caching via Zustand persist
- [ ] Blockchain history panel on episode detail pages
- [ ] Cursor-based pagination (CouchDB bookmark)

## Compromises & production notes

- [ ] Credentials stored in client-side cookies — in production this would be an HttpOnly cookie set by a BFF/server
- [ ] TMDB API key exposed as `VITE_TMDB_API_KEY` — in production would be proxied server-side

## Deployment

- [ ] CI/CD pipeline walkthrough
- [ ] AWS Elastic Beanstalk setup
