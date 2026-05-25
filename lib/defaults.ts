import type { Mode, PanelSection, ProjectSettings } from "./types";

export const featureModes: Array<{ id: Mode; label: string; detail: string }> = [
  { id: "flipbook", label: "Flipbook", detail: "Explore a topic by clicking generated visual regions." },
  { id: "textbook", label: "Textbook Image", detail: "Create a structured explainer image with real transcript text." },
  { id: "knowledge-map", label: "Knowledge Map", detail: "Turn a topic into a connected concept map." },
  { id: "timeline", label: "Timeline", detail: "Build a chronological visual branch." },
  { id: "compare", label: "Compare", detail: "Compare two ideas, eras, systems, or sources." },
  { id: "study-guide", label: "Study Guide", detail: "Generate review notes, questions, and explanations." },
  { id: "source-brief", label: "Source Brief", detail: "Summarize sources with claims and confidence." },
  { id: "presentation", label: "Presentation", detail: "Build a concise visual teaching sequence." }
];

export const panelSections: PanelSection[] = [
  "Sources",
  "Project Settings",
  "Chat Settings",
  "Memory",
  "Object Inspector",
  "Transcript",
  "Claims",
  "Notes",
  "Versions",
  "Export",
  "Check Understanding"
];

export const defaultProjectSettings: ProjectSettings = {
  deleteBehavior: "delete-descendants",
  memoryEnabled: true,
  sourceStrictness: "balanced",
  chatBubbleSize: "medium",
  chatOperatorEnabled: true,
  rightPanelWidth: 360,
  toolbarLabels: false,
  connectorStyle: "soft",
  animationSpeed: "normal",
  minimaxQuality: "balanced",
  defaultAspectRatio: "16:9",
  textModel: null,
  imageModel: null,
};

export const toolDefinitions = [
  { id: "select", label: "Select", scope: "always" },
  { id: "pan", label: "Pan", scope: "always" },
  { id: "new-flipbook", label: "New Flipbook", scope: "always" },
  { id: "organize", label: "Organize", scope: "always" },
  { id: "learn", label: "Learn", scope: "level" },
  { id: "ask", label: "Ask", scope: "object" },
  { id: "analysis", label: "Analysis", scope: "level" },
  { id: "compare", label: "Compare", scope: "level" },
  { id: "timeline", label: "Timeline", scope: "level" },
  { id: "sources", label: "Sources", scope: "object" },
  { id: "regenerate", label: "Regenerate", scope: "level" },
  { id: "export", label: "Export", scope: "object" }
] as const;
