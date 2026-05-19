# Information Architecture

## Home

Left panel:

- Flipbook
- Textbook Image
- Knowledge Map
- Timeline
- Compare
- Study Guide
- Source Brief
- Presentation
- Library
- Settings hover flyout

Center:

- Main prompt/chat box with upload source inside it.
- Connected mode picker below prompt.
- Recent projects below.

Global Settings:

- Appearance
- Global project defaults
- Global memory defaults
- API/providers
- Privacy
- Export defaults

## Project Workspace

Main surface:

- Infinite canvas.
- Multiple flipbooks per project.
- Flipbook level boxes.
- Connected tool result boxes.
- Source/note/output boxes.
- Dotted connector lines behind boxes.

Floating toolbar:

- Draggable and dockable.
- Vertical or horizontal orientation based on dock.
- Tools gray out when selection is invalid.

Bottom-right AI chat:

- Compact speech bubble.
- Expanded panel-sized mode.
- Can operate the project with confirmations for risky actions.

Top-right panel trigger:

- Hover shows right-panel sections.
- Click opens/switches section.
- Clicking current section closes.
- Panel resizes by dragging left border.

## Right Panel Sections

- Sources: source list, excerpts, citations, quality, unsupported claim warnings.
- Project Settings: project-scoped behavior and defaults.
- Chat Settings: bubble size, memory use, operator permissions, history controls.
- Memory: view/edit/clear project memory and pinned facts.
- Object Inspector: selected object details, prompt, parent/children, generation info.
- Transcript: readable text and outline for generated visual pages.
- Claims: extracted factual claims with confidence and source links.
- Notes: page notes, branch notes, highlights.
- Versions: prior generations and restore points.
- Export: image, PDF, Markdown, transcript, source list, selected branch.
- Check Understanding: questions, review cards, answer explanations.

## Canvas Object Types

- `flipbook`: root flipbook container.
- `level`: generated visual page/level.
- `tool_result`: Learn/Analysis/Compare/etc result.
- `ask`: question input and answer result.
- `source`: uploaded/imported source.
- `note`: user-created note.
- `map`: knowledge map output.
- `timeline`: timeline output.
- `export`: export package/result.

## Selection Rules

- Canvas background selected: background actions only.
- Flipbook level selected: all level tools available.
- Tool result selected: limited tools available.
- Multiple objects selected: organize/export/delete actions available.

## Context Menus

Canvas background:

- Start new Flipbook
- Add Note
- Import Source
- Paste
- Organize Canvas
- Project Settings

Level box:

- Explore from click
- Ask
- Learn
- Analyze
- Compare
- Timeline
- Knowledge Map
- Regenerate
- Open Sources
- Duplicate
- Delete

Tool/result box:

- Ask follow-up
- Summarize
- Save as Note
- Convert to another output
- Export
- Delete
