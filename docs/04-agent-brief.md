# Agent Brief

This document is the coordination brief for any coding or testing agents.

## Product Shape

Build Lumen Atlas as a local-first professional AI visual knowledge workspace. The main workspace is an infinite canvas. The flagship object is a Flipbook where each level is a generated visual page. Clicking regions creates connected child levels. Tools produce connected result boxes.

## Non-Negotiables

- Keep the UI efficient and professional.
- Warm ivory/yellow tone, restrained.
- Do not create a decorative landing page instead of the app.
- Every major feature must be represented in working MVP form.
- Persist project state to SQLite.
- MiniMax integration must be real when `MINIMAX_API_KEY` exists.
- App must remain usable with local placeholder generation when the API key is missing.
- Project settings are project-specific.
- Global settings only define defaults.
- Do not overwrite unrelated user changes.

## Coding Boundaries

Suggested ownership:

- Canvas agent: canvas objects, dragging, resizing, connector routing, context menus.
- Data agent: SQLite schema, repositories, API routes, seed/demo data.
- AI/generation agent: MiniMax client, placeholder generator, generation jobs, memory updates.
- Product UI agent: home, right panel, toolbar, chat bubble, settings forms.
- Testing agents: UI/responsive, logic/code, persistence/settings, user-flow smoke tests.

Agents should write down changed files and known limitations in their final message.

## Test Expectations

Test the following before declaring done:

- Create project from home.
- Generate Flipbook level.
- Click level multiple times to create multiple children.
- Drag/resize boxes and confirm lines update.
- Use toolbar tools on selected and unselected objects.
- Open and resize right panel.
- Switch right-panel sections.
- Change project settings and reload.
- Use chat bubble compact and expanded states.
- Confirm SQLite saves and reloads projects.
- Check responsive widths around 390, 768, 1280, and 1440.
- Check text overflow, animation jank, unreachable controls, disabled states, and context menus.
