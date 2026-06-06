# Lumen Atlas - Interactive AI Flipbook Workspace

> Status: prototype/beta. Lumen Atlas is a local AI visual knowledge workspace; some generation and exploration flows may still change as the product matures.

Lumen Atlas lets users generate interactive flipbooks, click visual regions to explore ideas, branch into connected pages, and study topics through tools like Learn, Ask, Analyze, Compare, Timeline, Sources, and Study Guide.

## Why Use Lumen Atlas?

- Turns a topic into a visual, explorable knowledge workspace.
- Supports branching pages instead of one linear chat answer.
- Combines canvas exploration with study and analysis tools.
- Keeps research, generated pages, and follow-up questions in one local interface.

## Current Limitations

- AI generation quality depends on the configured provider and prompt quality.
- Some workflows are experimental and should be checked before serious study use.
- This repo currently needs a clear license choice before outside reuse is encouraged.


**A local-first AI visual knowledge workspace** where users generate interactive flipbooks, explore topics by clicking visual regions, branch into connected pages, and use tools like Learn, Ask, Analyze, Compare, Timeline, Sources, and Study Guide on an infinite canvas.

Built with Next.js 16, React 19, TypeScript, and SQLite — all data stays on your machine.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Feature Modes](#feature-modes)
- [Canvas & Objects](#canvas--objects)
- [Tools & Actions](#tools--actions)
- [Right Panel Sections](#right-panel-sections)
- [AI Chat](#ai-chat)
- [Image Generation](#image-generation)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Settings System](#settings-system)
- [Accessibility](#accessibility)
- [Scripts](#scripts)
- [Related Documentation](#related-documentation)
- [License](#license)

---

## Features

- **Visual-First Learning**: Generate and explore topics through clickable visual flipbooks
- **Infinite Canvas**: Drag, resize, and connect knowledge objects freely
- **8 Feature Modes**: Flipbook, Textbook Image, Knowledge Map, Timeline, Compare, Study Guide, Source Brief, Presentation
- **12 Canvas Tools**: Select, Pan, New Flipbook, Organize, Learn, Ask, Analysis, Compare, Timeline, Sources, Regenerate, Export
- **AI Image Generation**: MiniMax API integration with deterministic SVG fallback
- **Source-Aware**: Track sources with quality ratings; enforce strict/balanced/off source modes
- **Project Memory**: Explicit, project-scoped memory with facts, summaries, and pinned items
- **Chat Operator**: AI chat bubble with context-aware operator actions
- **Local SQLite Persistence**: All data stored locally — no cloud dependency
- **Version Snapshots**: Automatic snapshots for restore points
- **Responsive Design**: Works on desktop (1440px+), tablet (768px), and mobile (390px)
- **Accessibility**: ARIA labels, keyboard navigation, focus-visible states, reduced-motion support

---

## Architecture Overview

The app is built on **Next.js App Router** with three main UI layers and two backend services:

**UI Components:**
- **HomeHub** — Landing page with mode selector, prompt input, and recent projects
- **WorkspaceCanvas** — Infinite canvas with drag/resize, objects, connections, and context menus
- **RightPanel** — 11 collapsible sections: Sources, Settings, Memory, Inspector, Transcript, Claims, Notes, Versions, Export, Check Understanding
- **FloatingToolbar** — 12 canvas tools (Learn, Ask, Analysis, Compare, Timeline, etc.)
- **ChatBubble** — AI chat interface with compact/expanded modes and operator actions

**API Routes:**
- `/api/projects` — CRUD for projects
- `/api/generate` — Image generation and tool execution
- `/api/chat` — Chat messages

**Backend Services:**
- `lib/db.ts` — SQLite database layer (782 lines) for all persistence
- `lib/minimax.ts` — MiniMax image-01 API client with SVG placeholder fallback

Data flows top-down: UI components call API routes via fetch. API routes use `lib/db.ts` for persistence and `lib/minimax.ts` for image generation. All state is stored in SQLite and re-fetched on page load.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router + Turbopack) | 16.2.6 |
| UI | React | 19.0.0 |
| Language | TypeScript (strict mode) | 5.7.2 |
| Database | better-sqlite3 (WAL mode, foreign keys) | 11.9.1 |
| Image Generation | MiniMax API (image-01 model) | — |
| Validation | Zod | 3.24.1 |
| Icons | Lucide React | 0.468.0 |
| CSS Utilities | clsx | 2.1.1 |
| Linting | ESLint + typescript-eslint | 9.17.0 |
| Styling | Custom CSS (no Tailwind) | — |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Evan1108-Coder/Advanced-FlipBook-Recreation.git
cd Advanced-FlipBook-Recreation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your MINIMAX_API_KEY (optional — works without it)

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

> See [SETUP.md](SETUP.md) for detailed setup instructions and [ENVREADME.md](ENVREADME.md) for environment variable documentation.

---

## Project Structure

```
Advanced-FlipBook-Recreation/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root HTML layout
│   ├── page.tsx                  # Main app page (314 lines)
│   ├── globals.css               # Global styles + theme (806 lines)
│   └── api/
│       ├── projects/
│       │   ├── route.ts          # GET all / POST create project
│       │   └── [projectId]/
│       │       └── route.ts      # GET / PATCH / DELETE project
│       ├── generate/
│       │   └── route.ts          # POST generation actions
│       └── chat/
│           └── route.ts          # POST chat messages
├── components/
│   ├── HomeHub.tsx               # Landing page (550 lines)
│   ├── WorkspaceCanvas.tsx       # Infinite canvas (421 lines)
│   ├── FloatingToolbar.tsx       # Canvas toolbar (161 lines)
│   ├── RightPanel.tsx            # Side panel with 11 sections (525 lines)
│   ├── ChatBubble.tsx            # AI chat interface (362 lines)
│   ├── ConnectorLayer.tsx        # SVG connection lines (91 lines)
│   └── SettingsControls.tsx      # Reusable form controls (300 lines)
├── lib/
│   ├── db.ts                     # SQLite database layer (782 lines)
│   ├── types.ts                  # TypeScript type definitions (118 lines)
│   ├── minimax.ts                # MiniMax image client (98 lines)
│   ├── validation.ts             # Input sanitization (111 lines)
│   ├── defaults.ts               # Feature modes + tool definitions (56 lines)
│   ├── api.ts                    # Request validation helpers (37 lines)
│   └── id.ts                     # ID generation + timestamps (8 lines)
├── docs/                         # Internal design docs
│   ├── 00-product-brief.md       # Product vision & MVP definition
│   ├── 01-information-architecture.md  # UI layout spec
│   ├── 02-architecture.md        # Technical architecture
│   ├── 03-settings-inventory.md  # Complete settings reference
│   ├── 04-agent-brief.md         # Coding guidelines
│   └── 05-test-plan.md           # Testing checklist
├── public/
│   └── generated/                # Generated images (gitignored)
├── data/                         # SQLite database files (gitignored)
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── .env.example
└── .gitignore
```

---

## Feature Modes

Advanced FlipBook Recreation supports 8 distinct feature modes, each shaping how content is generated and displayed:

| Mode | Description | Use Case |
|------|------------|----------|
| **Flipbook** | Explore a topic by clicking generated visual regions | Deep visual exploration of any topic |
| **Textbook Image** | Create structured explainer images with transcript text | Educational content creation |
| **Knowledge Map** | Turn a topic into a connected concept map | Understanding relationships between ideas |
| **Timeline** | Build a chronological visual branch | Historical events, project milestones |
| **Compare** | Compare two ideas, eras, systems, or sources | Side-by-side analysis |
| **Study Guide** | Generate review notes, questions, and explanations | Exam preparation, learning reinforcement |
| **Source Brief** | Summarize sources with claims and confidence ratings | Research synthesis |
| **Presentation** | Build a concise visual teaching sequence | Teaching, presentations |

---

## Canvas & Objects

The workspace uses an infinite canvas where knowledge objects can be:

- **Dragged** to any position
- **Resized** from four corners (NW, NE, SE, SW)
- **Connected** to other objects with labeled edges
- **Branched** by clicking image regions (creates child levels)
- **Inspected** via the right panel Object Inspector

### Object Types

| Type | Description |
|------|------------|
| `level` | A visual flipbook page with generated/placeholder image |
| `tool_result` | Output from running a tool (Learn, Ask, Analysis, etc.) |
| `ask` | User question with text input |
| `source` | External source document reference |
| `note` | User-created note |
| `map` | Knowledge map node |
| `timeline` | Timeline entry |
| `export` | Exported content block |

### Object Properties

Each object stores: `id`, `project_id`, `type`, `title`, `x`, `y`, `w`, `h`, `parent_id`, `depth`, `payload` (JSON), `image_url`, `status`, `created_at`, `updated_at`.

---

## Tools & Actions

The floating toolbar provides 12 tools:

| Tool | Icon | Description |
|------|------|------------|
| Select | Pointer | Select and interact with objects |
| Pan | Move | Pan the canvas viewport |
| New Flipbook | Layers | Create a new flipbook on the canvas |
| Organize | Grid | Auto-arrange objects on the canvas |
| Learn | Book | Generate a structured learning summary |
| Ask | Help Circle | Create an Ask object for questions |
| Analysis | Bar Chart | Analyze a selected object or topic |
| Compare | Git Compare | Compare two selected objects |
| Timeline | History | Create a chronological timeline |
| Sources | Search | Find and manage sources |
| Regenerate | Refresh | Regenerate the selected object's image |
| Export | Download | Export object content |

Each tool can be triggered from:
1. The floating bottom toolbar
2. The object context menu (click "..." on any object)
3. The chat operator (e.g., typing "learn" in chat)

---

## Right Panel Sections

The right panel (toggled via "Panel" button) contains 11 collapsible sections:

| Section | Description |
|---------|------------|
| **Sources** | Manage source documents, upload files, view quality ratings |
| **Project Settings** | Project name, mode, autosave, delete behavior, canvas preferences |
| **Chat Settings** | Chat history, memory, operator permissions, confirmation levels |
| **Memory** | View and manage project memory items (facts, summaries, pinned) |
| **Object Inspector** | Inspect selected object's metadata, type, position, payload |
| **Transcript** | View generated transcript/text for selected objects |
| **Claims** | Track claims extracted from sources with confidence levels |
| **Notes** | Create and manage project notes |
| **Versions** | View version snapshots for restore points |
| **Export** | Preview and configure export settings |
| **Check Understanding** | Self-assessment tools for review |

---

## AI Chat

The Atlas Chat bubble (bottom-right corner) provides:

- **Context Display**: Shows current project name, memory status, source mode
- **Pinned Memory**: Displays pinned memory items as context
- **Operator Actions**: Recognizes keyword commands:
  - `learn` — Creates a Learn tool result for the topic
  - `strict source` — Switches to strict source-only mode
  - `clear chat` — Clears chat history for the current project
- **Message History**: Persists chat messages per project in SQLite

> Note: The current chat implementation uses keyword matching, not a language model. Responses are template-based.

---

## Image Generation

### MiniMax API

When `MINIMAX_API_KEY` is configured:

- **Endpoint**: `POST https://api.minimax.io/v1/image_generation`
- **Model**: `image-01`
- **Parameters**: `prompt`, `aspect_ratio` (default: `16:9`), `response_format: "base64"`, `n: 1`, `prompt_optimizer: true`
- **Timeout**: 8 seconds
- **Output**: Base64 PNG saved to `public/generated/{id}.png`

### Local Fallback

When no API key is configured (or on request failure):

- Generates a deterministic SVG placeholder
- Includes the topic title, mode label, and decorative elements
- Uses project's warm ivory color scheme
- Fully functional — branching and tools work on placeholder images

---

## Database Schema

Advanced FlipBook Recreation uses SQLite (via better-sqlite3) with WAL mode and foreign keys enabled.

### Tables

```sql
-- Core project record
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'flipbook',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Settings stored as JSON blob per project
CREATE TABLE project_settings (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  settings TEXT NOT NULL DEFAULT '{}'
);

-- Canvas objects (flipbook levels, tool results, notes, etc.)
CREATE TABLE objects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'level',
  title TEXT NOT NULL DEFAULT '',
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  w REAL NOT NULL DEFAULT 380,
  h REAL NOT NULL DEFAULT 260,
  parent_id TEXT,
  depth INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}',
  image_url TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Directed edges between objects
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  label TEXT DEFAULT ''
);

-- Source documents
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  quality TEXT DEFAULT 'medium',
  url TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

-- Project memory items
CREATE TABLE memory_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'fact',
  created_at TEXT NOT NULL
);

-- Chat history
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Version snapshots
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

---

## API Reference

### Projects

#### `GET /api/projects`
Returns all projects ordered by last updated.

**Response**: `{ projects: Project[] }`

#### `POST /api/projects`
Create a new project from a prompt.

**Body**: `{ prompt: string, mode: Mode, files?: File[] }`

**Response**: `{ project: ProjectBundle }`

Creates the project record, default settings, root level object with generated image, initial memory item, and version snapshot.

#### `GET /api/projects/[projectId]`
Get full project bundle.

**Response**: `{ project, settings, objects, connections, sources, memoryItems, chatMessages }`

#### `PATCH /api/projects/[projectId]`
Update project settings or an object's frame (position/size).

**Body (settings)**: `{ settings: Partial<ProjectSettings> }`

**Body (frame)**: `{ objectId: string, x: number, y: number, w: number, h: number }`

#### `DELETE /api/projects/[projectId]?objectId=X&confirm=Y`
Delete an object. Behavior depends on project's `deleteConfirmation` setting:
- `"detach-descendants"` — Children become root objects
- `"delete-branch"` — Cascade delete entire sub-tree

### Generation

#### `POST /api/generate`
Core generation endpoint.

**Body**: `{ projectId, action, objectId?, clickX?, clickY?, toolId?, prompt? }`

**Actions**:
- `"explore"` — Click a region to create a child level
- `"tool"` — Run a tool on a selected object
- `"regenerate"` — Regenerate an object's image

### Chat

#### `POST /api/chat`
Send a chat message.

**Body**: `{ projectId, message }`

Recognizes operator keywords: `learn`, `strict source`, `clear chat`.

---

## Settings System

Settings operate at three levels with cascading overrides:

1. **Global Defaults** (hardcoded in `lib/defaults.ts`)
2. **Project Settings** (stored in `project_settings` table)
3. **Object/Tool Settings** (stored in object's `payload` JSON)

### Key Settings

| Setting | Default | Description |
|---------|---------|------------|
| `mode` | `"flipbook"` | Project feature mode |
| `memoryEnabled` | `true` | Enable project memory |
| `sourcesMode` | `"balanced"` | Source strictness (strict/balanced/off) |
| `autoSave` | `true` | Auto-save on changes |
| `deleteConfirmation` | `"detach-descendants"` | Object delete behavior |
| `rightPanelWidth` | `320` | Right panel width in pixels |
| `chatBubbleExpanded` | `false` | Chat starts expanded or compact |
| `gridSnap` | `false` | Snap objects to grid |
| `connectorRouting` | `"straight"` | Connection line routing |
| `maxDepth` | `5` | Maximum flipbook depth |
| `aspectRatio` | `"16:9"` | Generated image aspect ratio |

---

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive ARIA labels
- **Keyboard Navigation**: Tab through toolbar, panel sections, and objects
- **Focus States**: Visible `:focus-visible` outlines on all focusable elements
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Semantic HTML**: Proper use of `<main>`, `<nav>`, `<button>`, `<section>`, `<aside>`
- **Color Contrast**: Warm ivory/brown theme meets WCAG AA contrast ratios

---

## Scripts

```bash
npm run dev        # Start development server (Turbopack)
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking (tsc --noEmit)
```

---

## Related Documentation

- [SETUP.md](SETUP.md) — Detailed installation and setup guide
- [ENVREADME.md](ENVREADME.md) — Environment variable reference
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issues and solutions
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contributing guidelines
- [docs/00-product-brief.md](docs/00-product-brief.md) — Product vision
- [docs/01-information-architecture.md](docs/01-information-architecture.md) — UI structure
- [docs/02-architecture.md](docs/02-architecture.md) — Technical architecture
- [docs/03-settings-inventory.md](docs/03-settings-inventory.md) — Settings reference
- [docs/04-agent-brief.md](docs/04-agent-brief.md) — Coding guidelines
- [docs/05-test-plan.md](docs/05-test-plan.md) — Testing checklist

---

## License

Private project. All rights reserved.
