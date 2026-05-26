"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { ProjectSettings } from "@/lib/types";

type SettingsSection = "project" | "chat" | "all";

export type SettingsControlsProps = {
  settings: ProjectSettings;
  section?: SettingsSection;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
};

const groupStyle: CSSProperties = {
  display: "grid",
  gap: 14
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6
};

const labelStyle: CSSProperties = {
  color: "#3b342d",
  fontSize: 12,
  fontWeight: 700
};

const helpStyle: CSSProperties = {
  color: "#776d62",
  fontSize: 12,
  lineHeight: 1.45
};

const controlStyle: CSSProperties = {
  appearance: "none",
  background: "#fffdf8",
  border: "1px solid #ded4c5",
  borderRadius: 8,
  color: "#2f2923",
  font: "inherit",
  minHeight: 34,
  padding: "7px 9px",
  width: "100%"
};

const rowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: 10,
  justifyContent: "space-between"
};

const toggleLabelStyle: CSSProperties = {
  alignItems: "center",
  cursor: "pointer",
  display: "flex",
  gap: 10,
  justifyContent: "space-between"
};

function SelectField<T extends string>({
  label,
  value,
  options,
  help,
  onChange
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  help?: string;
  onChange: (value: T) => void;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <select style={controlStyle} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help ? <span style={helpStyle}>{help}</span> : null}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  help,
  onChange
}: {
  label: string;
  checked: boolean;
  help?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ ...fieldStyle, cursor: "pointer" }}>
      <span style={toggleLabelStyle}>
        <span style={labelStyle}>{label}</span>
        <input
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          style={{ accentColor: "#3f6f5d", height: 18, width: 18 }}
          type="checkbox"
        />
      </span>
      {help ? <span style={helpStyle}>{help}</span> : null}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  help,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  help?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label style={fieldStyle}>
      <span style={rowStyle}>
        <span style={labelStyle}>{label}</span>
        <span style={helpStyle}>{value}px</span>
      </span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        style={{ accentColor: "#3f6f5d", width: "100%" }}
        type="range"
        value={value}
      />
      {help ? <span style={helpStyle}>{help}</span> : null}
    </label>
  );
}

type ModelDef = { id: string; name: string; provider: string; capabilities: string[]; costTier: string };
type ModelsResponse = { text: ModelDef[]; image: ModelDef[]; vision: ModelDef[] };

function ModelSelectors({ settings, onSettingsChange }: { settings: ProjectSettings; onSettingsChange: (partial: Partial<ProjectSettings>) => void }) {
  const [models, setModels] = useState<ModelsResponse | null>(null);

  useEffect(() => {
    fetch("/api/models").then((r) => r.json()).then(setModels).catch(() => {});
  }, []);

  if (!models) return null;

  const hasText = models.text.length > 0;
  const hasImage = models.image.length > 0;

  if (!hasText && !hasImage) {
    return (
      <div style={{ ...fieldStyle, padding: "8px 0" }}>
        <span style={{ ...labelStyle, color: "#a0522d" }}>No AI models configured</span>
        <span style={helpStyle}>
          Add API keys to .env.local for AI features. Supported: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY, MINIMAX_API_KEY, MOONSHOT_API_KEY.
        </span>
      </div>
    );
  }

  const warning = hasText && !hasImage
    ? "No image model configured — using SVG placeholders. Add MINIMAX_API_KEY or OPENAI_API_KEY for real images."
    : !hasText && hasImage
      ? "No text model configured — chat will use template responses. Add a text model API key for AI chat."
      : null;

  return (
    <div style={groupStyle}>
      {warning ? <span style={{ ...helpStyle, color: "#a0522d" }}>{warning}</span> : null}
      {hasText ? (
        <SelectField
          label="Text model"
          help="Used for chat, content generation, and summaries."
          value={settings.textModel ?? models.text[0].id}
          options={models.text.map((m) => ({ value: m.id, label: `${m.name} (${m.provider})` }))}
          onChange={(textModel) => onSettingsChange({ textModel })}
        />
      ) : null}
      {hasImage ? (
        <SelectField
          label="Image model"
          help="Used for generating flipbook visuals and pages."
          value={settings.imageModel ?? models.image[0].id}
          options={models.image.map((m) => ({ value: m.id, label: `${m.name} (${m.provider})` }))}
          onChange={(imageModel) => onSettingsChange({ imageModel })}
        />
      ) : null}
    </div>
  );
}

