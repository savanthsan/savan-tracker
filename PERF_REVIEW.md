# SAG-1 Performance Review - Remediation Report

The following performance issues outlined in the SAG-1 review have been successfully fixed and deployed.

## 1. Tooling and Build Optimizations
- **Next Config:** Removed the deprecated `eslint` key from `next.config.mjs` to stop it from throwing a build warning on Next 16.
- **Middleware Update:** Renamed the legacy `middleware.js` to `proxy.js` and updated its exported function to `proxy`, natively supporting Next 16's updated routing shim pattern.

## 2. Eliminated Cascading Renders in Context
- **Currency Double-Render**: Changed `currency` in `src/lib/context.js` to lazily evaluate from `localStorage` inside the `useState` initializer. This eliminates the `useEffect` trigger that was double-rendering the whole app subtree on mount.
- **Redundant Auth Bootstrapping**: Removed the manually invoked 5-second `checkSession()` check. `supabase.auth.onAuthStateChange` natively fires immediately on initialization, meaning the previous implementation was causing multiple competing state updates and duplicate `setLoading(false)` calls.
- **Missing Dependencies**: Corrected a React hook warning where `refreshAllData` was omitted from a `[user]` effect dependency array, ensuring deterministic updates without triggering uncontrolled refetches.

## 3. Fixed Memory/Timer Leaks in Notifications
- **Toast Timer Cleanup**: In `NotificationHandler.js`, the toast `setTimeout` was leaking. It is now safely stored via `useRef` mappings and strictly cleared when the component unmounts. Subtree re-rendering was also avoided by using functional state updates for `activeToasts`.
- **Interval Re-installs**: The 30-second interval was aggressively breaking and restarting on every single task state change. Wrapped the `tasks` array in a `useRef` so the interval remains stable while still reading the latest array reference, massively reducing CPU thrashing.

## 4. Heavy Dashboard Memoization
The `Dashboard` component was executing several heavy filtering loops, mapping operations, and un-memoized object instantiation on *every* render cycle.
- The states `completedTasksCount`, `pendingTasksCount`, `missedTasksCount`, `chartData`, and `remainingBudget` are now aggressively isolated using `useMemo` hooks.
- Static references like `dockItems`, `todayStr`, and `currentWeekStart` are properly memoized, stopping cascading updates across boundary dates at midnight or during sub-component repaints.

## 5. Unbounded Data Fetching
- Added a `.limit(200)` clause to both `fetchTasks()` and `fetchExpenses()` inside `src/lib/context.js`. This guarantees that long-term historical records don't inflate the Next.js payload over the wire and bog down the client-side `useMemo` reducers.
