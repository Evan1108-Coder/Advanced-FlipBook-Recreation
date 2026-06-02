"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Database, RotateCcw, Trash2 } from "lucide-react";
import { featureModes } from "@/lib/defaults";
import { ModelSelectors } from "@/components/SettingsControls";
import type { Project, ProjectSettings } from "@/lib/types";

type SettingsPageProps = {
  settings: ProjectSettings;
  projects: Project[];
  statusMessage?: string | null;
  errorMessage?: string | null;
  onBack: () => void;
  onSettingsChange: (partial: Partial<ProjectSettings>) => void;
  onResetDefaults: () => void;
  onDeleteProject: (projectId: string) => void | Promise<void>;
  onClearProjectMemory: (projectId: string) => void | Promise<void>;
  onClearProjectChat: (projectId: string) => void | Promise<void>;
};

type MainGroup = "workspace" | "home" | "defaults" | "canvas" | "chat" | "sources" | "data";
type SubGroup =
  | "appearance"
  | "accessibility"
  | "navigation"
  | "projects"
  | "creation"
  | "generation"
  | "models"
  | "canvas-layout"
  | "connectors"
  | "toolbar"
  | "chat-panel"
  | "chat-behavior"
  | "source-controls"
  | "export"
  | "project-actions"
  | "reset";

const groups: Array<{ id: MainGroup; label: string; detail: string; subgroups: Array<{ id: SubGroup; label: string }> }> = [
  {
    id: "workspace",
    label: "Workspace",
    detail: "Tone, density, accessibility.",
    subgroups: [
      { id: "appearance", label: "Appearance" },
      { id: "accessibility", label: "Accessibility" }
    ]
  },
  {
    id: "home",
    label: "Home Screen",
    detail: "Sidebar, mode input, recents.",
    subgroups: [
      { id: "navigation", label: "Navigation" },
      { id: "projects", label: "Recent Projects" }
    ]
  },
  {
    id: "defaults",
    label: "Project Defaults",
    detail: "Creation, memory, generation.",
    subgroups: [
      { id: "creation", label: "Creation" },
      { id: "generation", label: "Generation" },
      { id: "models", label: "Models" }
    ]
  },
  {
    id: "canvas",
    label: "Canvas",
    detail: "Layout, connectors, toolbar.",
    subgroups: [
      { id: "canvas-layout", label: "Layout" },
      { id: "connectors", label: "Connectors" },
      { id: "toolbar", label: "Toolbar" }
    ]
  },
  {
    id: "chat",
    label: "Chat",
    detail: "Bubble, context, operator.",
    subgroups: [
      { id: "chat-panel", label: "Panel" },
      { id: "chat-behavior", label: "Behavior" }
    ]
  },
  {
    id: "sources",
    label: "Sources & Export",
    detail: "Validation and handoff.",
    subgroups: [
      { id: "source-controls", label: "Sources" },
      { id: "export", label: "Export" }
    ]
  },
  {
    id: "data",
    label: "Data",
    detail: "Local project actions.",
    subgroups: [
      { id: "project-actions", label: "Project Actions" },
      { id: "reset", label: "Reset Defaults" }
    ]
  }
];

const cardStyle: CSSProperties = {
  background: "#fffaf0",
  border: "1px solid rgba(57, 50, 36, 0.14)",
  borderRadius: 8,
  display: "grid",
  gap: 14,
  padding: 16
};

