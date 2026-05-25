# Contributing — Lumen Atlas

Guidelines for contributing to the Lumen Atlas project.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Code Style & Conventions](#code-style--conventions)
- [File Organization](#file-organization)
- [Component Guidelines](#component-guidelines)
- [API Route Guidelines](#api-route-guidelines)
- [Database Guidelines](#database-guidelines)
- [Testing](#testing)
- [Design & UI Guidelines](#design--ui-guidelines)
- [Common Tasks](#common-tasks)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

1. Clone the repo and follow [SETUP.md](SETUP.md) for installation
2. Read the [README.md](README.md) for architecture overview
3. Review `docs/` for internal design decisions and specifications
4. Run `npm run dev` and explore the app to understand the user experience
5. Run `npm run typecheck` and `npm run lint` before making changes

---

## Project Architecture

```
app/                    → Next.js App Router (pages + API routes)
  ├── page.tsx          → Main application entry + state management
  ├── globals.css       → All styles (single CSS file)
  └── api/              → Server-side API routes
components/             → React components (client-side)
lib/                    → Shared utilities (used by both server + client)
  ├── db.ts             → SQLite database layer (server-only)
  ├── types.ts          → TypeScript type definitions
  ├── minimax.ts        → Image generation client (server-only)
  ├── validation.ts     → Input sanitization
  ├── defaults.ts       → Feature modes + tool definitions
  ├── api.ts            → Request/response helpers
  └── id.ts             → ID generation
docs/                   → Internal design documentation
public/generated/       → Generated images (gitignored)
data/                   → SQLite database (gitignored)
```

### Key Architectural Decisions

1. **Single-page app with server routes**: The entire UI is one Next.js page (`app/page.tsx`) with client-side state management. API routes handle all data operations.

2. **No state management library**: State lives in React hooks within `app/page.tsx` and flows down via props. This keeps the architecture simple for the current scale.

3. **Single CSS file**: All styles are in `app/globals.css` using CSS custom properties. No CSS modules, Tailwind, or CSS-in-JS.

4. **SQLite for everything**: One database handles projects, objects, connections, sources, memory, chat, and versions. All CRUD is centralized in `lib/db.ts`.

5. **Server-only imports**: `lib/db.ts` and `lib/minimax.ts` use Node.js APIs (`better-sqlite3`, `fs`) and must only be imported in API routes, never in client components.

---

## Development Workflow

### Branch Strategy

- **Default branch**: `codex/local-mvp-scaffold`
- Create feature branches from the default branch
- Use descriptive branch names: `feat/add-pdf-export`, `fix/canvas-drag-offset`

### Before Making Changes

```bash
# Ensure you're on the latest code
git pull origin codex/local-mvp-scaffold

# Verify everything passes
npm run typecheck
npm run lint
```

### After Making Changes

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build (catches issues type check misses)
npm run build

# Manual browser test (always do this for UI changes)
npm run dev
# Then test the affected features in browser
```

---

## Code Style & Conventions

### TypeScript

- **Strict mode is enforced** — no `any` types (ESLint `@typescript-eslint/no-explicit-any: "error"`)
- **No unused variables** — except those prefixed with `_` (ESLint `argsIgnorePattern: "^_"`)
- Use explicit return types on exported functions
- Prefer `interface` for object shapes, `type` for unions/intersections
- All types live in `lib/types.ts`

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | camelCase for libs, PascalCase for components | `db.ts`, `HomeHub.tsx` |
| React components | PascalCase | `WorkspaceCanvas` |
| Functions | camelCase | `createProject()` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_SETTINGS` |
| CSS classes | kebab-case | `.canvas-object-box` |
| CSS variables | kebab-case with `--` prefix | `--bg`, `--accent` |
| Database tables | snake_case | `project_settings` |
| API routes | kebab-case paths | `/api/projects/[projectId]` |

### Import Order

1. React / Next.js
2. Third-party libraries (`zod`, `lucide-react`, `clsx`)
3. Local lib utilities (`lib/...`)
4. Local components (`components/...`)
5. Types (import type)

### Error Handling

- API routes: Use `try/catch` and return structured JSON errors with appropriate status codes
- Client components: Handle loading/error states in the UI
- Database operations: Use `lib/api.ts` helpers (`validateRequest`, `errorResponse`)
- MiniMax calls: Always have a fallback (SVG placeholder)

---

## File Organization

### Adding a New Component

1. Create `components/YourComponent.tsx`
2. Add `"use client"` directive at the top (all components are client-side)
3. Define props interface
4. Export the component as default or named export
5. Add styles to `app/globals.css` (not a separate CSS file)

### Adding a New API Route

1. Create `app/api/your-route/route.ts`
2. Import from `lib/db.ts` for database operations
3. Import from `lib/api.ts` for validation/error helpers
4. Use `lib/validation.ts` for input sanitization
5. Handle all HTTP methods you need (GET, POST, PATCH, DELETE)

### Adding a New Library Utility

1. Add to existing files in `lib/` if it fits
2. Or create a new `lib/your-utility.ts`
3. If it uses Node.js APIs, it's server-only — do NOT import in client components
4. Add types to `lib/types.ts`

---

## Component Guidelines

### Structure

```tsx
"use client";

import { useState } from "react";
import type { SomeType } from "@/lib/types";

interface YourComponentProps {
  // Props with explicit types
  data: SomeType;
  onAction: (id: string) => void;
}

export default function YourComponent({ data, onAction }: YourComponentProps) {
  const [state, setState] = useState<string>("");

  return (
    <section className="your-component" aria-label="Description">
      {/* Content */}
    </section>
  );
}
```

### Rules

- Always use `"use client"` directive for components (they use hooks, event handlers, etc.)
- Define a `Props` interface for every component
- Use semantic HTML elements (`<section>`, `<nav>`, `<main>`, `<button>`)
- Add `aria-label` attributes to all interactive elements
- Handle empty states ("No items yet" messages)
- Support keyboard navigation (focusable elements, keyboard events)

---

## API Route Guidelines

### Structure

```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateRequest, errorResponse } from "@/lib/api";
import { someDbFunction } from "@/lib/db";
import { sanitizeString, clampNumber } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.field) {
      return errorResponse("Missing required field", 400);
    }

    // Sanitize inputs
    const sanitized = sanitizeString(body.field, 200);

    // Perform database operation
    const result = someDbFunction(sanitized);

    return NextResponse.json({ result });
  } catch (err) {
    return errorResponse("Internal error", 500);
  }
}
```

### Rules

- Always validate and sanitize user input
- Use `lib/validation.ts` for string sanitization and number clamping
- Return consistent JSON response shapes
- Use appropriate HTTP status codes (200, 201, 400, 404, 500)
- Handle errors gracefully — never expose internal error details to the client
- Keep route handlers thin — delegate to `lib/db.ts` for business logic

---

## Database Guidelines

### Adding a New Table

1. Add the `CREATE TABLE IF NOT EXISTS` statement in `lib/db.ts` in the `initDb()` function
2. Add CRUD functions in `lib/db.ts` following existing patterns
3. Add the corresponding TypeScript types in `lib/types.ts`
4. Use parameterized queries (never string interpolation) to prevent SQL injection

### Query Patterns

```typescript
// Read (get one)
const row = db.prepare("SELECT * FROM table WHERE id = ?").get(id);

// Read (get many)
const rows = db.prepare("SELECT * FROM table WHERE project_id = ? ORDER BY created_at DESC").all(projectId);

// Write
db.prepare("INSERT INTO table (id, field) VALUES (?, ?)").run(id, field);

// Update
db.prepare("UPDATE table SET field = ? WHERE id = ?").run(newValue, id);

// Delete
db.prepare("DELETE FROM table WHERE id = ?").run(id);
```

### Rules

- Always use prepared statements with `?` placeholders
- Use `db.transaction()` for operations that modify multiple tables
- Add `ON DELETE CASCADE` for foreign keys that should auto-delete
- Use `safeParseObject()` when reading JSON columns
- Keep all database operations in `lib/db.ts` — no raw SQL in API routes

---

## Testing

### Manual Testing Checklist

Before submitting changes, verify:

1. **Home Page**: Mode selector works, prompt accepts input, "Create atlas" creates a project
2. **Canvas**: Objects render, drag works, resize works, connections draw
3. **Toolbar**: All 12 tools respond to clicks
4. **Right Panel**: Opens/closes, all 11 sections expand
5. **Chat**: Opens, accepts input, responds to `learn` / `strict source` / `clear chat`
6. **Settings**: Changes persist across page reload
7. **Delete**: Object deletion works with both "detach" and "delete branch" modes
8. **Responsive**: Test at 1440px, 768px, and 390px widths

### Automated Checks

```bash
npm run typecheck    # TypeScript errors
npm run lint         # ESLint errors
npm run build        # Build errors
```

### Browser Testing

Test in:
- Chrome/Chromium (primary)
- Firefox
- Safari (if on macOS)

---

## Design & UI Guidelines

### Color Theme

The app uses a warm ivory/brown theme defined in CSS custom properties:

```css
--bg: #f7efd9;          /* Page background */
--paper: #fffaf0;       /* Card/panel background */
--ink: #2d271c;         /* Primary text */
--ink-light: #6b5e4f;   /* Secondary text */
--accent: #d49b2a;      /* Buttons, highlights, links */
--accent-hover: #b8841e;/* Hover state for accent */
--danger: #9b382c;      /* Delete, error states */
--border: #e4d8c1;      /* Borders, dividers */
--shadow: rgba(45,39,28,0.08); /* Box shadows */
```

### Layout Breakpoints

```css
@media (max-width: 820px)  /* Sidebar collapses, toolbar repositions */
@media (max-width: 560px)  /* Mobile layout — full-width chat, stacked elements */
```

### UI Principles

1. **Warm and professional** — avoid bright neon colors or harsh contrasts
2. **Content-first** — UI chrome should be subtle, not compete with content
3. **Consistent spacing** — use multiples of 4px (4, 8, 12, 16, 24, 32)
4. **Smooth transitions** — 160ms for most animations, respect `prefers-reduced-motion`
5. **Accessible** — ARIA labels, focus states, keyboard navigation, contrast ratios

---

## Common Tasks

### Adding a New Tool

1. Add the tool definition in `lib/defaults.ts` (`toolDefinitions` array)
2. Add the tool icon mapping in `components/FloatingToolbar.tsx` (`toolIcons` object)
3. Add the tool handler in `app/api/generate/route.ts` (in the `tool` action handler)
4. Add the tool button to context menus in `components/WorkspaceCanvas.tsx`
5. Test the tool from toolbar, context menu, and chat

### Adding a New Right Panel Section

1. Add the section name to the sections array in `components/RightPanel.tsx`
2. Create the section content JSX in the render function
3. Add any new data fetching in `app/page.tsx` and pass as props
4. Style the section in `app/globals.css`

### Adding a New Feature Mode

1. Add the mode to the `Mode` type in `lib/types.ts`
2. Add mode metadata in `lib/defaults.ts` (`featureModes` array)
3. Update `components/HomeHub.tsx` to display the new mode
4. Update generation logic in `app/api/generate/route.ts` if the mode needs special handling

### Adding a New Database Table

1. Add `CREATE TABLE IF NOT EXISTS` in `lib/db.ts` → `initDb()`
2. Add TypeScript types in `lib/types.ts`
3. Add CRUD functions in `lib/db.ts`
4. Create API routes in `app/api/` as needed
5. Wire up the UI in components

---

## Pull Request Process

1. **Branch**: Create a descriptive feature branch
2. **Implement**: Make your changes following the guidelines above
3. **Verify**:
   - `npm run typecheck` — 0 errors
   - `npm run lint` — 0 errors
   - `npm run build` — succeeds
   - Manual browser testing of affected features
4. **Commit**: Use clear, descriptive commit messages
5. **PR Description**: Include:
   - What changed and why
   - Screenshots for UI changes
   - Testing steps for reviewers
6. **Review**: Address feedback promptly

### Commit Message Format

```
<type>: <short description>

<optional body with details>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

Examples:
```
feat: add PDF export to right panel
fix: canvas drag offset incorrect after zoom
docs: update SETUP.md with Windows instructions
refactor: extract settings form into reusable components
```
