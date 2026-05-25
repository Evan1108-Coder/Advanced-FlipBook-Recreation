# Environment Variables — Advanced FlipBook Recreation

Complete reference for all environment variables used by Advanced FlipBook Recreation.

---

## Quick Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values. The `.env.local` file is gitignored and will not be committed.

---

## Variables Reference

### `MINIMAX_API_KEY`

| | |
|---|---|
| **Required** | No |
| **Default** | _(empty)_ |
| **Example** | `MINIMAX_API_KEY=eyJhbGciOiJSUzI1NiIsInR5cCI6...` |

Your MiniMax API key for AI image generation. When set, Advanced FlipBook Recreation generates real AI images using MiniMax's `image-01` model. When empty, deterministic SVG placeholders are used instead.

**How to get a key**:
1. Create an account at [minimax.io](https://www.minimax.io/)
2. Navigate to API settings in your dashboard
3. Generate a new API key
4. Paste it into your `.env.local`

**Behavior**:
- **Set**: Real image generation (network requests to MiniMax API)
- **Empty/missing**: SVG placeholder generation (fully offline, no network calls)
- **Invalid key**: Falls back to SVG placeholder after 8-second timeout

> The application is fully functional without this key. All features (clicking, branching, tools, chat) work with placeholder images.

---

### `MINIMAX_IMAGE_ENDPOINT`

| | |
|---|---|
| **Required** | No |
| **Default** | `https://api.minimax.io/v1/image_generation` |
| **Example** | `MINIMAX_IMAGE_ENDPOINT=https://api.minimax.io/v1/image_generation` |

The MiniMax API endpoint URL for image generation. You typically don't need to change this unless you're using a proxy or alternative endpoint.

**Validation**: Only custom endpoints are allowed when `LUMEN_ATLAS_ALLOW_CUSTOM_ENDPOINT=true` is also set. This is a security measure to prevent endpoint hijacking.

**Request format**:
```
POST {MINIMAX_IMAGE_ENDPOINT}
Authorization: Bearer {MINIMAX_API_KEY}
Content-Type: application/json

{
  "model": "image-01",
  "prompt": "...",
  "aspect_ratio": "16:9",
  "response_format": "base64",
  "n": 1,
  "prompt_optimizer": true
}
```

---

### `LUMEN_ATLAS_DB_PATH`

| | |
|---|---|
| **Required** | No |
| **Default** | `./data/lumen-atlas.db` |
| **Example** | `LUMEN_ATLAS_DB_PATH=/var/data/lumen-atlas.db` |

File path for the SQLite database. Can be absolute or relative to the project root.

**Behavior**:
- The parent directory must exist (the app creates the file, not the directory)
- WAL mode is enabled — creates additional `-wal` and `-shm` files alongside the database
- When backing up, copy all three files: `.db`, `.db-wal`, `.db-shm`
- The `data/` directory is gitignored by default

**Default directory structure**:
```
data/
├── lumen-atlas.db        # Main database
├── lumen-atlas.db-wal    # Write-ahead log
└── lumen-atlas.db-shm    # Shared memory
```

---

### `LUMEN_ATLAS_ALLOW_REMOTE`

| | |
|---|---|
| **Required** | No |
| **Default** | `false` |
| **Example** | `LUMEN_ATLAS_ALLOW_REMOTE=true` |

When set to `true`, allows API requests from non-localhost origins. By default, API routes only accept requests from `localhost` / `127.0.0.1`.

**Security implications**:
- `false` (default): Only local browser can access the API — safe for personal use
- `true`: Any network client can reach the API — use only if you need remote access (e.g., accessing from another device on LAN)

> If you're only using Advanced FlipBook Recreation on your local machine, leave this as `false`.

---

### `LUMEN_ATLAS_ALLOW_CUSTOM_ENDPOINT`

| | |
|---|---|
| **Required** | No |
| **Default** | `false` |
| **Example** | `LUMEN_ATLAS_ALLOW_CUSTOM_ENDPOINT=true` |

When set to `true`, allows overriding the MiniMax API endpoint via `MINIMAX_IMAGE_ENDPOINT`. This is a security gate to prevent accidental endpoint changes.

**Use cases**:
- Routing through a corporate proxy
- Using a self-hosted image generation service
- Testing against a mock API server

---

## Environment Files

Next.js loads environment variables from these files (in priority order):

| File | Purpose | Gitignored |
|------|---------|-----------|
| `.env.local` | Local overrides (your machine only) | Yes |
| `.env.development` | Development-specific values | Depends |
| `.env.production` | Production-specific values | Depends |
| `.env.test` | Test-specific values | Depends |
| `.env` | Base defaults | Depends |

**Recommendation**: Use `.env.local` for all local development. It takes highest priority and is always gitignored.

---

## Security Best Practices

1. **Never commit API keys** — `.env.local` is gitignored, but double-check before pushing
2. **Keep `LUMEN_ATLAS_ALLOW_REMOTE=false`** unless you explicitly need remote access
3. **Keep `LUMEN_ATLAS_ALLOW_CUSTOM_ENDPOINT=false`** unless using a proxy
4. **Rotate API keys** periodically in your MiniMax dashboard
5. **Use environment-specific files** (`.env.development`, `.env.production`) for different configurations

---

## Minimal Configuration

For basic local development with placeholder images (no API key needed):

```env
# .env.local — minimal config
# No variables needed! Defaults work out of the box.
```

For full image generation:

```env
# .env.local — with MiniMax image generation
MINIMAX_API_KEY=your_api_key_here
```

---

## Troubleshooting Environment Variables

| Problem | Solution |
|---------|---------|
| Variables not loading | Ensure file is named `.env.local` (not `.env.local.txt`) |
| Changes not taking effect | Restart the dev server (`Ctrl+C` then `npm run dev`) |
| `MINIMAX_API_KEY` not working | Check for trailing spaces or newlines in the value |
| Database not creating | Ensure the parent directory exists (`mkdir -p data`) |
| API rejecting requests | Check `LUMEN_ATLAS_ALLOW_REMOTE` if accessing from another device |

> See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more detailed solutions.
