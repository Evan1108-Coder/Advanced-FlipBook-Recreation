"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { clsx } from "clsx";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { ConnectorLayer } from "@/components/ConnectorLayer";
import { toolDefinitions } from "@/lib/defaults";
import type { CanvasObject, CanvasObjectType, ProjectBundle } from "@/lib/types";

export type WorkspaceCanvasFrame = Pick<CanvasObject, "x" | "y" | "width" | "height">;
export type WorkspaceCanvasFramePatch = Partial<WorkspaceCanvasFrame>;
export type CanvasToolId = (typeof toolDefinitions)[number]["id"];

export type WorkspaceCanvasProps = {
  bundle: ProjectBundle;
  selectedObjectId: string | null;
  onSelect: (objectId: string | null) => void;
  onExplore: (object: CanvasObject, point: { x: number; y: number }) => void;
  onTool: (tool: CanvasToolId | string, objectId?: string | null) => void;
  onFrameChange: (objectId: string, frame: WorkspaceCanvasFramePatch) => void;
  onDelete: (objectId: string) => void;
};

type ResizeCorner = "nw" | "ne" | "se" | "sw";

type DragState =
  | { kind: "move"; object: CanvasObject; pointerX: number; pointerY: number; moved: boolean }
  | { kind: "resize"; object: CanvasObject; corner: ResizeCorner; pointerX: number; pointerY: number; moved: boolean };

type ContextMenuState =
  | { kind: "canvas"; x: number; y: number }
  | { kind: "object"; x: number; y: number; object: CanvasObject };

const minObjectSize = {
  width: 240,
  height: 160
};

const levelLikeTypes = new Set<CanvasObjectType>(["flipbook", "level", "map", "timeline"]);

