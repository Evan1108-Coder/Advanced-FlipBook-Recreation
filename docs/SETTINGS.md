# Settings System

Settings operate at three levels with cascading overrides:

1. **Global Defaults** (hardcoded in `lib/defaults.ts`)
2. **Project Settings** (stored in `project_settings` table)
3. **Object/Tool Settings** (stored in object's `payload` JSON)

## Key Settings

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
