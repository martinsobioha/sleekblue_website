---
name: Vite ETag cache poisoning — two-React hook crash
description: Root cause and permanent fix for "Invalid hook call" crash caused by browser caching stale Vite dep import paths in source file transforms.
---

## The rule
After any Vite dep re-optimization (package install/uninstall, cacheDir change), ALWAYS `touch` source files so Vite issues fresh 200 responses instead of 304s.

**Why:** Vite caches source file transforms in memory; browsers cache source files using ETag/mtime. When the dep pre-bundle changes (new browserHash or cacheDir), Vite's transform of a source file now points to new dep URLs. BUT if the source file mtime hasn't changed, Vite returns `304 Not Modified`. The browser uses its OLD cached transform, which still imports React from the OLD dep URL. React DOM (freshly loaded) uses the NEW dep URL. Two different `react-CoTh1R2n.js` module identities → two React instances → `resolveDispatcher()` returns null → "Invalid hook call".

**How to apply:** After any npm install/uninstall or Vite cacheDir change, run:
```bash
find src -name '*.js' -o -name '*.jsx' -o -name '*.css' | xargs touch
```
This is now automated via `predev` npm script in `package.json`.

## Permanent config fixes applied
- `cacheDir: '../.vitecache'` — moves pre-bundled deps off `node_modules/.vite/` (which browsers had cached with `max-age=31536000,immutable`)
- `server.headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }` — prevents future browser caching of dep files
- `resolve.dedupe: ['react', 'react-dom']` — ensures deduplication
- `predev` script in package.json — auto-touches source files on every `npm run dev`

## Diagnostic fingerprint
- Error: `TypeError: Cannot read properties of null (reading 'useEffect')`
- Stack shows two DIFFERENT URLs for `react-CoTh1R2n.js` — one from old cache (`?v=4c6d984f`), one from new cache (`?v=9453bb85`)
- `useSEO` (or any hook file) uses OLD URL; `react-dom_client` uses NEW URL → different module identities → separate React instances