export function SettingsPage({
  settings,
  projects,
  statusMessage,
  errorMessage,
  onBack,
  onSettingsChange,
  onResetDefaults,
  onDeleteProject,
  onClearProjectMemory,
  onClearProjectChat
}: SettingsPageProps) {
  const [mainGroup, setMainGroup] = useState<MainGroup>("workspace");
  const [subgroup, setSubgroup] = useState<SubGroup>("appearance");
  const activeGroup = groups.find((group) => group.id === mainGroup) ?? groups[0];

  function selectMain(next: MainGroup) {
    const group = groups.find((item) => item.id === next) ?? groups[0];
    setMainGroup(group.id);
    setSubgroup(group.subgroups[0].id);
  }

  return (
    <main className="settings-page" aria-label="Global settings">
      <aside className="settings-main-panel">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden />
          Back
        </button>
        <div className="settings-title">
          <strong>Settings</strong>
          <span>Global defaults for local projects.</span>
        </div>
        <nav aria-label="Settings groups">
          {groups.map((group) => (
            <button key={group.id} type="button" className={group.id === mainGroup ? "active" : ""} onClick={() => selectMain(group.id)}>
              <span>{group.label}</span>
              <small>{group.detail}</small>
            </button>
          ))}
        </nav>
      </aside>

      {activeGroup.subgroups.length > 1 ? (
        <aside className="settings-sub-panel" aria-label={`${activeGroup.label} subgroups`}>
          {activeGroup.subgroups.map((item) => (
            <button key={item.id} type="button" className={item.id === subgroup ? "active" : ""} onClick={() => setSubgroup(item.id)}>
              {item.label}
            </button>
          ))}
        </aside>
      ) : null}

      <section className="settings-detail">
        <div className="detail-header">
          <div>
            <span>{activeGroup.label}</span>
            <h1>{activeGroup.subgroups.find((item) => item.id === subgroup)?.label ?? activeGroup.label}</h1>
          </div>
          <div className="status-stack">
            {statusMessage ? <div className="settings-status success" role="status">{statusMessage}</div> : null}
            {errorMessage ? <div className="settings-status error" role="alert">{errorMessage}</div> : null}
          </div>
        </div>
        {renderSubgroup(subgroup, settings, onSettingsChange, { projects, onResetDefaults, onDeleteProject, onClearProjectMemory, onClearProjectChat })}
      </section>

      <style jsx>{`
        .settings-page {
          height: 100vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: 260px 190px minmax(0, 1fr);
          background: #f7f1df;
          color: #2d271c;
        }
        .settings-main-panel,
        .settings-sub-panel {
          border-right: 1px solid rgba(57, 50, 36, 0.14);
          background: #fffaf0;
          padding: 16px;
          max-height: 100vh;
          overflow: auto;
        }
        .settings-main-panel {
          display: grid;
          align-content: start;
          gap: 14px;
        }
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: max-content;
          border: 1px solid rgba(57, 50, 36, 0.16);
          border-radius: 8px;
          background: #3a2a1d;
          color: #fff9e9;
          padding: 9px 11px;
        }
        .settings-title {
          display: grid;
          gap: 3px;
          padding: 8px 0;
        }
        .settings-title strong {
          font-size: 22px;
        }
        .settings-title span,
        nav small,
        .detail-header span,
        .field span,
        .project-row small {
          color: #75684f;
          font-size: 12px;
          line-height: 1.35;
        }
        nav {
          display: grid;
          gap: 6px;
        }
        nav button,
        .settings-sub-panel button {
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: inherit;
          display: grid;
          gap: 3px;
          padding: 10px;
          text-align: left;
        }
        nav button.active,
        nav button:hover,
        .settings-sub-panel button.active,
        .settings-sub-panel button:hover {
          border-color: rgba(109, 86, 31, 0.24);
          background: #fff3cd;
        }
        .settings-sub-panel {
          display: grid;
          align-content: start;
          gap: 6px;
        }
        .settings-detail {
          min-width: 0;
          padding: 30px min(5vw, 64px);
          overflow: auto;
          max-height: 100vh;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        h1 {
          margin: 3px 0 0;
          font-size: 34px;
          line-height: 1.05;
        }
        .settings-status {
          border-radius: 999px;
          padding: 8px 11px;
          font-size: 12px;
          white-space: nowrap;
        }
        .settings-status.success {
          background: #f2f8ec;
          color: #2f5135;
        }
        .settings-status.error {
          background: #fff5ec;
          color: #7c2d12;
        }
        @media (max-width: 860px) {
          .settings-page {
            grid-template-columns: 1fr;
            height: auto;
            overflow: auto;
          }
          .settings-main-panel,
          .settings-sub-panel {
            border-right: 0;
            border-bottom: 1px solid rgba(57, 50, 36, 0.14);
            max-height: none;
          }
          .settings-main-panel nav,
          .settings-sub-panel {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
          .settings-detail {
            padding: 22px 16px;
            max-height: none;
          }
          .detail-header {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}

function renderSubgroup(
  subgroup: SubGroup,
  settings: ProjectSettings,
  onSettingsChange: (partial: Partial<ProjectSettings>) => void,
  actions: Pick<SettingsPageProps, "projects" | "onResetDefaults" | "onDeleteProject" | "onClearProjectMemory" | "onClearProjectChat">
) {
  switch (subgroup) {
    case "appearance":
      return <SettingsGrid>
        <SelectField label="Theme tone" value={settings.themeTone} onChange={(themeTone) => onSettingsChange({ themeTone })} options={[["ivory", "Ivory"], ["warm", "Warm yellow"], ["sepia", "Sepia"], ["contrast", "High contrast"]]} />
        <SelectField label="UI density" value={settings.uiDensity} onChange={(uiDensity) => onSettingsChange({ uiDensity })} options={[["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]]} />
        <SelectField label="Text size" value={settings.textSize} onChange={(textSize) => onSettingsChange({ textSize })} options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} />
        <SelectField label="Motion" value={settings.animationSpeed} onChange={(animationSpeed) => onSettingsChange({ animationSpeed })} options={[["reduced", "Reduced"], ["normal", "Normal"], ["expressive", "Expressive"]]} />
        <ToggleField label="Reduced transparency" checked={settings.reducedTransparency} onChange={(reducedTransparency) => onSettingsChange({ reducedTransparency })} help="Uses solid surfaces instead of translucent panels." />
      </SettingsGrid>;
    case "accessibility":
      return <SettingsGrid>
        <SelectField label="Focus style" value={settings.focusStyle} onChange={(focusStyle) => onSettingsChange({ focusStyle })} options={[["subtle", "Subtle"], ["strong", "Strong"]]} />
        <ToggleField label="Show mode input hints" checked={settings.modeInputHints} onChange={(modeInputHints) => onSettingsChange({ modeInputHints })} />
        <ToggleField label="Chat Enter sends" checked={settings.chatEnterToSend} onChange={(chatEnterToSend) => onSettingsChange({ chatEnterToSend })} help="When off, the Send button submits chat messages." />
        <ToggleField label="Show chat context strip" checked={settings.chatShowContext} onChange={(chatShowContext) => onSettingsChange({ chatShowContext })} />
        <ToggleField label="Show object metadata" checked={settings.showObjectMeta} onChange={(showObjectMeta) => onSettingsChange({ showObjectMeta })} />
      </SettingsGrid>;
    case "navigation":
      return <SettingsGrid>
        <NumberField label="Sidebar width" value={settings.homeSidebarWidth} min={220} max={360} unit="px" onChange={(homeSidebarWidth) => onSettingsChange({ homeSidebarWidth })} />
        <ToggleField label="Show mode descriptions" checked={settings.homeShowModeDescriptions} onChange={(homeShowModeDescriptions) => onSettingsChange({ homeShowModeDescriptions })} />
        <ToggleField label="Show compact status markers" checked={settings.homeShowStatusMarkers} onChange={(homeShowStatusMarkers) => onSettingsChange({ homeShowStatusMarkers })} />
        <SelectField label="Default home mode" value={settings.homeDefaultMode} onChange={(homeDefaultMode) => onSettingsChange({ homeDefaultMode })} options={featureModes.map((mode) => [mode.id, mode.label])} />
        <SelectField label="After create" value={settings.defaultCreateAction} onChange={(defaultCreateAction) => onSettingsChange({ defaultCreateAction })} options={[["open-project", "Open project"], ["stay-home", "Stay on home"]]} />
      </SettingsGrid>;
    case "projects":
      return <SettingsGrid>
        <NumberField label="Recent project count" value={settings.homeRecentLimit} min={3} max={24} unit="items" onChange={(homeRecentLimit) => onSettingsChange({ homeRecentLimit })} />
        <SelectField label="Recent project sort" value={settings.homeRecentSort} onChange={(homeRecentSort) => onSettingsChange({ homeRecentSort })} options={[["updated", "Last updated"], ["created", "Created date"], ["name", "Name"]]} />
        <ToggleField label="Show project dates" checked={settings.homeShowProjectDates} onChange={(homeShowProjectDates) => onSettingsChange({ homeShowProjectDates })} />
        <ToggleField label="Compact project cards" checked={settings.homeCompactProjectCards} onChange={(homeCompactProjectCards) => onSettingsChange({ homeCompactProjectCards })} />
        <ToggleField label="Confirm project delete" checked={settings.confirmProjectDelete} onChange={(confirmProjectDelete) => onSettingsChange({ confirmProjectDelete })} />
      </SettingsGrid>;
    case "creation":
      return <SettingsGrid>
        <ToggleField label="Require source for Source Brief" checked={settings.requireSourceForSourceBrief} onChange={(requireSourceForSourceBrief) => onSettingsChange({ requireSourceForSourceBrief })} />
        <ToggleField label="Default project memory" checked={settings.memoryEnabled} onChange={(memoryEnabled) => onSettingsChange({ memoryEnabled })} />
        <SelectField label="Default source strictness" value={settings.sourceStrictness} onChange={(sourceStrictness) => onSettingsChange({ sourceStrictness })} options={[["relaxed", "Relaxed"], ["balanced", "Balanced"], ["strict", "Strict"]]} />
        <SelectField label="Delete behavior" value={settings.deleteBehavior} onChange={(deleteBehavior) => onSettingsChange({ deleteBehavior })} options={[["delete-descendants", "Delete descendants"], ["detach-descendants", "Detach descendants"], ["preserve-orphans", "Preserve orphans"], ["ask", "Ask every time"]]} />
      </SettingsGrid>;
    case "generation":
      return <SettingsGrid>
        <SelectField label="Image quality" value={settings.minimaxQuality} onChange={(minimaxQuality) => onSettingsChange({ minimaxQuality })} options={[["draft", "Draft"], ["balanced", "Balanced"], ["high", "High"]]} />
        <SelectField label="Default aspect ratio" value={settings.defaultAspectRatio} onChange={(defaultAspectRatio) => onSettingsChange({ defaultAspectRatio })} options={[["1:1", "1:1"], ["4:3", "4:3"], ["16:9", "16:9"]]} />
        <ToggleField label="Confirm before regenerate" checked={settings.confirmRegenerate} onChange={(confirmRegenerate) => onSettingsChange({ confirmRegenerate })} />
        <SelectField label="Auto-organize spacing" value={settings.canvasAutoOrganizeSpacing} onChange={(canvasAutoOrganizeSpacing) => onSettingsChange({ canvasAutoOrganizeSpacing })} options={[["tight", "Tight"], ["balanced", "Balanced"], ["wide", "Wide"]]} />
      </SettingsGrid>;
    case "models":
      return <section style={cardStyle}><ModelSelectors settings={settings} onSettingsChange={onSettingsChange} /></section>;
    case "canvas-layout":
      return <SettingsGrid>
        <SelectField label="Canvas grid" value={settings.canvasGrid} onChange={(canvasGrid) => onSettingsChange({ canvasGrid })} options={[["off", "Off"], ["dots", "Dots"], ["lines", "Lines"]]} />
        <SelectField label="Canvas snap" value={settings.canvasSnap} onChange={(canvasSnap) => onSettingsChange({ canvasSnap })} options={[["off", "Off"], ["fine", "Fine"], ["coarse", "Coarse"]]} />
        <SelectField label="Object scale" value={settings.canvasObjectScale} onChange={(canvasObjectScale) => onSettingsChange({ canvasObjectScale })} options={[["compact", "Compact"], ["normal", "Normal"], ["large", "Large"]]} />
        <NumberField label="Right panel width" value={settings.rightPanelWidth} min={280} max={560} unit="px" onChange={(rightPanelWidth) => onSettingsChange({ rightPanelWidth })} />
      </SettingsGrid>;
    case "connectors":
      return <SettingsGrid>
        <SelectField label="Connector style" value={settings.connectorStyle} onChange={(connectorStyle) => onSettingsChange({ connectorStyle })} options={[["soft", "Soft"], ["direct", "Direct"], ["stepped", "Stepped"]]} />
        <ToggleField label="Connector labels" checked={settings.connectorLabels} onChange={(connectorLabels) => onSettingsChange({ connectorLabels })} />
      </SettingsGrid>;
    case "toolbar":
      return <SettingsGrid>
        <ToggleField label="Toolbar labels" checked={settings.toolbarLabels} onChange={(toolbarLabels) => onSettingsChange({ toolbarLabels })} />
        <SelectField label="Toolbar position" value={settings.toolbarPosition} onChange={(toolbarPosition) => onSettingsChange({ toolbarPosition })} options={[["bottom", "Bottom"], ["left", "Left"]]} />
      </SettingsGrid>;
    case "chat-panel":
      return <SettingsGrid>
        <SelectField label="Bubble size" value={settings.chatBubbleSize} onChange={(chatBubbleSize) => onSettingsChange({ chatBubbleSize })} options={[["small", "Small"], ["medium", "Medium"], ["large", "Large"]]} />
        <ToggleField label="Open chat by default" checked={settings.chatDefaultOpen} onChange={(chatDefaultOpen) => onSettingsChange({ chatDefaultOpen })} />
        <ToggleField label="Show context strip" checked={settings.chatShowContext} onChange={(chatShowContext) => onSettingsChange({ chatShowContext })} />
      </SettingsGrid>;
    case "chat-behavior":
      return <SettingsGrid>
        <NumberField label="Visible chat history" value={settings.chatHistoryLimit} min={4} max={30} unit="messages" onChange={(chatHistoryLimit) => onSettingsChange({ chatHistoryLimit })} />
        <ToggleField label="Operator actions" checked={settings.chatOperatorEnabled} onChange={(chatOperatorEnabled) => onSettingsChange({ chatOperatorEnabled })} />
        <ToggleField label="Enter sends message" checked={settings.chatEnterToSend} onChange={(chatEnterToSend) => onSettingsChange({ chatEnterToSend })} />
      </SettingsGrid>;
    case "source-controls":
      return <SettingsGrid>
        <SelectField label="URL requirement" value={settings.sourceUrlRequirement} onChange={(sourceUrlRequirement) => onSettingsChange({ sourceUrlRequirement })} options={[["optional", "Optional"], ["warn", "Warn"], ["required", "Required"]]} />
        <SelectField label="Default source quality" value={settings.sourceDefaultQuality} onChange={(sourceDefaultQuality) => onSettingsChange({ sourceDefaultQuality })} options={[["draft", "Draft"], ["ok", "OK"], ["strong", "Strong"]]} />
        <ToggleField label="Show source quality" checked={settings.showSourceQuality} onChange={(showSourceQuality) => onSettingsChange({ showSourceQuality })} />
      </SettingsGrid>;
    case "export":
      return <SettingsGrid>
        <SelectField label="Default export format" value={settings.exportDefaultFormat} onChange={(exportDefaultFormat) => onSettingsChange({ exportDefaultFormat })} options={[["markdown", "Markdown"], ["text", "Plain text"], ["json", "JSON"]]} />
        <ToggleField label="Include sources" checked={settings.exportIncludeSources} onChange={(exportIncludeSources) => onSettingsChange({ exportIncludeSources })} />
        <ToggleField label="Include claims" checked={settings.exportIncludeClaims} onChange={(exportIncludeClaims) => onSettingsChange({ exportIncludeClaims })} />
      </SettingsGrid>;
    case "project-actions":
      return <ProjectActions projects={actions.projects} onDeleteProject={actions.onDeleteProject} onClearProjectMemory={actions.onClearProjectMemory} onClearProjectChat={actions.onClearProjectChat} />;
    case "reset":
      return <section style={cardStyle}><p style={{ margin: 0, color: "#75684f" }}>Reset global defaults to the app baseline. Existing projects keep their own saved settings.</p><button className="danger-action" type="button" onClick={actions.onResetDefaults}><RotateCcw size={16} aria-hidden />Reset global defaults</button><style jsx>{`.danger-action{display:inline-flex;align-items:center;gap:8px;width:max-content;border:1px solid rgba(155,56,44,.28);border-radius:8px;background:#fff5ec;color:#7c2d12;padding:9px 11px;font-weight:750;}`}</style></section>;
  }
}

function SettingsGrid({ children }: { children: ReactNode }) {
  return <section style={cardStyle}>{children}</section>;
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string]>; onChange: (value: T) => void }) {
  return <label className="field"><strong>{label}</strong><select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><FieldStyles /></label>;
}

