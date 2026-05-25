# Technical Architecture

## Stack

- Next.js App Router with React and TypeScript.
- SQLite for local persistence.
- API routes for project data, canvas mutation, generation, and chat/operator actions.
- MiniMax image generation via `MINIMAX_API_KEY`.
- Local generated assets saved under app-managed storage.

## Data Model

Core tables:

- `projects`: project metadata and timestamps.
- `project_settings`: project-specific settings JSON.
- `objects`: canvas objects, positions, sizes, type, title, payload JSON.
- `connections`: directed links between objects with routing metadata.
- `sources`: uploaded/imported source metadata and extracted text snippets.
- `claims`: factual claims linked to objects and sources.
- `memory_items`: project memory facts, pinned facts, and generated summaries.
- `chat_messages`: project chat history.
- `generation_jobs`: status, prompt, provider, asset path, errors, and timing.
- `versions`: object/version snapshots for restore.

## Generation Flow

1. User enters a prompt or clicks a region on a level.
2. App builds context from project memory, selected object, parent chain, sources, settings, and click location.
3. Knowledge planner creates title, summary, transcript, claims, source needs, and semantic hotspots.
4. Image prompt is sent to MiniMax if available.
5. If MiniMax is unavailable, a deterministic local placeholder visual is created so the app remains testable.
6. New level object is inserted.
7. Connection is inserted from parent to child.
8. Source, transcript, claim, and memory updates are saved.

The current implementation includes a working MiniMax-ready service with a local placeholder fallback. The placeholder path is intentional so tests and local demos work without secrets.

## Click Understanding

Priority:

1. Semantic hotspot metadata.
2. Click coordinates mapped to generated visual regions.
3. Object title/summary/transcript.
4. Parent branch history.
5. Project memory.
6. Sources.

The MVP should infer a meaningful child topic from click position and page context. Later versions can add image understanding and hover previews.

## AI Operator Model

The chat agent can:

- Read project state, settings, sources, memory, chat history, selected object, and backend process logs.
- Create objects and connections.
- Run tools.
- Update project settings.
- Organize canvas.
- Rename/delete objects.
- Open right-panel sections.
- Export outputs.

Risky actions require confirmation:

- Delete data.
- Clear memory or chat history.
- Overwrite settings.
- Bulk regenerate.
- Export/share outside local app.

## Local-First Storage

- SQLite database lives in local app data.
- Generated images live in local file storage and are referenced by path.
- `.env` contains local secrets and is not committed.
- `.env.example` documents required variables.
- Foreign keys are enabled for SQLite.
- Project settings are sanitized before persistence.
- Frame updates are clamped before persistence.

## Source-Aware Text

Generated image text should not be trusted as the authoritative transcript. Advanced FlipBook Recreation stores real structured text separately:

- Transcript
- Claims
- Sources
- Notes
- Study guide material

This is the main maturity improvement over pixel-only Flipbook.
