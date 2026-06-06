# AI Chat

The Atlas Chat bubble (bottom-right corner) provides:

- **Context Display**: Shows current project name, memory status, source mode
- **Pinned Memory**: Displays pinned memory items as context
- **Operator Actions**: Recognizes keyword commands:
  - `learn` -- Creates a Learn tool result for the topic
  - `strict source` -- Switches to strict source-only mode
  - `clear chat` -- Clears chat history for the current project
- **Message History**: Persists chat messages per project in SQLite

> Note: The current chat implementation uses keyword matching, not a language model. Responses are template-based.
