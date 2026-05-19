export type Mode =
  | "flipbook"
  | "textbook"
  | "knowledge-map"
  | "timeline"
  | "compare"
  | "study-guide"
  | "source-brief"
  | "presentation";

export type CanvasObjectType =
  | "flipbook"
  | "level"
  | "tool_result"
  | "ask"
  | "source"
  | "note"
  | "map"
  | "timeline"
  | "export";

export type PanelSection =
  | "Sources"
  | "Project Settings"
  | "Chat Settings"
  | "Memory"
  | "Object Inspector"
  | "Transcript"
  | "Claims"
  | "Notes"
  | "Versions"
  | "Export"
  | "Check Understanding";

export type Project = {
  id: string;
  name: string;
  description: string;
  mode: Mode;
  createdAt: string;
  updatedAt: string;
};

export type CanvasObject = {
  id: string;
  projectId: string;
  type: CanvasObjectType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Connection = {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  label?: string;
  createdAt: string;
};

export type Source = {
  id: string;
  projectId: string;
  title: string;
  url?: string;
  excerpt: string;
  quality: "draft" | "ok" | "strong";
  createdAt: string;
};

export type MemoryItem = {
  id: string;
  projectId: string;
  kind: "summary" | "fact" | "preference" | "decision";
  text: string;
  pinned: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  projectId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ProjectSettings = {
  deleteBehavior: "delete-descendants" | "detach-descendants" | "preserve-orphans" | "ask";
  memoryEnabled: boolean;
  sourceStrictness: "relaxed" | "balanced" | "strict";
  chatBubbleSize: "small" | "medium" | "large";
  chatOperatorEnabled: boolean;
  rightPanelWidth: number;
  toolbarLabels: boolean;
  connectorStyle: "soft" | "direct" | "stepped";
  animationSpeed: "reduced" | "normal" | "expressive";
  minimaxQuality: "draft" | "balanced" | "high";
  defaultAspectRatio: "1:1" | "4:3" | "16:9";
};

export type ProjectBundle = {
  project: Project;
  settings: ProjectSettings;
  objects: CanvasObject[];
  connections: Connection[];
  sources: Source[];
  memory: MemoryItem[];
  chat: ChatMessage[];
};
