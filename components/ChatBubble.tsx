"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Brain, ChevronDown, MessageCircle, Send, Settings, ShieldCheck } from "lucide-react";
import type { CanvasObject, ChatMessage, MemoryItem, ProjectBundle, ProjectSettings } from "@/lib/types";

type ChatBubbleProps = {
  bundle?: ProjectBundle | null;
  selectedObject?: CanvasObject | null;
  messages?: ChatMessage[];
  memory?: MemoryItem[];
  settings?: ProjectSettings;
  selectedObjectTitle?: string;
  isSending?: boolean;
  onSend?: (message: string) => void | Promise<void>;
  onSendMessage?: (message: string) => void | Promise<void>;
  onOpenSettings?: () => void;
};

export function ChatBubble({
  bundle,
  selectedObject,
  messages = [],
  memory = [],
  settings,
  selectedObjectTitle,
  isSending = false,
  onSend,
  onSendMessage,
  onOpenSettings
}: ChatBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [localSending, setLocalSending] = useState(false);
  const sending = isSending || localSending;

  const resolvedMessages = bundle?.chat ?? messages;
  const resolvedMemory = bundle?.memory ?? memory;
  const resolvedSettings = bundle?.settings ?? settings;
  const contextTitle = selectedObjectTitle ?? selectedObject?.title;
  const visibleMessages = useMemo(() => resolvedMessages.filter((message) => message.role !== "system").slice(-8), [resolvedMessages]);
  const memoryEnabled = resolvedSettings?.memoryEnabled !== false;
  const pinnedMemory = useMemo(() => (memoryEnabled ? resolvedMemory.filter((item) => item.pinned).slice(0, 3) : []), [memoryEnabled, resolvedMemory]);
  const bubbleSize = resolvedSettings?.chatBubbleSize ?? "medium";

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setDraft("");
    setLocalSending(true);
    try {
      await (onSendMessage ?? onSend)?.(message);
    } finally {
      setLocalSending(false);
    }
  }

  if (!expanded) {
    return (
      <button type="button" className={`chat-launch ${bubbleSize}`} aria-label="Open AI chat" onClick={() => setExpanded(true)}>
        <MessageCircle size={22} aria-hidden />
        {resolvedMessages.length ? <span>{resolvedMessages.length}</span> : null}
        <style jsx>{`
          .chat-launch {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 40;
            display: grid;
            place-items: center;
            border: 1px solid rgba(44, 39, 30, 0.16);
            border-radius: 999px;
            background: #29261f;
            color: #fff8e8;
            box-shadow: 0 18px 50px rgba(45, 39, 28, 0.18);
            cursor: pointer;
          }
          .small {
            width: 46px;
            height: 46px;
          }
          .medium {
            width: 56px;
            height: 56px;
          }
          .large {
            width: 64px;
            height: 64px;
          }
          span {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 20px;
            height: 20px;
            padding: 0 5px;
            border-radius: 999px;
            background: #f1cf68;
            color: #252117;
            font-size: 12px;
            font-weight: 700;
            line-height: 20px;
          }
        `}</style>
      </button>
    );
  }

  return (
    <section className="chat-panel" aria-label="AI chat">
      <header>
        <div className="title-row">
          <Bot size={19} aria-hidden />
          <div>
            <strong>Atlas chat</strong>
            <span>{contextTitle ? `Using ${contextTitle}` : "Using project context"}</span>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" aria-label="Chat settings" title="Chat settings" onClick={onOpenSettings}>
            <Settings size={17} aria-hidden />
          </button>
          <button type="button" aria-label="Collapse chat" title="Collapse chat" onClick={() => setExpanded(false)}>
            <ChevronDown size={18} aria-hidden />
          </button>
        </div>
      </header>

      <div className="context-strip" aria-label="Chat context">
        <span>
          <Brain size={15} aria-hidden />
          Memory {memoryEnabled ? "on" : "off"} · {memoryEnabled ? resolvedMemory.length : 0} item{resolvedMemory.length === 1 ? "" : "s"}
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden />
          Sources {resolvedSettings?.sourceStrictness ?? "balanced"}
        </span>
      </div>

      {pinnedMemory.length ? (
        <div className="memory-preview" aria-label="Pinned memory">
          {pinnedMemory.map((item) => (
            <span key={item.id}>{item.text}</span>
          ))}
        </div>
      ) : null}

      <div className="messages" aria-live="polite">
        {visibleMessages.length ? (
          visibleMessages.map((message) => (
            <article key={message.id} className={message.role === "user" ? "message user" : "message assistant"}>
              <span>{message.role === "user" ? "You" : "Atlas"}</span>
              <p>{message.content}</p>
            </article>
          ))
        ) : (
          <div className="empty-chat">
            <MessageCircle size={24} aria-hidden />
            <span>Ask for a branch, explanation, source check, or tool action.</span>
          </div>
        )}
      </div>

      <form onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask Atlas to explain, create a Learn result, or tighten sources..."
          aria-label="Chat message"
          rows={3}
        />
        <button type="submit" disabled={!draft.trim() || sending} aria-label="Send message">
          <Send size={17} aria-hidden />
        </button>
      </form>

      <style jsx>{`
        .chat-panel {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 40;
          display: grid;
          grid-template-rows: auto auto auto minmax(0, 1fr) auto;
          width: min(420px, calc(100vw - 28px));
          height: min(620px, calc(100vh - 44px));
          border: 1px solid rgba(44, 39, 30, 0.16);
          border-radius: 8px;
          background: #fffaf0;
          color: #29261f;
          box-shadow: 0 22px 70px rgba(45, 39, 28, 0.2);
          overflow: hidden;
        }
        button,
        textarea {
          font: inherit;
        }
        header,
        .title-row,
        .header-actions,
        .context-strip,
        .context-strip span,
        form {
          display: flex;
          align-items: center;
        }
        header {
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border-bottom: 1px solid rgba(44, 39, 30, 0.1);
        }
        .title-row {
          gap: 10px;
          min-width: 0;
        }
        .title-row div {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .title-row span,
        .context-strip,
        .message span,
        .empty-chat span {
          color: #716957;
          font-size: 12px;
        }
        .title-row span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .header-actions {
          gap: 6px;
        }
        .header-actions button,
        form button {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(44, 39, 30, 0.12);
          border-radius: 7px;
          background: #fff5dd;
          color: #29261f;
          cursor: pointer;
        }
        .context-strip {
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(44, 39, 30, 0.08);
        }
        .context-strip span {
          gap: 5px;
          padding: 6px 8px;
          border: 1px solid rgba(44, 39, 30, 0.1);
          border-radius: 999px;
          background: #fffdf7;
        }
        .memory-preview {
          display: grid;
          gap: 6px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(44, 39, 30, 0.08);
          background: #fbf0cf;
        }
        .memory-preview span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #5b4a25;
          font-size: 12px;
        }
        .messages {
          min-height: 0;
          overflow: auto;
          display: grid;
          align-content: start;
          gap: 10px;
          padding: 14px;
          background: #fffaf0;
        }
        .message {
          display: grid;
          gap: 4px;
          max-width: 88%;
        }
        .message p {
          margin: 0;
          padding: 10px 11px;
          border-radius: 8px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }
        .assistant p {
          background: #f4ead0;
        }
        .user {
          justify-self: end;
        }
        .user span {
          text-align: right;
        }
        .user p {
          background: #29261f;
          color: #fff8e8;
        }
        .empty-chat {
          display: grid;
          place-items: center;
          gap: 10px;
          min-height: 210px;
          text-align: center;
        }
        form {
          gap: 10px;
          padding: 12px;
          border-top: 1px solid rgba(44, 39, 30, 0.1);
          background: #fffdf7;
        }
        form textarea {
          min-width: 0;
          flex: 1;
          resize: none;
          border: 1px solid rgba(44, 39, 30, 0.12);
          border-radius: 8px;
          outline: none;
          padding: 10px;
          background: #fffaf0;
          color: inherit;
          line-height: 1.4;
        }
        form textarea:focus-visible {
          outline: 2px solid rgba(125, 79, 19, 0.8);
          outline-offset: 2px;
        }
        form button {
          flex: 0 0 auto;
          background: #29261f;
          color: #fff8e8;
        }
        form button:disabled {
          cursor: not-allowed;
          opacity: 0.42;
        }
        @media (max-width: 560px) {
          .chat-panel {
            inset: auto 10px 10px 10px;
            width: auto;
            height: min(620px, calc(100vh - 20px));
          }
        }
      `}</style>
    </section>
  );
}

export default ChatBubble;
