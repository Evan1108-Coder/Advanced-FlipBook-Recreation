# Advanced FlipBook Recreation Product Brief

Advanced FlipBook Recreation is a local-first AI visual knowledge workspace. It combines the spirit of Flipbook's infinite generated visual browser with a professional canvas, project memory, source-aware learning tools, and structured outputs for research, teaching, visual thinking, and self-directed discovery.

## Product Promise

Start with a prompt, source, or question. Generate a visual flipbook page. Click meaningful regions to branch into deeper pages. Use tools like Learn, Ask, Analyze, Compare, Timeline, Knowledge Map, Source Brief, Textbook Image, Study Guide, and Presentation. Every page and result becomes a movable, resizable object on an infinite canvas with persistent memory and sources.

## Audience

- Curious professionals researching complex topics.
- Educators building visual explainers.
- Students and self-learners who want serious, source-backed material.
- Creators turning concepts into visual narratives.
- Teams mapping ideas, claims, timelines, and comparisons.

The product should feel calm, capable, and professional. It should not feel childish, decorative, or like a developer console.

## Core Principles

- Visual-first, but knowledge-structured.
- Every generated thing is revisitable, movable, and connected.
- Sources and real text live outside the generated image.
- Project memory is local, explicit, editable, and separated by project.
- Settings exist for all meaningful defaults and behaviors.
- AI should assist and operate, but risky actions require confirmation.
- The app runs locally first and persists to SQLite.

## References Researched

- Flipbook Page: an AI-native infinite visual browser where each page is generated as pixels in real time, and users click anywhere to continue exploring.
- MiniMax API docs: current image generation endpoint is `POST https://api.minimax.io/v1/image_generation` with `model: image-01`, prompt, aspect ratio, and `response_format` of `base64` or `url`.
- Dzine-style inspiration: use a left feature panel, central creation box, recent projects, and a polished creative-workspace feel, adapted to Advanced FlipBook Recreation rather than copied.

## MVP Definition

The first local build must include:

- Home hub with feature modes, prompt/upload entry, recent projects, and global settings.
- Project canvas with draggable/resizable boxes, dotted connector lines, multiple flipbooks per project, and context menus.
- Flipbook level generation flow with placeholder local generation when MiniMax is not configured and real MiniMax integration when `MINIMAX_API_KEY` exists.
- Toolbar with tools that enable/disable based on selection.
- Right panel with Sources, Project Settings, Chat Settings, Memory, Object Inspector, Transcript, Claims, Notes, Versions, Export, and Check Understanding.
- Bottom-right AI chat bubble with compact and expanded states.
- SQLite persistence for projects, objects, connections, settings, memory, sources, and chat messages.
- Smoke-tested responsive UI.
