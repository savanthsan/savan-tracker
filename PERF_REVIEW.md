# Performance Review — SAG-1

Findings from a build + lint + static review pass on `main` @ 54616d6. No existing code was modified.

## Build / Tooling

- `next.config.mjs` has an unrecognized `eslint` key — Next 16 dropped support; it is ignored at build time.
- `src/middleware.js` uses the deprecated `middleware` convention — Next 16 wants `proxy.js`. Cold-start path runs through a legacy compatibility shim.
- Production build compile time is **47s** with Turbopack on a small app — most of it is `next/font/google` (Delius_Swash_Caps + JetBrains_Mono) fetching at build time.

## React — cascading renders (lint `react-hooks/set-state-in-effect`, 28 errors)

These all cause an extra render pass right after mount/auth events. Hot spots:

- `src/lib/context.js:36` — `setCurrencyState` inside mount effect (every app load pays a double render).
- `src/lib/context.js:136` — `setLoading(false)` inside the auth bootstrap effect.
- `src/lib/context.js:196` — `refreshAllData()` triggered from a `[user]` effect; missing dep `refreshAllData` (warning `198:6`). Every login fires a cascade that updates `tasks`, `expenses`, `weeklyBudget`, `profile` in sequence.
- `src/components/NotificationHandler.js:19` — `setActiveToasts` inside effect that depends on `notifications`; also missing `activeToasts` dep (warning `27:6`). Each new notification re-renders the whole `<AppProvider>` subtree twice.
- One more in `src/app/.../page.js:80` (`setMounted(true)` pattern) — same anti-pattern.

## Dashboard render path (`src/app/dashboard/page.js`)

- Lines **95–131**: every render re-walks `tasks` three times (`filter` for completed/pending/missed), re-walks `expenses` twice, and rebuilds `chartData` (7-day loop + nested filter+reduce). None memoized. With realistic data and the 30s notification interval re-rendering the provider, this is unnecessary CPU.
- Line **50**: `dockItems` array (8 entries, JSX icons) re-created every render — defeats `Dock` memoization downstream.
- Lines **68–69**: `todayStr` and `currentWeekStart` recomputed each render; `currentWeekStart` is then a dep of the AI-snippet effect (line 92), so any prop change that crosses midnight triggers refetch.

## Polling / timers

- `src/components/NotificationHandler.js:90` — `setInterval(checkUpcomingTasks, 30000)` re-installs whenever `tasks` changes (effect deps include `tasks`). On a busy session you get repeated teardown/setup of the interval and an immediate `checkUpcomingTasks()` re-run per tasks update.
- `src/components/NotificationHandler.js:22` — `setTimeout` for toast dismissal is not cleared on unmount.

## Data fetching

- `src/lib/context.js` `refreshAllData` runs 4 Supabase round-trips in parallel — fine — but `fetchTasks` and `fetchExpenses` `SELECT *` with no `.limit()`. As history grows, dashboard becomes O(all rows) both over the wire and in client-side `filter/reduce` loops above.
- `fetchBudget` filters by `eq('week_start_date', currentWeekStart)` — assumes that column is indexed; worth verifying in Supabase.

## Summary

App builds cleanly and routes/static generation are healthy. The real perf risk is the **provider-level cascading render pattern**: 4 setState-in-effect violations in `context.js` + `NotificationHandler.js` propagate through every consumer (Dashboard does the heaviest unmemoized work), and a 30s interval keeps re-triggering it. Fixing the lint errors and adding `useMemo` around the Dashboard derived stats would be the highest-leverage change. The Next 16 deprecations (`middleware` → `proxy`, stale `eslint` config key) are low-risk but should be addressed before a future minor bump removes them.
