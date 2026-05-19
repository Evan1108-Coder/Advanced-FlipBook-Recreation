import type { Mode, ProjectSettings } from "./types";

export const validModes = new Set<Mode>([
  "flipbook",
  "textbook",
  "knowledge-map",
  "timeline",
  "compare",
  "study-guide",
  "source-brief",
  "presentation"
]);

export function asMode(value: unknown): Mode {
  return typeof value === "string" && validModes.has(value as Mode) ? (value as Mode) : "flipbook";
}

export function cleanPrompt(value: unknown, fallback = "A visual encyclopedia of renewable energy") {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 1200) : fallback;
}

export function cleanFrame(frame: unknown) {
  if (!frame || typeof frame !== "object") return null;
  const input = frame as Record<string, unknown>;
  const next: { x?: number; y?: number; width?: number; height?: number } = {};
  if (input.x !== undefined) next.x = clampNumber(input.x, 0, 20000);
  if (input.y !== undefined) next.y = clampNumber(input.y, 0, 20000);
  if (input.width !== undefined) next.width = clampNumber(input.width, 220, 2400);
  if (input.height !== undefined) next.height = clampNumber(input.height, 150, 1800);
  return Object.keys(next).length ? next : null;
}

export function cleanSettings(settings: unknown): Partial<ProjectSettings> {
  if (!settings || typeof settings !== "object") return {};
  const input = settings as Record<string, unknown>;
  const next: Partial<ProjectSettings> = {};

  if (isOneOf(input.deleteBehavior, ["delete-descendants", "detach-descendants", "preserve-orphans", "ask"])) next.deleteBehavior = input.deleteBehavior;
  if (typeof input.memoryEnabled === "boolean") next.memoryEnabled = input.memoryEnabled;
  if (isOneOf(input.sourceStrictness, ["relaxed", "balanced", "strict"])) next.sourceStrictness = input.sourceStrictness;
  if (isOneOf(input.chatBubbleSize, ["small", "medium", "large"])) next.chatBubbleSize = input.chatBubbleSize;
  if (typeof input.chatOperatorEnabled === "boolean") next.chatOperatorEnabled = input.chatOperatorEnabled;
  if (input.rightPanelWidth !== undefined) next.rightPanelWidth = clampNumber(input.rightPanelWidth, 280, 680);
  if (typeof input.toolbarLabels === "boolean") next.toolbarLabels = input.toolbarLabels;
  if (isOneOf(input.connectorStyle, ["soft", "direct", "stepped"])) next.connectorStyle = input.connectorStyle;
  if (isOneOf(input.animationSpeed, ["reduced", "normal", "expressive"])) next.animationSpeed = input.animationSpeed;
  if (isOneOf(input.minimaxQuality, ["draft", "balanced", "high"])) next.minimaxQuality = input.minimaxQuality;
  if (isOneOf(input.defaultAspectRatio, ["1:1", "4:3", "16:9"])) next.defaultAspectRatio = input.defaultAspectRatio;

  return next;
}

export function clampNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}
