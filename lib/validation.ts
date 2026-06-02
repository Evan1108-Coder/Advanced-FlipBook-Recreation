import type { Mode, ProjectSettings } from "./types";
import { defaultProjectSettings } from "./defaults";

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
  if (input.x !== undefined) {
    const value = clampNumber(input.x, 0, 20000);
    if (!Number.isFinite(value)) return null;
    next.x = value;
  }
  if (input.y !== undefined) {
    const value = clampNumber(input.y, 0, 20000);
    if (!Number.isFinite(value)) return null;
    next.y = value;
  }
  if (input.width !== undefined) {
    const value = clampNumber(input.width, 220, 2400);
    if (!Number.isFinite(value)) return null;
    next.width = value;
  }
  if (input.height !== undefined) {
    const value = clampNumber(input.height, 150, 1800);
    if (!Number.isFinite(value)) return null;
    next.height = value;
  }
  return Object.keys(next).length ? next : null;
}

export function cleanSettings(settings: unknown): Partial<ProjectSettings> {
  if (!settings || typeof settings !== "object") return {};
  const input = settings as Record<string, unknown>;
  const next: Partial<ProjectSettings> = {};

  if (isOneOf(input.themeTone, ["ivory", "warm", "sepia", "contrast"])) next.themeTone = input.themeTone;
  if (isOneOf(input.uiDensity, ["compact", "comfortable", "spacious"])) next.uiDensity = input.uiDensity;
  if (isOneOf(input.textSize, ["small", "medium", "large"])) next.textSize = input.textSize;
  if (isOneOf(input.focusStyle, ["subtle", "strong"])) next.focusStyle = input.focusStyle;
  if (typeof input.reducedTransparency === "boolean") next.reducedTransparency = input.reducedTransparency;
  if (input.homeSidebarWidth !== undefined) {
    const width = clampNumber(input.homeSidebarWidth, 220, 360);
    if (Number.isFinite(width)) next.homeSidebarWidth = width;
  }
  if (typeof input.homeShowModeDescriptions === "boolean") next.homeShowModeDescriptions = input.homeShowModeDescriptions;
  if (typeof input.homeShowStatusMarkers === "boolean") next.homeShowStatusMarkers = input.homeShowStatusMarkers;
  if (input.homeRecentLimit !== undefined) {
    const limit = Math.round(clampNumber(input.homeRecentLimit, 3, 24));
    if (Number.isFinite(limit)) next.homeRecentLimit = limit;
  }
  if (isOneOf(input.homeRecentSort, ["updated", "created", "name"])) next.homeRecentSort = input.homeRecentSort;
  if (isOneOf(input.homeDefaultMode, ["flipbook", "textbook", "knowledge-map", "timeline", "compare", "study-guide", "source-brief", "presentation"])) next.homeDefaultMode = input.homeDefaultMode;
  if (typeof input.homeShowProjectDates === "boolean") next.homeShowProjectDates = input.homeShowProjectDates;
  if (typeof input.homeCompactProjectCards === "boolean") next.homeCompactProjectCards = input.homeCompactProjectCards;
  if (typeof input.modeInputHints === "boolean") next.modeInputHints = input.modeInputHints;
  if (typeof input.requireSourceForSourceBrief === "boolean") next.requireSourceForSourceBrief = input.requireSourceForSourceBrief;
  if (isOneOf(input.defaultCreateAction, ["open-project", "stay-home"])) next.defaultCreateAction = input.defaultCreateAction;
  if (typeof input.confirmProjectDelete === "boolean") next.confirmProjectDelete = input.confirmProjectDelete;
  if (isOneOf(input.deleteBehavior, ["delete-descendants", "detach-descendants", "preserve-orphans", "ask"])) next.deleteBehavior = input.deleteBehavior;
  if (typeof input.memoryEnabled === "boolean") next.memoryEnabled = input.memoryEnabled;
  if (isOneOf(input.sourceStrictness, ["relaxed", "balanced", "strict"])) next.sourceStrictness = input.sourceStrictness;
  if (isOneOf(input.chatBubbleSize, ["small", "medium", "large"])) next.chatBubbleSize = input.chatBubbleSize;
  if (typeof input.chatDefaultOpen === "boolean") next.chatDefaultOpen = input.chatDefaultOpen;
  if (typeof input.chatShowContext === "boolean") next.chatShowContext = input.chatShowContext;
  if (input.chatHistoryLimit !== undefined) {
    const limit = Math.round(clampNumber(input.chatHistoryLimit, 4, 30));
    if (Number.isFinite(limit)) next.chatHistoryLimit = limit;
  }
  if (typeof input.chatEnterToSend === "boolean") next.chatEnterToSend = input.chatEnterToSend;
  if (typeof input.chatOperatorEnabled === "boolean") next.chatOperatorEnabled = input.chatOperatorEnabled;
  if (input.rightPanelWidth !== undefined) {
    const width = clampNumber(input.rightPanelWidth, 280, 560);
    if (Number.isFinite(width)) next.rightPanelWidth = width;
  }
  if (typeof input.toolbarLabels === "boolean") next.toolbarLabels = input.toolbarLabels;
  if (isOneOf(input.toolbarPosition, ["bottom", "left"])) next.toolbarPosition = input.toolbarPosition;
  if (isOneOf(input.canvasGrid, ["off", "dots", "lines"])) next.canvasGrid = input.canvasGrid;
  if (isOneOf(input.canvasSnap, ["off", "fine", "coarse"])) next.canvasSnap = input.canvasSnap;
  if (isOneOf(input.canvasObjectScale, ["compact", "normal", "large"])) next.canvasObjectScale = input.canvasObjectScale;
  if (isOneOf(input.canvasAutoOrganizeSpacing, ["tight", "balanced", "wide"])) next.canvasAutoOrganizeSpacing = input.canvasAutoOrganizeSpacing;
  if (isOneOf(input.connectorStyle, ["soft", "direct", "stepped"])) next.connectorStyle = input.connectorStyle;
  if (typeof input.connectorLabels === "boolean") next.connectorLabels = input.connectorLabels;
  if (typeof input.showObjectMeta === "boolean") next.showObjectMeta = input.showObjectMeta;
  if (typeof input.confirmRegenerate === "boolean") next.confirmRegenerate = input.confirmRegenerate;
  if (isOneOf(input.animationSpeed, ["reduced", "normal", "expressive"])) next.animationSpeed = input.animationSpeed;
  if (isOneOf(input.minimaxQuality, ["draft", "balanced", "high"])) next.minimaxQuality = input.minimaxQuality;
  if (isOneOf(input.defaultAspectRatio, ["1:1", "4:3", "16:9"])) next.defaultAspectRatio = input.defaultAspectRatio;
  if (isOneOf(input.sourceUrlRequirement, ["optional", "warn", "required"])) next.sourceUrlRequirement = input.sourceUrlRequirement;
  if (isOneOf(input.sourceDefaultQuality, ["draft", "ok", "strong"])) next.sourceDefaultQuality = input.sourceDefaultQuality;
  if (typeof input.showSourceQuality === "boolean") next.showSourceQuality = input.showSourceQuality;
  if (isOneOf(input.exportDefaultFormat, ["markdown", "text", "json"])) next.exportDefaultFormat = input.exportDefaultFormat;
  if (typeof input.exportIncludeSources === "boolean") next.exportIncludeSources = input.exportIncludeSources;
  if (typeof input.exportIncludeClaims === "boolean") next.exportIncludeClaims = input.exportIncludeClaims;
  if (typeof input.textModel === "string" || input.textModel === null) next.textModel = input.textModel;
  if (typeof input.imageModel === "string" || input.imageModel === null) next.imageModel = input.imageModel;

  return next;
}

export function mergeSettings(value: unknown): ProjectSettings {
  return { ...defaultProjectSettings, ...cleanSettings(value) };
}

export function clampNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return Number.NaN;
  return Math.min(max, Math.max(min, number));
}

export function safeSourceUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}
