"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { SettingsControls } from "@/components/SettingsControls";
import { panelSections } from "@/lib/defaults";
import type { CanvasObject, PanelSection, ProjectBundle, ProjectSettings } from "@/lib/types";

export type RightPanelProps = {
  bundle: ProjectBundle;
  activeSection?: PanelSection;
  section?: PanelSection;
  selectedObject?: CanvasObject | null;
  selectedObjectId?: string | null;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onSectionChange?: (section: PanelSection) => void;
  onClose?: () => void;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  onWidthChange?: (width: number) => void;
  onRefresh?: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const panelStyle: CSSProperties = {
  background: "#f8f3ea",
  borderLeft: "1px solid #d8cdbc",
  boxShadow: "-12px 0 28px rgba(61, 49, 36, 0.09)",
  color: "#2f2923",
  display: "grid",
  gridTemplateRows: "auto 1fr",
  height: "100%",
  inset: "0 0 auto auto",
  maxHeight: "100vh",
  minWidth: 280,
  position: "fixed",
  zIndex: 45
};

const headerStyle: CSSProperties = {
  borderBottom: "1px solid #ded4c5",
  display: "grid",
  gap: 12,
  padding: "16px 16px 12px"
};

const sectionTabsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6
};

const bodyStyle: CSSProperties = {
  minHeight: 0,
  overflow: "auto",
  padding: 16
};

const cardStyle: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid #e1d7c9",
  borderRadius: 8,
  display: "grid",
  gap: 8,
  padding: 12
};

const mutedStyle: CSSProperties = {
  color: "#776d62",
  fontSize: 12,
  lineHeight: 1.45
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  margin: 0,
  padding: 0
};

function getPayloadString(object: CanvasObject | undefined, keys: string[]) {
  if (!object) return "";

  for (const key of keys) {
    const value = object.payload[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return "";
}

function getPayloadList(object: CanvasObject | undefined, keys: string[]) {
  if (!object) return [];

  for (const key of keys) {
    const value = object.payload[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "text" in item && typeof item.text === "string") return item.text;
          if (item && typeof item === "object" && "claim" in item && typeof item.claim === "string") return item.claim;
          return "";
        })
        .filter(Boolean);
    }
  }

  return [];
}

function EmptyState({ children }: { children: string }) {
  return (
    <div style={cardStyle}>
      <p style={{ ...mutedStyle, margin: 0 }}>{children}</p>
    </div>
  );
}

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <h3 style={{ fontSize: 15, margin: 0 }}>{title}</h3>
      {detail ? <p style={{ ...mutedStyle, margin: 0 }}>{detail}</p> : null}
    </div>
  );
}

function SourcesSection({ bundle, onRefresh }: { bundle: ProjectBundle; onRefresh?: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");

  async function addSource() {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/projects/${bundle.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "add-source", source: { title: newTitle.trim(), url: newUrl.trim(), excerpt: newExcerpt.trim() || "Manually added source." } })
      });
      if (res.ok) {
        setNewTitle("");
        setNewUrl("");
        setNewExcerpt("");
        setShowAdd(false);
        onRefresh?.();
      }
    } catch {}
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail={`${bundle.sources.length} source${bundle.sources.length === 1 ? "" : "s"} attached`} title="Sources" />
      <button
        type="button"
        onClick={() => setShowAdd(!showAdd)}
        style={{ border: "1px dashed #d8cdbc", borderRadius: 8, background: "transparent", color: "#3b342d", padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
      >
        {showAdd ? "Cancel" : "+ Add source"}
      </button>
      {showAdd ? (
        <div style={{ ...cardStyle, gap: 10 }}>
          <input
            type="text"
            placeholder="Source title"
            aria-label="Source title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ border: "1px solid #e1d7c9", borderRadius: 6, padding: "7px 9px", font: "inherit", fontSize: 13 }}
          />
          <input
            type="url"
            placeholder="URL (optional)"
            aria-label="Source URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ border: "1px solid #e1d7c9", borderRadius: 6, padding: "7px 9px", font: "inherit", fontSize: 13 }}
          />
          <textarea
            placeholder="Excerpt or description"
            aria-label="Source excerpt or description"
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
            rows={3}
            style={{ border: "1px solid #e1d7c9", borderRadius: 6, padding: "7px 9px", font: "inherit", fontSize: 13, resize: "vertical" }}
          />
          <button
            type="button"
            disabled={!newTitle.trim()}
            onClick={addSource}
            style={{ border: 0, borderRadius: 6, background: "#2f2923", color: "#fffaf0", padding: "8px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >
            Add
          </button>
        </div>
      ) : null}
      {bundle.sources.length ? (
        <ul style={listStyle}>
          {bundle.sources.map((source) => (
            <li key={source.id} style={{ ...cardStyle, listStyle: "none" }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ fontSize: 13 }}>{source.title}</strong>
                <span style={{ ...mutedStyle, textTransform: "capitalize" }}>{source.quality}</span>
              </div>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: "#3f6f5d", fontSize: 12, overflowWrap: "anywhere" }}>
                  {source.url}
                </a>
              ) : null}
              <p style={{ ...mutedStyle, margin: 0 }}>{source.excerpt}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No sources have been added to this project yet. Click "+ Add source" above to attach one.</EmptyState>
      )}
    </div>
  );
}