export function SettingsControls({ settings, section = "all", onSettingsChange }: SettingsControlsProps) {
  const showProject = section === "project" || section === "all";
  const showChat = section === "chat" || section === "all";

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {showProject ? (
        <section aria-labelledby="project-settings-heading" style={groupStyle}>
          {section === "all" ? (
            <h3 id="project-settings-heading" style={{ fontSize: 13, margin: 0 }}>
              Project Settings
            </h3>
          ) : null}
          <SelectField
            help="Choose what happens to child objects when an object is deleted."
            label="Delete behavior"
            onChange={(deleteBehavior) => onSettingsChange({ deleteBehavior })}
            options={[
              { value: "delete-descendants", label: "Delete descendants" },
              { value: "detach-descendants", label: "Detach descendants" },
              { value: "preserve-orphans", label: "Preserve orphans" },
              { value: "ask", label: "Ask every time" }
            ]}
            value={settings.deleteBehavior}
          />
          <ToggleField
            checked={settings.memoryEnabled}
            help="Allow this project to retain summaries, facts, preferences, and decisions."
            label="Project memory"
            onChange={(memoryEnabled) => onSettingsChange({ memoryEnabled })}
          />
          <SelectField
            help="Set how strongly answers and generated materials should require source support."
            label="Source strictness"
            onChange={(sourceStrictness) => onSettingsChange({ sourceStrictness })}
            options={[
              { value: "relaxed", label: "Relaxed" },
              { value: "balanced", label: "Balanced" },
              { value: "strict", label: "Strict" }
            ]}
            value={settings.sourceStrictness}
          />
          <SelectField
            label="Connector style"
            onChange={(connectorStyle) => onSettingsChange({ connectorStyle })}
            options={[
              { value: "soft", label: "Soft" },
              { value: "direct", label: "Direct" },
              { value: "stepped", label: "Stepped" }
            ]}
            value={settings.connectorStyle}
          />
          <SelectField
            label="Animation speed"
            onChange={(animationSpeed) => onSettingsChange({ animationSpeed })}
            options={[
              { value: "reduced", label: "Reduced" },
              { value: "normal", label: "Normal" },
              { value: "expressive", label: "Expressive" }
            ]}
            value={settings.animationSpeed}
          />
          <ModelSelectors settings={settings} onSettingsChange={onSettingsChange} />
          <SelectField
            label="Image quality"
            help="Controls prompt optimization and quality level for image generation."
            onChange={(minimaxQuality) => onSettingsChange({ minimaxQuality })}
            options={[
              { value: "draft", label: "Draft" },
              { value: "balanced", label: "Balanced" },
              { value: "high", label: "High" }
            ]}
            value={settings.minimaxQuality}
          />
          <SelectField
            label="Default aspect ratio"
            onChange={(defaultAspectRatio) => onSettingsChange({ defaultAspectRatio })}
            options={[
              { value: "1:1", label: "1:1" },
              { value: "4:3", label: "4:3" },
              { value: "16:9", label: "16:9" }
            ]}
            value={settings.defaultAspectRatio}
          />
          <ToggleField
            checked={settings.toolbarLabels}
            label="Toolbar labels"
            onChange={(toolbarLabels) => onSettingsChange({ toolbarLabels })}
          />
          <NumberField
            help="The right panel can also be resized by dragging its left edge."
            label="Right panel width"
            max={560}
            min={280}
            onChange={(rightPanelWidth) => onSettingsChange({ rightPanelWidth })}
            value={settings.rightPanelWidth}
          />
        </section>
      ) : null}

      {showChat ? (
        <section aria-labelledby="chat-settings-heading" style={groupStyle}>
          {section === "all" ? (
            <h3 id="chat-settings-heading" style={{ fontSize: 13, margin: 0 }}>
              Chat Settings
            </h3>
          ) : null}
          <SelectField
            help="Adjust the compact chat bubble footprint in the workspace."
            label="Bubble size"
            onChange={(chatBubbleSize) => onSettingsChange({ chatBubbleSize })}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" }
            ]}
            value={settings.chatBubbleSize}
          />
          <ToggleField
            checked={settings.chatOperatorEnabled}
            help="Allow chat to perform project actions that can still require confirmation."
            label="Operator actions"
            onChange={(chatOperatorEnabled) => onSettingsChange({ chatOperatorEnabled })}
          />
          <div style={fieldStyle}>
            <span style={labelStyle}>Project memory</span>
            <span style={helpStyle}>
              Memory is {settings.memoryEnabled ? "enabled" : "disabled"}. Change this in Project Settings.
            </span>
          </div>
          <SelectField
            help="Controls how much source grounding chat should demand before answering."
            label="Source use"
            onChange={(sourceStrictness) => onSettingsChange({ sourceStrictness })}
            options={[
              { value: "relaxed", label: "Relaxed" },
              { value: "balanced", label: "Balanced" },
              { value: "strict", label: "Strict" }
            ]}
            value={settings.sourceStrictness}
          />
        </section>
      ) : null}
    </div>
  );
}

