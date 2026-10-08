# Route failure recovery

All entries share `src/entry/createEntry.tsx`. Keep a root `RouteErrorBoundary` around the app and a route boundary in `src/shared/router/LazyRoute.tsx`. Page failures must leave the dashboard navigation mounted. Changing pathname or search resets the page boundary; reloading is a user action, never an automatic loop.

Use Kumo Banner and Button for the failure state. Do not expose exception messages, API payloads, or account data in the notice. Error boundaries handle rendering and lazy imports, not event handlers or asynchronous mutations; existing query/mutation error handling stays in place. Do not retry payments or other writes as part of route recovery.

Route prefetch is optional. Failed imports must be removed from the prefetch cache and must not reject an unobserved event-handler promise. Actual navigation owns loading/error presentation. A failed browser module can still require an explicit reload; clearing the prefetch map does not clear the browser's module cache.

`GET /admin/v1/points/stats` may return `sources: null` when no records exist. `PointsStats` declares that shape; the dashboard maps an empty array and displays a Chinese empty state instead of throwing. Keep statistics and navigation available.

Regression checks: render the empty statistics response; deliberately fail a lazy import and a render in an isolated VM-only harness; verify the error state, retained navigation, and recovery on another route. Also verify real authenticated Admin/Console routes. Test harnesses are not repository build entries and must never be installed in production. Run source/artifact release-policy checks before release.
