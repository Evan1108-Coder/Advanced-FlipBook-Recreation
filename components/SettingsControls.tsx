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

const dividerStyle: CSSProperties = {
  borderTop: "1px solid #e5d9c8",
  color: "#6d5f4d",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  paddingTop: 12,
  textTransform: "uppercase"
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
      <select aria-label={label} style={controlStyle} value={value} onChange={(event) => onChange(event.target.value as T)}>
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
          aria-label={label}
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
        aria-label={label}
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
type ModelsResponse = {
  text: ModelDef[];
  image: ModelDef[];
  vision: ModelDef[];
  diagnostics?: { textConfigured: boolean; imageConfigured: boolean; timeoutMs: number; fallback: string };
};

export function ModelSelectors({ settings, onSettingsChange }: { settings: ProjectSettings; onSettingsChange: (partial: Partial<ProjectSettings>) => void }) {
  const [models, setModels] = useState<ModelsResponse | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setModels)
      .catch((error) => console.warn("Failed to load available AI models.", error));
  }, []);

  if (!models) return null;

  const hasText = models.text.length > 0;
  const hasImage = models.image.length > 0;

  if (!hasText && !hasImage) {
    return (
      <div style={{ ...fieldStyle, padding: "8px 0" }}>
        <span style={{ ...labelStyle, color: "#a0522d" }}>No AI models configured</span>
        <span style={helpStyle}>
          Add API keys to .env for AI features. Supported: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY, MINIMAX_API_KEY, MOONSHOT_API_KEY.
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
      {models.diagnostics ? (
        <span style={helpStyle}>
          Provider timeout: {Math.round(models.diagnostics.timeoutMs / 1000)}s. {models.diagnostics.fallback}
        </span>
      ) : null}
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
          <div style={dividerStyle}>Project behavior</div>
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
          <div style={dividerStyle}>Canvas</div>
          <ToggleField
            checked={settings.connectorLabels}
            label="Connector labels"
            onChange={(connectorLabels) => onSettingsChange({ connectorLabels })}
          />
          <SelectField
            label="Canvas grid"
            onChange={(canvasGrid) => onSettingsChange({ canvasGrid })}
            options={[
              { value: "off", label: "Off" },
              { value: "dots", label: "Dots" },
              { value: "lines", label: "Lines" }
            ]}
            value={settings.canvasGrid}
          />
          <SelectField
            label="Canvas snap"
            onChange={(canvasSnap) => onSettingsChange({ canvasSnap })}
            options={[
              { value: "off", label: "Off" },
              { value: "fine", label: "Fine" },
              { value: "coarse", label: "Coarse" }
            ]}
            value={settings.canvasSnap}
          />
          <SelectField
            label="Auto-organize spacing"
            onChange={(canvasAutoOrganizeSpacing) => onSettingsChange({ canvasAutoOrganizeSpacing })}
            options={[
              { value: "tight", label: "Tight" },
              { value: "balanced", label: "Balanced" },
              { value: "wide", label: "Wide" }
            ]}
            value={settings.canvasAutoOrganizeSpacing}
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
          <div style={dividerStyle}>Models and generation</div>
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
          <div style={dividerStyle}>Toolbar and sources</div>
          <ToggleField
            checked={settings.toolbarLabels}
            label="Toolbar labels"
            onChange={(toolbarLabels) => onSettingsChange({ toolbarLabels })}
          />
          <SelectField
            label="Toolbar position"
            onChange={(toolbarPosition) => onSettingsChange({ toolbarPosition })}
            options={[
              { value: "bottom", label: "Bottom" },
              { value: "left", label: "Left" }
            ]}
            value={settings.toolbarPosition}
          />
          <ToggleField
            checked={settings.showObjectMeta}
            label="Object metadata"
            onChange={(showObjectMeta) => onSettingsChange({ showObjectMeta })}
          />
          <ToggleField
            checked={settings.confirmRegenerate}
            label="Confirm regenerate"
            onChange={(confirmRegenerate) => onSettingsChange({ confirmRegenerate })}
          />
          <SelectField
            label="Source URL requirement"
            onChange={(sourceUrlRequirement) => onSettingsChange({ sourceUrlRequirement })}
            options={[
              { value: "optional", label: "Optional" },
              { value: "warn", label: "Warn" },
              { value: "required", label: "Required" }
            ]}
            value={settings.sourceUrlRequirement}
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
          <div style={dividerStyle}>Chat panel</div>
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
            checked={settings.chatDefaultOpen}
            label="Open by default"
            onChange={(chatDefaultOpen) => onSettingsChange({ chatDefaultOpen })}
          />
          <ToggleField
            checked={settings.chatShowContext}
            label="Show context strip"
            onChange={(chatShowContext) => onSettingsChange({ chatShowContext })}
          />
          <ToggleField
            checked={settings.chatEnterToSend}
            label="Enter sends"
            onChange={(chatEnterToSend) => onSettingsChange({ chatEnterToSend })}
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
