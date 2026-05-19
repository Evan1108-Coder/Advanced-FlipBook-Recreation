# Test Plan

## Smoke Flow

1. Start local dev server.
2. Open home.
3. Create a Flipbook project from prompt.
4. Verify project opens with first level.
5. Click a region on the level and verify a child level appears with a dotted connector.
6. Click a different region on the same level and verify a second child appears.
7. Drag and resize a level; connector should reroute.
8. Select a level; toolbar tools should enable.
9. Use Learn; connected tool result appears.
10. Use Ask; connected ask box appears and accepts a question.
11. Open right panel to Sources, then Project Settings, then Chat Settings.
12. Resize right panel.
13. Change a setting, reload, and verify it persists.
14. Expand and collapse chat bubble.
15. Delete a child and verify delete behavior follows project setting.

## UI Bugs To Search For

- Text overflowing buttons/cards/panels.
- Toolbar overlapping chat/right panel.
- Right panel covering important controls without reposition.
- Connector lines rendering above boxes.
- Context menus clipped by viewport.
- Mobile layout hiding primary actions.
- Animation causing layout jumps.
- Focus states missing.
- Disabled tools looking clickable.

## Logic Bugs To Search For

- Creating children from wrong parent.
- Multiple clicks overwriting old children.
- Settings not scoped to project.
- Chat history leaking across projects.
- Memory leaking across projects.
- Objects saved without connections.
- Deleted object leaves broken selected state.
- Reload losing object position or size.
- MiniMax error leaves stuck loading.
- Placeholder generation not deterministic enough for tests.

## Persistence Bugs To Search For

- Project not created.
- Project list not updated.
- Objects not rehydrated in correct order.
- JSON settings malformed.
- Asset path missing.
- Versions not written on regeneration.
- Chat messages not stored.

## Final Verification

- Run lint/typecheck/build if available.
- Run automated tests if added.
- Browser smoke test desktop and mobile.
- Review docs for drift from implemented behavior.

## Current Verification Notes

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- API smoke passed for project creation with uploaded-source metadata, child generation, settings persistence/clamping, delete confirmation, and malformed chat validation.
- Generation uses MiniMax when `MINIMAX_API_KEY` is set and local placeholder visuals otherwise.
- Remaining future depth: richer source ingestion, true image-region understanding, real chat model responses, collaborative sessions, audio/video layers, and production-grade canvas auto-routing.