export function WorkspaceCanvas({ bundle, selectedObjectId, onSelect, onExplore, onTool, onFrameChange, onDelete }: WorkspaceCanvasProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const suppressNextClickRef = useRef(false);

  const planeSize = useMemo(() => getPlaneSize(bundle.objects), [bundle.objects]);
  const selectedObject = useMemo(
    () => bundle.objects.find((object) => object.id === selectedObjectId) ?? null,
    [bundle.objects, selectedObjectId]
  );
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = selectedObject ?? bundle.objects[0];
    if (!first || !viewportRef.current) return;
    viewportRef.current.scrollTo({
      left: Math.max(0, first.x - 32),
      top: Math.max(0, first.y - 96),
      behavior: "auto"
    });
  }, [bundle.project.id]);

  useEffect(() => {
    if (!drag) return;
    const activeDrag = drag;

    function onPointerMove(event: PointerEvent) {
      const dx = event.clientX - activeDrag.pointerX;
      const dy = event.clientY - activeDrag.pointerY;
      const moved = activeDrag.moved || Math.abs(dx) > 2 || Math.abs(dy) > 2;

      if (moved && !activeDrag.moved) {
        suppressNextClickRef.current = true;
        setDrag((current) => (current ? { ...current, moved: true } : current));
      }

      const frame =
        activeDrag.kind === "move"
          ? getMovedFrame(activeDrag.object, dx, dy)
          : getResizedFrame(activeDrag.object, activeDrag.corner, dx, dy);

      onFrameChange(activeDrag.object.id, frame);
    }

    function onPointerUp() {
      setDrag(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    window.addEventListener("pointercancel", onPointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [drag, onFrameChange]);

  useEffect(() => {
    if (!contextMenu) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setContextMenu(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contextMenu]);

  function handleCanvasClick() {
    setContextMenu(null);
    onSelect(null);
  }

  function handleObjectClick(event: React.MouseEvent<HTMLDivElement>, object: CanvasObject) {
    event.stopPropagation();
    setContextMenu(null);

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    onSelect(object.id);
  }

  function handleObjectDoubleClick(event: React.MouseEvent<HTMLDivElement>, object: CanvasObject) {
    event.stopPropagation();
    if (object.type !== "level") return;
    const rect = event.currentTarget.getBoundingClientRect();
    onExplore(object, {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height)
    });
  }

  function handleCanvasContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    setContextMenu({ kind: "canvas", ...clampMenuPoint(event.clientX, event.clientY) });
  }

  function handleObjectContextMenu(event: React.MouseEvent, object: CanvasObject) {
    event.preventDefault();
    event.stopPropagation();
    onSelect(object.id);
    setContextMenu({ kind: "object", ...clampMenuPoint(event.clientX, event.clientY), object });
  }

  function beginMove(event: ReactPointerEvent, object: CanvasObject) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(object.id);
    setContextMenu(null);
    setDrag({ kind: "move", object, pointerX: event.clientX, pointerY: event.clientY, moved: false });
  }

  function beginResize(event: ReactPointerEvent, object: CanvasObject, corner: ResizeCorner) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(object.id);
    setContextMenu(null);
    setDrag({ kind: "resize", object, corner, pointerX: event.clientX, pointerY: event.clientY, moved: false });
  }

  return (
    <div className="canvas-viewport" ref={viewportRef} role="region" aria-label="Project canvas" onClick={handleCanvasClick} onContextMenu={handleCanvasContextMenu}>
      <div className="canvas-plane" style={{ width: planeSize.width, height: planeSize.height }}>
        <ConnectorLayer objects={bundle.objects} connections={bundle.connections} settings={bundle.settings} width={planeSize.width} height={planeSize.height} />

        {bundle.objects.map((object) => (
          <CanvasObjectBox
            key={object.id}
            object={object}
            selected={selectedObjectId === object.id}
            onClick={handleObjectClick}
            onDoubleClick={handleObjectDoubleClick}
            onContextMenu={handleObjectContextMenu}
            onMoveStart={beginMove}
            onResizeStart={beginResize}
            onTool={onTool}
          />
        ))}
        {bundle.objects.length === 0 ? (
          <div className="canvas-empty-state">
            <p>No objects yet. Use the toolbar to create your first flipbook level, or type a prompt in the chat.</p>
            <button className="primary-button" onClick={() => onTool("new-flipbook")}>Start Flipbook</button>
          </div>
        ) : null}
      </div>

      {contextMenu ? (
        <CanvasContextMenu
          state={contextMenu}
          selectedObject={selectedObject}
          onTool={(tool, objectId) => {
            onTool(tool, objectId);
            setContextMenu(null);
          }}
          onDelete={(objectId) => {
            onDelete(objectId);
            setContextMenu(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CanvasObjectBox({
  object,
  selected,
  onClick,
  onDoubleClick,
  onContextMenu,
  onMoveStart,
  onResizeStart,
  onTool
}: {
  object: CanvasObject;
  selected: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>, object: CanvasObject) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLDivElement>, object: CanvasObject) => void;
  onContextMenu: (event: React.MouseEvent, object: CanvasObject) => void;
  onMoveStart: (event: ReactPointerEvent, object: CanvasObject) => void;
  onResizeStart: (event: ReactPointerEvent, object: CanvasObject, corner: ResizeCorner) => void;
  onTool: (tool: CanvasToolId | string, objectId?: string | null) => void;
}) {
  const [question, setQuestion] = useState("");
  const objectStyle: CSSProperties = {
    left: object.x,
    top: object.y,
    width: object.width,
    height: object.height
  };
  const imageUrl = typeof object.payload.imageUrl === "string" ? object.payload.imageUrl : "";
  const body = getObjectBody(object);

  return (
    <div
      className={clsx("canvas-object", `canvas-object-${object.type}`, selected && "selected", selected && "is-selected")}
      style={objectStyle}
      role="button"
      tabIndex={0}
      aria-label={`${object.title} canvas object`}
      aria-selected={selected}
      onClick={(event) => onClick(event, object)}
      onDoubleClick={(event) => onDoubleClick(event, object)}
      onContextMenu={(event) => onContextMenu(event, object)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(event as unknown as React.MouseEvent<HTMLDivElement>, object);
        }
      }}
    >
      <div className="object-header" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => onMoveStart(event, object)}>
        <div className="object-heading">
          <strong className="object-title">{object.title}</strong>
          <span className="object-meta">
            {object.type.replace("_", " ")} · {getObjectSourceLabel(object)}
          </span>
        </div>
        <button
          className="secondary-button object-menu-button"
          type="button"
          aria-label={`Actions for ${object.title}`}
          onClick={(event) => onContextMenu(event, object)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreHorizontal size={15} aria-hidden />
        </button>
      </div>

      {object.type === "level" && imageUrl ? (
        <img className="level-image" src={imageUrl} alt={object.title} draggable={false} />
      ) : object.type === "ask" ? (
        <div className="object-body ask-object-body" onClick={(event) => event.stopPropagation()}>
          <p>{body}</p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about this branch..."
            aria-label={`Question for ${object.title}`}
          />
          <button
            type="button"
            className="primary-button"
            disabled={!question.trim()}
            onClick={() => {
              onTool(`ask:${question.trim()}`, object.parentId ?? object.id);
              setQuestion("");
            }}
          >
            Ask
          </button>
        </div>
      ) : (
        <div className="object-body">
          <p>{body}</p>
        </div>
      )}

      {(["nw", "ne", "se", "sw"] as const).map((corner) => (
        <button
          key={corner}
          type="button"
          className={clsx("resize-handle", `resize-handle-${corner}`)}
          aria-label={`Resize ${object.title} from ${corner.toUpperCase()} corner`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => onResizeStart(event, object, corner)}
        />
      ))}
    </div>
  );
}

function CanvasContextMenu({
  state,
  selectedObject,
  onTool,
  onDelete
}: {
  state: ContextMenuState;
  selectedObject: CanvasObject | null;
  onTool: (tool: CanvasToolId, objectId?: string | null) => void;
  onDelete: (objectId: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const object = state.kind === "object" ? state.object : selectedObject;
  const tools =
    state.kind === "object"
      ? toolDefinitions.filter((tool) => tool.scope !== "always" && isToolEnabledForObject(tool.scope, state.object.type))
      : toolDefinitions.filter((tool) => tool.scope === "always" && tool.id !== "select" && tool.id !== "pan");

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
      const idx = buttons.indexOf(event.target as HTMLButtonElement);
      const next = event.key === "ArrowDown" ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }

  return (
    <div ref={menuRef} className={clsx("context-menu", `context-menu-${state.kind}`)} role="menu" style={{ left: state.x, top: state.y }} onClick={(event) => event.stopPropagation()} onKeyDown={handleKeyDown}>
      {tools.map((tool) => (
        <button key={tool.id} type="button" role="menuitem" className="context-menu-item" onClick={() => onTool(tool.id, state.kind === "object" ? state.object.id : object?.id ?? null)}>
          {tool.label}
        </button>
      ))}

      {state.kind === "object" ? (
        <button type="button" role="menuitem" className="context-menu-item danger-button context-menu-danger" onClick={() => onDelete(state.object.id)}>
          <Trash2 size={14} aria-hidden />
          <span>Delete</span>
        </button>
      ) : null}
    </div>
  );
}

function getMovedFrame(object: CanvasObject, dx: number, dy: number): WorkspaceCanvasFramePatch {
  return {
    x: Math.max(0, Math.round(object.x + dx)),
    y: Math.max(0, Math.round(object.y + dy))
  };
}

function getResizedFrame(object: CanvasObject, corner: ResizeCorner, dx: number, dy: number): WorkspaceCanvasFramePatch {
  const movingWest = corner === "nw" || corner === "sw";
  const movingNorth = corner === "nw" || corner === "ne";
  const rawWidth = movingWest ? object.width - dx : object.width + dx;
  const rawHeight = movingNorth ? object.height - dy : object.height + dy;
  const width = Math.max(minObjectSize.width, Math.round(rawWidth));
  const height = Math.max(minObjectSize.height, Math.round(rawHeight));

  return {
    width,
    height,
    x: movingWest ? Math.max(0, Math.round(object.x + object.width - width)) : object.x,
    y: movingNorth ? Math.max(0, Math.round(object.y + object.height - height)) : object.y
  };
}

function getPlaneSize(objects: CanvasObject[]) {
  const bounds = objects.reduce(
    (size, object) => ({
      width: Math.max(size.width, object.x + object.width + 480),
      height: Math.max(size.height, object.y + object.height + 360)
    }),
    { width: 2600, height: 1600 }
  );

  return {
    width: Math.ceil(bounds.width),
    height: Math.ceil(bounds.height)
  };
}

function getObjectSourceLabel(object: CanvasObject) {
  const label = object.payload.provider ?? object.payload.tool ?? object.payload.source ?? "local";
  return String(label);
}

function getObjectBody(object: CanvasObject) {
  const body = object.payload.body ?? object.payload.summary ?? object.payload.description ?? object.payload.text;
  if (typeof body === "string" && body.trim()) return body;
  return `${object.type.replace("_", " ")} — no content yet`;
}

function isToolEnabledForObject(scope: (typeof toolDefinitions)[number]["scope"], objectType: CanvasObjectType) {
  if (scope === "object") return true;
  if (scope === "level") return levelLikeTypes.has(objectType);
  return false;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampMenuPoint(x: number, y: number) {
  if (typeof window === "undefined") return { x, y };
  return {
    x: Math.min(Math.max(8, x), window.innerWidth - 220),
    y: Math.min(Math.max(8, y), window.innerHeight - 220)
  };
}
