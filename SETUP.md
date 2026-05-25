# Setup Guide — Lumen Atlas

Complete guide to installing, configuring, and running Lumen Atlas locally.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Production Build](#production-build)
- [Database Setup](#database-setup)
- [MiniMax API Setup](#minimax-api-setup)
- [Verifying the Installation](#verifying-the-installation)
- [IDE Setup](#ide-setup)
- [Updating](#updating)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | Check Command |
|------------|----------------|---------------|
| **Node.js** | 18.17.0+ | `node --version` |
| **npm** | 9.0.0+ | `npm --version` |
| **Git** | 2.0+ | `git --version` |

### Platform-Specific Notes

**macOS**:
- Install Node.js via [Homebrew](https://brew.sh): `brew install node`
- Or use [nvm](https://github.com/nvm-sh/nvm): `nvm install 18`
- Xcode Command Line Tools may be required for `better-sqlite3` native compilation: `xcode-select --install`

**Linux (Ubuntu/Debian)**:
- Install build tools for native modules: `sudo apt-get install -y build-essential python3`
- Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`

**Windows**:
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Install Windows Build Tools for native modules: `npm install --global windows-build-tools`
- Or use WSL2 for a Linux-like development experience

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Evan1108-Coder/Advanced-FlipBook-Recreation.git
cd Advanced-FlipBook-Recreation
```

### 2. Install Dependencies

```bash
npm install
```

This installs all runtime and development dependencies, including:
- `better-sqlite3` (native SQLite binding — requires C++ compiler)
- `next` (framework)
- `react` + `react-dom` (UI)
- `zod` (validation)
- `lucide-react` (icons)

> If `npm install` fails on `better-sqlite3`, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md#better-sqlite3-installation-fails).

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration. See [Environment Configuration](#environment-configuration) below, or [ENVREADME.md](ENVREADME.md) for full details.

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Configuration

Create a `.env.local` file in the project root (or copy from `.env.example`):

```env
# MiniMax API key for image generation (optional)
# Without this, placeholder SVGs are used instead
MINIMAX_API_KEY=

# MiniMax image generation endpoint (default shown)
MINIMAX_IMAGE_ENDPOINT=https://api.minimax.io/v1/image_generation

# SQLite database file path (default shown)
LUMEN_ATLAS_DB_PATH=./data/lumen-atlas.db
```

### Optional Security Variables

```env
# Allow API access from non-localhost origins (default: false)
# Only enable if you need remote access to the API
LUMEN_ATLAS_ALLOW_REMOTE=false

# Allow custom MiniMax endpoint override (default: false)
# Only enable if using a proxy or alternative endpoint
LUMEN_ATLAS_ALLOW_CUSTOM_ENDPOINT=false
```

> See [ENVREADME.md](ENVREADME.md) for complete environment variable documentation.

---

## Running the Application

### Development Mode

```bash
npm run dev
```

- Starts on `http://localhost:3000` (default Next.js port)
- Uses Turbopack for fast hot module replacement
- Reads `.env.local` for environment variables
- Auto-creates the `data/` directory and SQLite database on first request
- Changes to source files auto-reload in the browser

### Custom Port

```bash
PORT=3099 npm run dev
```

### Development with Verbose Logging

Next.js logs API route activity in the terminal. Watch for:
- `POST /api/projects` — Project creation
- `POST /api/generate` — Image generation (shows MiniMax calls or fallback)
- Database errors (logged to stderr)

---

## Production Build

### Build

```bash
npm run build
```

Compiles the application with Next.js optimizations. Checks for TypeScript and ESLint errors.

### Start Production Server

```bash
npm start
```

Runs the optimized production build on `http://localhost:3000`.

### Custom Production Port

```bash
PORT=8080 npm start
```

---

## Database Setup

Lumen Atlas uses SQLite for local persistence. The database is created automatically on first use.

### Default Location

The database file is stored at `./data/lumen-atlas.db` (relative to project root). This directory is gitignored.

### Custom Location

Set `LUMEN_ATLAS_DB_PATH` in your `.env.local`:

```env
LUMEN_ATLAS_DB_PATH=/path/to/your/database.db
```

### Database Configuration

The SQLite database is configured with:
- **WAL mode** (Write-Ahead Logging) for better concurrent read performance
- **Foreign keys enabled** for referential integrity
- **Auto-migration** — tables are created if they don't exist

### Backup

To back up your data, simply copy the database file:

```bash
cp data/lumen-atlas.db data/lumen-atlas-backup.db
```

### Reset Database

To start fresh, delete the database file. It will be recreated on next server start:

```bash
rm data/lumen-atlas.db data/lumen-atlas.db-wal data/lumen-atlas.db-shm
```

---

## MiniMax API Setup

MiniMax image generation is **optional**. Without it, the app generates deterministic SVG placeholders that are fully functional (clicking, branching, and tools all work).

### Getting an API Key

1. Visit [MiniMax](https://www.minimax.io/) and create an account
2. Navigate to your API dashboard
3. Generate a new API key
4. Add it to your `.env.local`:

```env
MINIMAX_API_KEY=your_api_key_here
```

### How It Works

- **With API key**: Generates real AI images via MiniMax's `image-01` model
- **Without API key**: Uses deterministic SVG placeholders with the topic title
- **On API failure**: Falls back to SVG placeholder (8-second timeout)
- **Images stored at**: `public/generated/{id}.png` (gitignored)

### API Limits

- Each generation request creates one image
- Images are 16:9 aspect ratio by default (configurable per-project)
- 8-second timeout per request
- No built-in rate limiting — be mindful of API costs

---

## Verifying the Installation

Run these checks to confirm everything is set up correctly:

### 1. TypeScript Check

```bash
npm run typecheck
```

Should complete with **0 errors**.

### 2. ESLint Check

```bash
npm run lint
```

Should complete with **0 warnings or errors**.

### 3. Build Check

```bash
npm run build
```

Should complete successfully.

### 4. Browser Smoke Test

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Verify the Home page loads with mode selector, prompt input, and settings
4. Type a prompt and click "Create atlas"
5. Verify the workspace canvas appears with an object
6. Click the "..." menu on the object — verify tools appear
7. Click "Panel" — verify the right panel opens with all 11 sections
8. Click the chat bubble (bottom-right) — verify the chat interface opens

---

## IDE Setup

### VS Code

Recommended extensions:
- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`) — optional
- **CSS Modules** — for `.css` file navigation

Recommended `settings.json`:
```json
{
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

### JetBrains (WebStorm/IntelliJ)

- TypeScript and ESLint support is built-in
- Set Node.js interpreter in `Preferences > Languages & Frameworks > Node.js`
- Enable ESLint in `Preferences > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`

---

## Updating

### Pull Latest Changes

```bash
git pull origin codex/local-mvp-scaffold
npm install  # In case dependencies changed
```

### After Updating

- Database migrations run automatically on server start
- Clear `.next/` cache if you encounter stale build issues: `rm -rf .next`
- Restart the dev server