function ToggleField({ label, checked, help, onChange }: { label: string; checked: boolean; help?: string; onChange: (checked: boolean) => void }) {
  return <label className="field toggle"><span><strong>{label}</strong>{help ? <small>{help}</small> : null}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><FieldStyles /></label>;
}

function NumberField({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="field"><span className="row"><strong>{label}</strong><small>{value} {unit}</small></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /><FieldStyles /></label>;
}

function FieldStyles() {
  return <style jsx>{`
    .field{display:grid;gap:7px;color:#332b22;}
    .field strong{font-size:13px;}
    .field small{color:#75684f;font-size:12px;line-height:1.35;}
    .field select{width:100%;min-height:38px;border:1px solid #ded4c5;border-radius:8px;background:#fffdf8;color:inherit;padding:8px 10px;font:inherit;}
    .field input[type="range"]{width:100%;accent-color:#7d4f13;}
    .field input[type="checkbox"]{width:19px;height:19px;accent-color:#3f6f5d;}
    .toggle{grid-template-columns:minmax(0,1fr) auto;align-items:center;}
    .toggle span{display:grid;gap:3px;}
    .row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
  `}</style>;
}

function ProjectActions({ projects, onDeleteProject, onClearProjectMemory, onClearProjectChat }: Pick<SettingsPageProps, "projects" | "onDeleteProject" | "onClearProjectMemory" | "onClearProjectChat">) {
  if (!projects.length) {
    return <section style={cardStyle}><p style={{ margin: 0, color: "#75684f" }}>No local projects exist yet.</p></section>;
  }

  return (
    <section style={cardStyle}>
      {projects.map((project) => (
        <div className="project-row" key={project.id}>
          <div>
            <strong>{project.name}</strong>
            <small>{project.description}</small>
          </div>
          <div className="actions">
            <button type="button" onClick={() => onClearProjectMemory(project.id)}><Database size={15} aria-hidden />Clear memory</button>
            <button type="button" onClick={() => onClearProjectChat(project.id)}>Clear chat</button>
            <button type="button" className="danger" onClick={() => onDeleteProject(project.id)}><Trash2 size={15} aria-hidden />Delete</button>
          </div>
        </div>
      ))}
      <style jsx>{`
        .project-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;border-bottom:1px solid rgba(57,50,36,.12);padding-bottom:12px;}
        .project-row:last-child{border-bottom:0;padding-bottom:0;}
        .project-row > div:first-child{display:grid;gap:4px;min-width:0;}
        .project-row strong{overflow-wrap:anywhere;}
        .actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:end;}
        .actions button{display:inline-flex;align-items:center;gap:6px;border:1px solid #d8cdbc;border-radius:8px;background:#fffdf8;color:#332b22;padding:8px 9px;font-size:12px;font-weight:750;}
        .actions .danger{border-color:rgba(155,56,44,.28);background:#fff5ec;color:#7c2d12;}
        @media (max-width: 760px){.project-row{grid-template-columns:1fr}.actions{justify-content:start}}
      `}</style>
    </section>
  );
}

export default SettingsPage;