function MemorySection({ bundle }: { bundle: ProjectBundle }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail={`${bundle.memory.length} saved item${bundle.memory.length === 1 ? "" : "s"}`} title="Memory" />
      {bundle.memory.length ? (
        <ul style={listStyle}>
          {bundle.memory.map((item) => (
            <li key={item.id} style={{ ...cardStyle, listStyle: "none" }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ fontSize: 13, textTransform: "capitalize" }}>{item.kind}</strong>
                {item.pinned ? <span style={mutedStyle}>Pinned</span> : null}
              </div>
              <p style={{ ...mutedStyle, margin: 0 }}>{item.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Project memory is empty.</EmptyState>
      )}
    </div>
  );
}

function ObjectInspectorSection({ object }: { object?: CanvasObject }) {
  if (!object) return <EmptyState>Select a canvas object to inspect its details.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail={object.type.replace("_", " ")} title={object.title} />
      <div style={cardStyle}>
        <dl style={{ display: "grid", gap: 8, margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <dt style={mutedStyle}>Position</dt>
            <dd style={{ margin: 0 }}>
              {object.x}, {object.y}
            </dd>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <dt style={mutedStyle}>Size</dt>
            <dd style={{ margin: 0 }}>
              {object.width} x {object.height}
            </dd>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <dt style={mutedStyle}>Updated</dt>
            <dd style={{ margin: 0 }}>{new Date(object.updatedAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>Payload</strong>
        <pre style={{ ...mutedStyle, margin: 0, overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(object.payload, null, 2)}</pre>
      </div>
    </div>
  );
}

function TranscriptSection({ object }: { object?: CanvasObject }) {
  const transcript = getPayloadString(object, ["transcript", "text", "summary", "description"]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle title="Transcript" />
      {transcript ? <div style={cardStyle}>{transcript}</div> : <EmptyState>No transcript is available for the selected object.</EmptyState>}
    </div>
  );
}

function ClaimsSection({ object }: { object?: CanvasObject }) {
  const claims = getPayloadList(object, ["claims", "unsupportedClaims"]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle title="Claims" />
      {claims.length ? (
        <ul style={listStyle}>
          {claims.map((claim, index) => (
            <li key={`${claim}-${index}`} style={{ ...cardStyle, listStyle: "none" }}>
              {claim}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No claims are available for the selected object.</EmptyState>
      )}
    </div>
  );
}

function NotesSection({ bundle, object }: { bundle: ProjectBundle; object?: CanvasObject }) {
  const objectNotes = getPayloadList(object, ["notes", "highlights"]);
  const noteObjects = bundle.objects.filter((item) => item.type === "note");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail={`${objectNotes.length + noteObjects.length} note${objectNotes.length + noteObjects.length === 1 ? "" : "s"}`} title="Notes" />
      {objectNotes.length || noteObjects.length ? (
        <ul style={listStyle}>
          {objectNotes.map((note, index) => (
            <li key={`payload-note-${index}`} style={{ ...cardStyle, listStyle: "none" }}>
              {note}
            </li>
          ))}
          {noteObjects.map((note) => (
            <li key={note.id} style={{ ...cardStyle, listStyle: "none" }}>
              <strong style={{ fontSize: 13 }}>{note.title}</strong>
              <p style={{ ...mutedStyle, margin: 0 }}>{getPayloadString(note, ["text", "note", "summary"]) || "No note text."}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No notes have been saved yet.</EmptyState>
      )}
    </div>
  );
}

function VersionsSection({ object }: { object?: CanvasObject }) {
  const versions = getPayloadList(object, ["versions", "history"]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle title="Versions" />
      {versions.length ? (
        <ul style={listStyle}>
          {versions.map((version, index) => (
            <li key={`${version}-${index}`} style={{ ...cardStyle, listStyle: "none" }}>
              {version}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Version history will appear here when restore points are available.</EmptyState>
      )}
    </div>
  );
}

function ExportSection({ bundle, object }: { bundle: ProjectBundle; object?: CanvasObject }) {
  const [copied, setCopied] = useState(false);
  const markdown = `# ${object?.title ?? bundle.project.name}\n\n${object?.payload.transcript ?? bundle.project.description}\n\nSources: ${bundle.sources.length}`;

  function handleCopy() {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = markdown;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(fallback);
    } else {
      fallback();
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail="Prepare project materials for handoff." title="Export" />
      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>Available scope</strong>
        <span style={mutedStyle}>Project: {bundle.project.name}</span>
        <span style={mutedStyle}>Selected object: {object?.title ?? "None"}</span>
        <span style={mutedStyle}>Objects: {bundle.objects.length}</span>
        <span style={mutedStyle}>Sources: {bundle.sources.length}</span>
      </div>
      <textarea readOnly value={markdown} style={{ minHeight: 160, border: "1px solid #e1d7c9", borderRadius: 8, padding: 10, resize: "vertical" }} />
      <button style={{ border: "1px solid #d8cdbc", borderRadius: 8, background: "#2f2923", color: "#fffaf0", padding: "8px 10px" }} onClick={handleCopy}>
        {copied ? "Copied!" : "Copy Markdown Export"}
      </button>
    </div>
  );
}

function CheckUnderstandingSection({ object }: { object?: CanvasObject }) {
  const questions = getPayloadList(object, ["questions", "checks", "reviewCards"]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle title="Check Understanding" />
      {questions.length ? (
        <ul style={listStyle}>
          {questions.map((question, index) => (
            <li key={`${question}-${index}`} style={{ ...cardStyle, listStyle: "none" }}>
              {question}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Review questions will appear here after this branch has study material.</EmptyState>
      )}
    </div>
  );
}

function ChatTranscriptSection({ bundle }: { bundle: ProjectBundle }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <SectionTitle detail={`${bundle.chat.length} message${bundle.chat.length === 1 ? "" : "s"}`} title="Transcript" />
      {bundle.chat.length ? (
        <ul style={listStyle}>
          {bundle.chat.map((message) => (
            <li key={message.id} style={{ ...cardStyle, listStyle: "none" }}>
              <strong style={{ fontSize: 13, textTransform: "capitalize" }}>{message.role}</strong>
              <p style={{ ...mutedStyle, margin: 0 }}>{message.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>No chat transcript is available yet.</EmptyState>
      )}
    </div>
  );
}

export function RightPanel({
  bundle,
  activeSection,
  section,
  selectedObject: selectedObjectProp,
  selectedObjectId,
  width,
  minWidth = 280,
  maxWidth = 560,
  onSectionChange,
  onClose,
  onSettingsChange,
  onWidthChange,
  onRefresh
}: RightPanelProps) {
  const [internalSection, setInternalSection] = useState<PanelSection>(activeSection ?? section ?? panelSections[0]);
  const currentSection = activeSection ?? section ?? internalSection;
  const panelWidth = clamp(width ?? bundle.settings.rightPanelWidth, minWidth, maxWidth);

  const selectedObject = useMemo(
    () => selectedObjectProp ?? bundle.objects.find((object) => object.id === selectedObjectId),
    [bundle.objects, selectedObjectId, selectedObjectProp]
  );

  const selectSection = (section: PanelSection) => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose!();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!onWidthChange) return;

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth;

    const move = (moveEvent: PointerEvent) => {
      onWidthChange(clamp(startWidth + startX - moveEvent.clientX, minWidth, maxWidth));
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      cleanupRef.current = null;
    };

    cleanupRef.current?.();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
    cleanupRef.current = stop;
  };

  const content = (() => {
    switch (currentSection) {
      case "Sources":
        return <SourcesSection bundle={bundle} onRefresh={onRefresh} />;
      case "Project Settings":
        return <SettingsControls onSettingsChange={onSettingsChange} section="project" settings={bundle.settings} />;
      case "Chat Settings":
        return <SettingsControls onSettingsChange={onSettingsChange} section="chat" settings={bundle.settings} />;
      case "Memory":
        return <MemorySection bundle={bundle} />;
      case "Object Inspector":
        return <ObjectInspectorSection object={selectedObject} />;
      case "Transcript":
        return <TranscriptSection object={selectedObject} />;
      case "Claims":
        return <ClaimsSection object={selectedObject} />;
      case "Notes":
        return <NotesSection bundle={bundle} object={selectedObject} />;
      case "Versions":
        return <VersionsSection object={selectedObject} />;
      case "Export":
        return <ExportSection bundle={bundle} object={selectedObject} />;
      case "Check Understanding":
        return <CheckUnderstandingSection object={selectedObject} />;
      default:
        return <ChatTranscriptSection bundle={bundle} />;
    }
  })();

  return (
    <aside aria-label="Project side panel" style={{ ...panelStyle, width: `min(${panelWidth}px, 100vw)` }}>
      <button
        aria-label="Resize right panel"
        disabled={!onWidthChange}
        tabIndex={-1}
        onPointerDown={startResize}
        style={{
          background: "transparent",
          border: 0,
          bottom: 0,
          cursor: onWidthChange ? "col-resize" : "default",
          left: 0,
          padding: 0,
          position: "absolute",
          top: 0,
          width: 10,
          zIndex: 2
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          style={{
            background: "#b9aa96",
            borderRadius: 999,
            display: "block",
            height: 44,
              left: 3,
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            width: 2
          }}
        />
      </button>
      <header style={headerStyle}>
        <div style={{ display: "grid", gap: 2 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{bundle.project.name}</h2>
          <p style={{ ...mutedStyle, margin: 0 }}>{bundle.project.description || "Project workspace"}</p>
        </div>
        {onClose ? (
          <button
            aria-label="Close right panel"
            onClick={onClose}
            style={{
              background: "#fffdf8",
              border: "1px solid #d8cdbc",
              borderRadius: 8,
              color: "#3b342d",
              font: "inherit",
              fontSize: 12,
              fontWeight: 700,
              justifySelf: "start",
              padding: "6px 8px"
            }}
            type="button"
          >
            Close
          </button>
        ) : null}
        <nav aria-label="Right panel sections" role="tablist" style={sectionTabsStyle}>
          {panelSections.map((section) => {
            const isActive = section === currentSection;
            return (
              <button
                role="tab"
                aria-selected={isActive}
                key={section}
                onClick={() => selectSection(section)}
                style={{
                  background: isActive ? "#314f44" : "#fffdf8",
                  border: "1px solid #d8cdbc",
                  borderRadius: 8,
                  color: isActive ? "#fffdf8" : "#3b342d",
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 8px"
                }}
                type="button"
              >
                {section}
              </button>
            );
          })}
        </nav>
      </header>
      <div style={bodyStyle}>{content}</div>
    </aside>
  );
}
