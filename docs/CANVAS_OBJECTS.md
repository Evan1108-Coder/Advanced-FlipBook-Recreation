# Canvas & Objects

The workspace uses an infinite canvas where knowledge objects can be:

- **Dragged** to any position
- **Resized** from four corners (NW, NE, SE, SW)
- **Connected** to other objects with labeled edges
- **Branched** by clicking image regions (creates child levels)
- **Inspected** via the right panel Object Inspector

## Object Types

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

## Object Properties

Each object stores: `id`, `project_id`, `type`, `title`, `x`, `y`, `w`, `h`, `parent_id`, `depth`, `payload` (JSON), `image_url`, `status`, `created_at`, `updated_at`.
