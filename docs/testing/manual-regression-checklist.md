# Manual Regression Checklist

Use this checklist before release or after broad UI changes. The automated suite covers core business logic, validation, and route flows; this document covers the remaining visual, responsive, and live-integration checks that are brittle or low-value in jsdom.

## Shell and Navigation

- Verify login layout polish and spacing on desktop and mobile.
- Verify protected routes redirect unauthenticated users to `/login`.
- Verify logout returns the user to `/login`.
- Verify desktop navbar and mobile bottom tabs render on the expected breakpoints.
- Verify breadcrumbs show the full trail on desktop and the immediate parent on mobile.

## Shows

- Verify `/shows` initial loading skeleton looks correct.
- Verify `/shows` debounced search feels stable and does not flood the API.
- Verify infinite scrolling appends naturally and does not jump the page unexpectedly.
- Verify show cards hover correctly without clipping on the home dashboard and browse page.
- Verify the show empty state and no-results state feel polished on desktop and mobile.
- Verify show create and edit flows succeed against the live API.
- Verify cascade deleting a show displays the full task list and progress updates.
- Verify cascade deleting a show removes related watchlist entries, episodes, and seasons in the expected order.

## Show Detail, Seasons, and Episodes

- Verify the show hero poster renders correctly from TMDB and the mobile poster shrink effect feels natural.
- Verify long season labels on mobile remain readable.
- Verify season add, edit, and cascade delete work against the live API.
- Verify season deletion progress stays visible until completion.
- Verify episode rows reveal actions cleanly on desktop.
- Verify episode action menus open correctly on mobile.
- Verify episode add, edit, and delete work against the live API.

## Episode Detail

- Verify episode stills come from the correct show and episode, including anime-style flattened season numbering edge cases.
- Verify missing-episode and malformed-episode routes show the focused error state with the correct back button.
- Verify blockchain history expands and collapses correctly.
- Verify long transaction IDs wrap correctly.
- Verify JSON toggle per history entry opens and closes as expected.

## Watchlists

- Verify watchlist browse cards keep consistent heights across varied content.
- Verify watchlist mosaic artwork renders correctly for:
  - empty watchlists
  - 1 show
  - 2-3 shows
  - 4 shows
  - more than 4 shows
- Verify the `+N more` overlay on mosaics shows the correct remainder.
- Verify watchlist create, edit, and delete work against the live API.
- Verify watchlist detail empty state copy and CTA still make sense.
- Verify removing a show from a watchlist updates the detail page immediately.
- Verify the `Add Show` dialog excludes already-added shows and bulk add feels correct.
- Verify the `+ Watchlist` membership picker opens as a dropdown on desktop and a sheet on mobile.

## Home Dashboard

- Verify the recent carousel poster treatment reads correctly on desktop and mobile.
- Verify carousel description clamping and text contrast remain legible.
- Verify carousel navigation buttons and pagination pills switch slides cleanly.
- Verify the TV shows strip and watchlists strip snap and scroll smoothly.
- Verify the `See more` tiles align visually with their neighboring cards.

## TMDB and Live Integrations

- Verify TMDB posters render for show cards, show hero, watchlist artwork, and home dashboard.
- Verify missing TMDB data falls back to gradients without layout collapse.
- Verify auth interceptor behavior with real credentials.
- Verify backend ordering limitations on `/shows` are still acceptable after API changes.

## Dialogs and Sheets

- Verify `Credenza` behaves like a bottom sheet on mobile and a centered dialog on desktop.
- Verify alert dialogs keep the larger mobile button treatment only on mobile.
- Verify dialog buttons and footers never clip against the container edge.

## Release Gate

Before merging a release branch:

- Run `pnpm lint`
- Run `pnpm build`
- Run `pnpm test`
- Complete the relevant manual checks above for any changed slice
