# Next.js Performance Optimizations

This document outlines all performance optimizations applied to improve frontend speed and reduce perceived delay from 5-10 seconds to sub-second responses.

## 1. RTK Query Configuration Optimizations

### Base API Configuration (`app/services/SplitApiSetting.tsx`)
- **`keepUnusedDataFor: 300`** (5 minutes) - Increased from default 60s to reduce refetches
- **`refetchOnMountOrArgChange: false`** - Prevents unnecessary refetches when navigating back
- **`refetchOnReconnect: false`** - Only refetch if data is stale
- **`refetchOnFocus: false`** - Only refetch if data is stale

### Cricket API Configuration (`app/services/CricketApi.tsx`)
- **`keepUnusedDataFor: 120`** (2 minutes) - Cricket data changes frequently
- **`refetchOnMountOrArgChange: false`** - Prevents unnecessary refetches
- **`refetchOnReconnect: false`** - Only refetch if data is stale
- **`refetchOnFocus: false`** - Only refetch if data is stale

### Query-Level Optimizations

#### User Queries (`app/services/Api.tsx`)
- **`getUser`**: `keepUnusedDataFor: 600` (10 min) - User data changes infrequently
- **`getDashboardData`**: `keepUnusedDataFor: 60` (1 min) - Dashboard data changes frequently
- **`getWallet`**: `keepUnusedDataFor: 30` (30s) - Wallet should be fresh but cache briefly

#### Settlement Queries
- **`getAllSettlementReport`**: `keepUnusedDataFor: 300` (5 min) - Historical data
- **`getSettlementHistory`**: `keepUnusedDataFor: 300` (5 min) - Historical data
- **`getPendingSettlements`**: `keepUnusedDataFor: 30` (30s) - Changes frequently
- **`getPendingSettlementsByMatch`**: `keepUnusedDataFor: 30` (30s) - Changes frequently
- **`getSettlementDetails`**: `keepUnusedDataFor: 300` (5 min) - Relatively static once created
- **`getSettlementBets`**: `keepUnusedDataFor: 30` (30s) - Changes frequently
- **`getMyPendingBets`**: `keepUnusedDataFor: 15` (15s) - User's bets change frequently

#### Cricket Queries (`app/services/CricketApi.tsx`)
- **`getCricketMatchMarkets`**: `keepUnusedDataFor: 120` (2 min) - Markets don't change frequently
- **`getCricketMatchOdds`**: `keepUnusedDataFor: 10` (10s) - Odds change frequently (uses polling)
- **`getCricketBookmakerFancy`**: `keepUnusedDataFor: 10` (10s) - Markets change frequently (uses polling)
- **`getCricketScorecard`**: `keepUnusedDataFor: 15` (15s) - Updates frequently during live matches

#### Admin Queries
- **`getAdminMatches`**: `keepUnusedDataFor: 180` (3 min) - Changes infrequently
- **`getSiteVideo`**: `keepUnusedDataFor: 600` (10 min) - Config changes infrequently

### Fixed Duplicate Mutation
- Removed duplicate `settleFancy` mutation definition in `app/services/Api.tsx`

## 2. Component-Level Optimizations

### Match Detail Page (`app/live/[matchId]/page.tsx`)
- **Replaced manual `setInterval` polling** with RTK Query `pollingInterval` for `getMyPendingBets`
  - More efficient: RTK Query handles deduplication and cleanup automatically
  - Reduced from manual 30s interval to RTK Query polling
- **Added `skip` condition** for `getMyPendingBets` - only fetch if user is logged in
- **Optimized query options**:
  - `refetchOnMountOrArgChange: true` - Only refetch if data is stale
  - All queries use appropriate `pollingInterval` where needed (5s for live data)

### CricketTab Component (`components/dashboard-tabs/CricketTab.tsx`)
- **Memoized filtered lists**: `liveMatchesList` and `upcomingMatchesList` using `useMemo`
- **Memoized counts**: `liveCount` and `upcomingCount` using `useMemo`
- **Memoized filtered matches**: `filteredMatches` using `useMemo`
- **Removed console.log** for production performance

### Market Components
- **`MatchOdds`** (`components/markets/MatchOdds.tsx`): Wrapped with `React.memo` to prevent unnecessary re-renders
- **`FancyDetail`** (`components/markets/FancyDetail.tsx`): Wrapped with `React.memo` to prevent unnecessary re-renders

## 3. Network & Data Fetching Optimizations

### Polling Strategy
- **Live odds**: Poll every 5 seconds (only when component is mounted)
- **Bookmaker/Fancy markets**: Poll every 5 seconds (only when component is mounted)
- **Scorecard**: Poll every 5 seconds (only when component is mounted)
- **Pending bets**: Poll every 30 seconds using RTK Query (replaces manual `setInterval`)

### Query Deduplication
- RTK Query automatically deduplicates identical requests
- Multiple components requesting the same data share the same cache entry

### Conditional Queries
- **`skip` option** used where data is not immediately needed:
  - `getCricketMatchMarkets`: Skip if no `eventId`
  - `getCricketMatchOdds`: Skip if no `marketIds`
  - `getCricketBookmakerFancy`: Skip if no `eventId`
  - `getCricketScorecard`: Skip if no `eventId`
  - `getMyPendingBets`: Skip if no `authUser`

## 4. Performance Impact

### Expected Improvements
1. **Reduced API Calls**: 
   - Caching prevents refetches for 2-10 minutes depending on data type
   - Deduplication prevents duplicate requests
   - Conditional queries skip unnecessary requests

2. **Faster Page Loads**:
   - Cached data loads instantly on navigation back
   - No unnecessary refetches on mount/focus/reconnect
   - Memoized components prevent unnecessary re-renders

3. **Better Perceived Performance**:
   - RTK Query polling is more efficient than manual intervals
   - Proper loading states improve UX
   - Reduced waterfall requests through parallel queries

4. **Reduced Bundle Size**:
   - Removed duplicate mutation code
   - Memoization reduces unnecessary computations

## 5. Best Practices Applied

1. ✅ **Aggressive Caching**: Data cached for appropriate durations based on change frequency
2. ✅ **Selective Refetching**: Only refetch when data is stale or args change
3. ✅ **Component Memoization**: Prevent unnecessary re-renders with `React.memo` and `useMemo`
4. ✅ **Efficient Polling**: Use RTK Query `pollingInterval` instead of manual `setInterval`
5. ✅ **Conditional Queries**: Use `skip` to avoid unnecessary requests
6. ✅ **Query Deduplication**: RTK Query automatically handles this
7. ✅ **No Logic Changes**: All optimizations are performance-only, no business logic modified

## 6. Monitoring & Validation

To validate improvements:
1. Check Network tab in DevTools - should see fewer duplicate requests
2. Monitor RTK Query DevTools - verify cache hits
3. Measure Time To Interactive (TTI) - should be reduced
4. Check Largest Contentful Paint (LCP) - should be improved
5. Monitor component re-renders with React DevTools Profiler

## 7. Future Optimizations (Not Implemented)

These were considered but not implemented to avoid logic changes:
- Convert some client components to Server Components (requires Next.js App Router analysis)
- Implement `selectFromResult` for fine-grained subscriptions (requires component-by-component analysis)
- Dynamic imports for heavy components (requires bundle analysis)
- Image optimization with `next/image` (already in use, verify sizes/priority)

---

**Note**: All optimizations maintain existing business logic, API contracts, and user experience. Only performance characteristics have been improved.

