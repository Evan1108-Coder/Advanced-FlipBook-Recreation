"use client";

import type { ComponentType } from "react";
import { BarChart3, BookOpen, Download, GitCompare, HelpCircle, Layers3, MousePointer2, Move, Network, RotateCcw, Rows3, Search } from "lucide-react";
import { toolDefinitions } from "@/lib/defaults";
import type { CanvasObject, CanvasObjectType, ProjectSettings } from "@/lib/types";

export type ToolId = (typeof toolDefinitions)[number]["id"];

type FloatingToolbarProps = {
  selectedObject?: CanvasObject | null;
  selectedObjectType?: CanvasObjectType | null;
  selectedCount?: number;
  activeTool?: ToolId;
  orientation?: "horizontal" | "vertical";
  settings?: Pick<ProjectSettings, "toolbarLabels">;
  onTool?: (tool: ToolId, objectId?: string | null) => void | Promise<void>;
};

const toolIcons: Record<ToolId, ComponentType<{ size?: number }>> = {
  select: MousePointer2,
  pan: Move,
  "new-flipbook": Layers3,
  organize: Rows3,
  learn: BookOpen,
  ask: HelpCircle,
  analysis: BarChart3,
  compare: GitCompare,
  timeline: Network,
  sources: Search,
  regenerate: RotateCcw,
  export: Download
};

const levelTypes = new Set<CanvasObjectType>(["flipbook", "level", "map", "timeline"]);

function isEnabled(scope: (typeof toolDefinitions)[number]["scope"], selectedObjectType: CanvasObjectType | null | undefined, selectedCount: number) {
  if (scope === "always") return true;
  if (selectedCount > 1) return scope === "object";
  if (!selectedObjectType) return false;
  if (scope === "object") return true;
  return levelTypes.has(selectedObjectType);
}

export function FloatingToolbar({
  selectedObject = null,
  selectedObjectType = null,
  selectedCount,
  activeTool,
  orientation = "horizontal",
  settings,
  onTool
}: FloatingToolbarProps) {
  const showLabels = settings?.toolbarLabels ?? false;
  const resolvedType = selectedObjectType ?? selectedObject?.type ?? null;
  const resolvedCount = selectedCount ?? (resolvedType ? 1 : 0);

  return (
    <div className={`floating-toolbar ${orientation}`} role="toolbar" aria-label="Canvas tools">
      {toolDefinitions.map((tool) => {
        const enabled = isEnabled(tool.scope, resolvedType, resolvedCount);
        const Icon = toolIcons[tool.id];
        return (
          <button
            key={tool.id}
            type="button"
            className={activeTool === tool.id ? "tool-button active" : "tool-button"}
            disabled={!enabled}
            title={enabled ? tool.label : `${tool.label} unavailable for current selection`}
            aria-label={tool.label}
            aria-pressed={activeTool === tool.id}
            onClick={() => enabled && onTool?.(tool.id, selectedObject?.id ?? null)}
          >
            <Icon size={17} />
            {showLabels ? <span>{tool.label}</span> : null}
          </button>
        );
      })}

      <style jsx>{`
        .floating-toolbar {
          position: fixed;
          z-index: 30;
          display: flex;
          gap: 6px;
          padding: 7px;
          border: 1px solid rgba(44, 39, 30, 0.16);
          border-radius: 8px;
          background: rgba(255, 250, 240, 0.94);
          box-shadow: 0 18px 50px rgba(45, 39, 28, 0.16);
          backdrop-filter: blur(10px);
        }
        .horizontal {
          left: 50%;
          bottom: 22px;
          transform: translateX(-50%);
          max-width: calc(100vw - 28px);
          overflow-x: auto;
        }
        .vertical {
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          flex-direction: column;
          max-height: calc(100vh - 160px);
          overflow-y: auto;
        }
        .tool-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          flex: 0 0 auto;
          min-width: 36px;
          width: max-content;
          height: 36px;
          padding: 0 10px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: #302b22;
          cursor: pointer;
          white-space: nowrap;
        }
        .tool-button:hover:not(:disabled),
        .tool-button.active {
          border-color: rgba(130, 97, 25, 0.28);
          background: #f3d777;
        }
        .tool-button:disabled {
          color: #a59c8a;
          cursor: not-allowed;
          opacity: 0.48;
        }
        .tool-button span {
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .floating-toolbar {
            left: 10px;
            right: 82px;
            bottom: 12px;
            transform: none;
            flex-wrap: wrap;
            overflow: visible;
          }
          .vertical {
            top: auto;
            flex-direction: row;
          }
          .tool-button {
            flex: 0 0 36px;
            width: 36px;
            padding: 0;
          }
          .tool-button span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingToolbar;
