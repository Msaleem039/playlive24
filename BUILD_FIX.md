# Build Fix Instructions

## Issues Fixed

1. ✅ **Moved `@tailwindcss/postcss` to dependencies** - Required for build process
2. ✅ **Added `outputFileTracingRoot` configuration** - Fixes nested directory warning

## Server Build Instructions

### 1. Fix Nested Directory Structure (if applicable)

If your server has a nested directory structure like `/var/www/frontend/playlive24/playlive24/`, you should:

**Option A: Remove the nested directory**
```bash
# On your server
cd /var/www/frontend/playlive24
# If there's a duplicate playlive24 directory inside, remove it or move contents up
```

**Option B: Build from the correct directory**
```bash
# Make sure you're in the correct project root
cd /var/www/frontend/playlive24/playlive24  # or wherever your package.json is
```

### 2. Clean Install Dependencies

```bash
# Remove old node_modules and lockfile
rm -rf node_modules package-lock.json

# Clean install (this will install @tailwindcss/postcss as a dependency now)
npm ci

# Verify @tailwindcss/postcss is installed
npm list @tailwindcss/postcss
```

### 3. Build the Application

```bash
# Build from the project root
npm run build
```

### 4. If You Still Get the Nested Directory Warning

Edit `next.config.mjs` and uncomment the `outputFileTracingRoot` line:

```javascript
outputFileTracingRoot: process.cwd(),
```

Or set it to the absolute path of your project root:

```javascript
outputFileTracingRoot: '/var/www/frontend/playlive24/playlive24',
```

## Verification

After building, verify:
- ✅ No `@tailwindcss/postcss` errors
- ✅ No module resolution errors for `@/` imports
- ✅ Build completes successfully

## If Issues Persist

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.x or 20.x
   ```

2. **Check npm version:**
   ```bash
   npm --version
   ```

3. **Verify all dependencies are installed:**
   ```bash
   npm list --depth=0
   ```

4. **Check for duplicate package-lock.json files:**
   ```bash
   find . -name "package-lock.json" -type f
   ```
   Remove any duplicate lockfiles outside the project root.

