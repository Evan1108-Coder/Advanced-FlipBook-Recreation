# Troubleshooting — Advanced FlipBook Recreation

Solutions for common issues when setting up, running, or using Advanced FlipBook Recreation.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Startup Issues](#startup-issues)
- [Database Issues](#database-issues)
- [Image Generation Issues](#image-generation-issues)
- [UI & Browser Issues](#ui--browser-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Performance Issues](#performance-issues)
- [Development Workflow Issues](#development-workflow-issues)

---

## Installation Issues

### `better-sqlite3` Installation Fails

**Symptom**: `npm install` fails with errors related to `better-sqlite3`, `node-gyp`, or native module compilation.

**Cause**: `better-sqlite3` is a native Node.js addon that requires a C++ compiler.

**Solutions**:

**macOS**:
```bash
xcode-select --install
npm install
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install -y build-essential python3
npm install
```

**Windows**:
```bash
npm install --global windows-build-tools
npm install
```

**Alternative** — Use prebuilt binaries:
```bash
npm install --build-from-source=false
```

**If using Node.js 22+**: Some versions have compatibility issues with `better-sqlite3`. Try Node.js 18 or 20:
```bash
nvm install 20
nvm use 20
rm -rf node_modules package-lock.json
npm install
```

---

### `npm install` Hangs or Times Out

**Solutions**:
1. Clear npm cache: `npm cache clean --force`
2. Delete and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Use a different registry: `npm install --registry=https://registry.npmmirror.com`
4. Check your network/proxy settings

---

### PostCSS Version Conflict

**Symptom**: Warnings about PostCSS version mismatch.

**Solution**: The `package.json` already includes a PostCSS override (`"postcss": "8.5.10"`). If you still see issues:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Startup Issues

### Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Use a different port
PORT=3099 npm run dev

# Or find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

---

### Environment Variables Not Loading

**Symptom**: MiniMax images not generating despite having a key, or database path not being respected.

**Solutions**:
1. Ensure your file is named exactly `.env.local` (not `.env.local.txt` or similar)
2. Restart the dev server after changing environment variables
3. Check for invisible characters: `cat -A .env.local`
4. Ensure no trailing spaces after values
5. Verify Next.js sees the file — look for `Environments: .env.local` in startup output

---

### Module Not Found Errors

**Symptom**: `Error: Cannot find module '...'`

**Solutions**:
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

### TypeScript Compilation Errors on Start

**Symptom**: Red errors in terminal when starting dev server.

**Solutions**:
1. Run `npm run typecheck` to see specific errors
2. Check if all dependencies are installed: `npm install`
3. Clear TypeScript cache: `rm -rf tsconfig.tsbuildinfo .next`
4. Ensure your Node.js version is 18+

---

## Database Issues

### Database File Not Created

**Symptom**: No `data/lumen-atlas.db` file appears after starting the server.

**Solutions**:
1. Create the data directory manually: `mkdir -p data`
2. Check permissions: `ls -la data/`
3. Check `LUMEN_ATLAS_DB_PATH` in `.env.local` — ensure the parent directory exists
4. Make a request to the API (database is created lazily on first request)

---

### Database Locked / SQLITE_BUSY

**Symptom**: `Error: SQLITE_BUSY: database is locked`

**Cause**: Multiple processes trying to write simultaneously, or a crashed process left a lock.

**Solutions**:
1. Stop all running dev servers
2. Delete WAL files: `rm -f data/lumen-atlas.db-wal data/lumen-atlas.db-shm`
3. Restart the dev server
4. Ensure only one instance of the app is running

---

### Corrupt Database / JSON Parse Errors

**Symptom**: `SyntaxError: Unexpected token in JSON` or garbled data in the UI.

**Cause**: Database corruption, usually from a hard crash during write.

**Solutions**:
1. Try the integrity check:
   ```bash
   sqlite3 data/lumen-atlas.db "PRAGMA integrity_check;"
   ```
2. If corrupt, reset the database:
   ```bash
   rm data/lumen-atlas.db data/lumen-atlas.db-wal data/lumen-atlas.db-shm
   ```
   The database will be recreated on next server start.

---

### Projects Not Persisting After Restart

**Symptom**: Projects disappear when you restart the dev server.

**Solutions**:
1. Check that `LUMEN_ATLAS_DB_PATH` is consistent across restarts
2. Verify the database file exists: `ls -la data/`
3. Make sure you're not accidentally deleting the database file

---

## Image Generation Issues

### Images Always Show Placeholder SVGs

**Symptom**: Generated flipbook pages always show the warm-colored placeholder SVG instead of real images.

**Cause**: MiniMax API key is missing or invalid.

**Solutions**:
1. Add your API key to `.env.local`:
   ```env
   MINIMAX_API_KEY=your_actual_key_here
   ```
2. Restart the dev server
3. Create a new project — existing objects keep their placeholder

> This is expected behavior when no API key is configured. The app is designed to work fully with placeholders.

---

### MiniMax API Timeout

**Symptom**: Image generation takes too long and falls back to placeholder.

**Cause**: MiniMax API has an 8-second timeout.

**Solutions**:
1. Check your internet connection
2. Verify the MiniMax API status
3. The app automatically falls back to placeholder — this is by design
4. Try again — transient network issues resolve on retry

---

### Generated Images Not Displaying

**Symptom**: Image generation succeeds but images appear broken.

**Solutions**:
1. Check that `public/generated/` directory exists: `mkdir -p public/generated`
2. Verify image files are being created: `ls -la public/generated/`
3. Check file permissions on the `public/generated/` directory
4. Hard-refresh the browser: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R`

---

### API Key Rejected by MiniMax

**Symptom**: Console errors showing 401 or 403 from MiniMax API.

**Solutions**:
1. Verify the key is correct (no extra spaces or characters)
2. Check if the key has expired in your MiniMax dashboard
3. Ensure your MiniMax account has API credits remaining
4. Try generating a new API key

---

## UI & Browser Issues

### Page Shows Blank White Screen

**Symptom**: Browser loads but shows nothing.

**Solutions**:
1. Open browser DevTools (F12) and check the Console tab for errors
2. Clear browser cache and hard-refresh
3. Try a different browser
4. Check terminal for server-side errors
5. Ensure the dev server is actually running

---

### Canvas Objects Not Dragging

**Symptom**: Objects on the canvas don't respond to mouse drag.

**Solutions**:
1. Make sure you're in "Select" mode (click the pointer icon in the toolbar)
2. Click the object first to select it, then drag
3. Check if the canvas is in "Pan" mode — switch back to "Select"

---

### Right Panel Not Opening

**Symptom**: Clicking "Panel" button does nothing.

**Solutions**:
1. Click the "Panel" button in the top-right corner
2. Check if the panel is open but empty — try expanding a section (Sources, Settings, etc.)
3. On narrow screens (< 820px), the panel may overlay the canvas

---

### Chat Bubble Not Responding

**Symptom**: Typing in chat and clicking send does nothing.

**Solutions**:
1. Ensure you have text in the input field (send button is disabled when empty)
2. The chat uses keyword matching, not AI. Try these keywords:
   - `learn` — Creates a Learn tool result
   - `strict source` — Switches to strict source mode
   - `clear chat` — Clears chat history
3. Other messages will get a template response — this is expected behavior

---

### Favicon 404 Error in Console

**Symptom**: `GET /favicon.ico 404` in browser console.

**Cause**: No favicon file is included in the project.

**Solution**: This is cosmetic only and does not affect functionality. To fix, add a `favicon.ico` to the `public/` directory.

---

### Layout Broken on Mobile

**Symptom**: UI elements overlap or are inaccessible on small screens.

**Solutions**:
1. The app is responsive at 390px, 768px, and 1280px+ breakpoints
2. On mobile (< 560px), the sidebar collapses and toolbar moves to bottom
3. If layout is still broken, try rotating your device or using desktop mode

---

## Build & Deployment Issues

### Build Fails with Type Errors

**Symptom**: `npm run build` fails with TypeScript errors.

**Solutions**:
1. Run `npm run typecheck` to see specific errors
2. Ensure all dependencies are installed: `npm install`
3. Clear caches: `rm -rf .next tsconfig.tsbuildinfo`
4. Check for recent git changes that may have introduced errors

---

### Build Fails with ESLint Errors

**Symptom**: Build stops on linting errors.

**Solutions**:
1. Run `npm run lint` to see specific errors
2. Fix the reported issues
3. The project enforces `no-explicit-any` and `no-unused-vars` — check for these

---

### Out of Memory During Build

**Symptom**: `JavaScript heap out of memory` during `npm run build`.

**Solution**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Performance Issues

### Slow Canvas with Many Objects

**Symptom**: Canvas becomes laggy with 20+ objects.

**Solutions**:
1. Use the "Organize" tool to auto-arrange objects
2. Delete unused objects to reduce render load
3. Close the right panel to give more canvas space
4. Performance is best in production mode: `npm run build && npm start`

---

### Slow Page Load

**Symptom**: Home page or workspace takes a long time to load.

**Solutions**:
1. Check if the database is large: `ls -lh data/lumen-atlas.db`
2. Clear old projects you no longer need
3. Use production mode for better performance
4. Check network tab for slow MiniMax API calls

---

## Development Workflow Issues

### Hot Reload Not Working

**Symptom**: Code changes don't reflect in the browser.

**Solutions**:
1. Check that the dev server is running (terminal should show activity)
2. Hard-refresh the browser: `Cmd+Shift+R` or `Ctrl+Shift+R`
3. Delete the Next.js cache: `rm -rf .next`
4. Restart the dev server

---

### ESLint Not Running in IDE

**Symptom**: No linting warnings/errors in your editor.

**Solutions**:
1. Install the ESLint extension for your IDE
2. Ensure `eslint.config.mjs` is in the project root
3. Restart your IDE
4. Check IDE settings point to the project's ESLint

---

## Getting More Help

If none of the above solutions work:

1. Check the [docs/05-test-plan.md](docs/05-test-plan.md) for known issues
2. Review terminal output for error messages
3. Check browser DevTools Console and Network tabs
4. Open an issue on the GitHub repository with:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Full error message
   - Steps to reproduce
