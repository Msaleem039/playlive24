# Path Alias Resolution Fix

## Issues Fixed

1. ✅ **Added `baseUrl` to `tsconfig.json`** - Required for proper path resolution
2. ✅ **Added webpack alias configuration** - Explicitly tells webpack where to find `@/` imports
3. ✅ **Maintained `outputFileTracingRoot`** - Fixes nested directory warning

## Changes Made

### 1. `tsconfig.json`
- Added `"baseUrl": "."` to compilerOptions
- This is required for TypeScript path mapping to work correctly

### 2. `next.config.mjs`
- Added webpack configuration to explicitly resolve `@/` alias
- This ensures webpack can find modules during build time

## Testing on Server

After pulling the latest changes:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Clean install (if needed)
rm -rf node_modules package-lock.json
npm install

# 3. Build
npm run build
```

## If Issues Persist

### Option 1: Check Directory Structure

If you have a nested directory like `/var/www/frontend/playlive24/playlive24/`, you might need to:

1. **Remove the nested directory:**
   ```bash
   cd /var/www/frontend/playlive24
   # Check if there's a duplicate playlive24 directory
   ls -la
   # If there is, move contents up or remove the nested one
   ```

2. **Or adjust `outputFileTracingRoot` in `next.config.mjs`:**
   ```javascript
   outputFileTracingRoot: '/var/www/frontend/playlive24/playlive24',
   ```

### Option 2: Verify File Structure

Make sure these files exist:
- ✅ `app/store/slices/authSlice.tsx`
- ✅ `components/dashboardagent/SettlementAdminPanel.tsx`
- ✅ `components/utils/Loader.tsx`
- ✅ `components/dashboardagent/index.ts`

### Option 3: Clear Next.js Cache

```bash
rm -rf .next
npm run build
```

### Option 4: Check Node/Next.js Versions

```bash
node --version  # Should be 18.x or 20.x
npm --version
npm list next   # Should show 15.2.6 or higher
```

## Expected Behavior

After these fixes:
- ✅ `@/app/store/slices/authSlice` should resolve correctly
- ✅ `@/components/dashboardagent/SettlementAdminPanel` should resolve correctly
- ✅ `@/components/utils/Loader` should resolve correctly
- ✅ `@/components/dashboardagent` (barrel export) should resolve correctly

## Debugging

If you still get module resolution errors:

1. **Check the actual file paths:**
   ```bash
   ls -la app/store/slices/authSlice.tsx
   ls -la components/dashboardagent/SettlementAdminPanel.tsx
   ls -la components/utils/Loader.tsx
   ```

2. **Verify imports in the failing file:**
   ```bash
   cat app/adminpanel/settlement-admin-client.tsx
   ```

3. **Check webpack resolution:**
   The webpack config should resolve `@/` to the project root where `package.json` is located.

