"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Clock3, Database, FileUp, FolderOpen, Play, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { featureModes } from "@/lib/defaults";
import type { Mode, Project, ProjectSettings } from "@/lib/types";

type CreateProjectInput = {
  prompt: string;
  mode: Mode;
  files: File[];
};

type HomeHubProps = {
  projects?: Project[];
  selectedMode?: Mode;
  settings?: ProjectSettings;
  isCreating?: boolean;
  onModeChange?: (mode: Mode) => void;
  onCreateProject?: ((input: CreateProjectInput) => void | Promise<void>) | ((prompt: string, mode: Mode, files: File[]) => void | Promise<void>);
  onOpenProject?: (projectId: string) => void;
  onOpenSettings?: () => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function HomeHub({
  projects = [],
  selectedMode = "flipbook",
  settings,
  isCreating = false,
  onModeChange,
  onCreateProject,
  onOpenProject,
  onOpenSettings
}: HomeHubProps) {
  const [mode, setMode] = useState<Mode>(selectedMode);
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMode = featureModes.find((item) => item.id === mode) ?? featureModes[0];
  const recentProjects = useMemo(() => projects.slice(0, 6), [projects]);

  function setNextMode(nextMode: Mode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  async function submit() {
    const trimmed = prompt.trim();
    if (!trimmed || isCreating) return;
    const create = onCreateProject as ((prompt: string, mode: Mode, files: File[]) => void | Promise<void>) | undefined;
    await create?.(trimmed, mode, files);
  }

  return (
    <main className="lumen-home" aria-label="Lumen Atlas home">
      <aside className="feature-panel" aria-label="Feature modes">
        <div className="brand-mark">
          <div className="brand-icon">
            <Sparkles size={18} aria-hidden />
          </div>
          <div>
            <strong>Lumen Atlas</strong>
            <span>Visual knowledge workspace</span>
          </div>
        </div>

        <nav className="mode-list">
          {featureModes.map((item) => (
            <button key={item.id} type="button" className={item.id === mode ? "mode-item active" : "mode-item"} onClick={() => setNextMode(item.id)}>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </nav>

        <div className="settings-hover">
          <button type="button" className="settings-button" onClick={onOpenSettings}>
            <Settings size={17} aria-hidden />
            Settings
            <ChevronDown size={15} aria-hidden />
          </button>
          <div className="settings-flyout" role="dialog" aria-label="Global settings preview">
            <div>
              <strong>Global defaults</strong>
              <span>Mode, memory, privacy, export, and providers.</span>
            </div>
            <p>
              Memory is <b>{settings?.memoryEnabled === false ? "off" : "on"}</b>. Sources are{" "}
              <b>{settings?.sourceStrictness ?? "balanced"}</b>. MiniMax quality is <b>{settings?.minimaxQuality ?? "balanced"}</b>.
            </p>
            <button type="button" onClick={onOpenSettings}>
              Open settings
            </button>
          </div>
        </div>
      </aside>

      <section className="creation-stage">
        <div className="prompt-wrap">
          <div className="prompt-heading">
            <div>
              <span className="eyebrow">{currentMode.label}</span>
              <h1>Start with a prompt, source, or question.</h1>
            </div>
            <div className="context-pill">
              <ShieldCheck size={16} aria-hidden />
              Local-first
            </div>
          </div>

          <div className="prompt-box">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Explore the economics, engineering, and policy tradeoffs of geothermal energy..."
              aria-label="Project prompt"
            />
            <div className="prompt-actions">
              <button type="button" className="upload-button" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={17} aria-hidden />
                {files.length ? `${files.length} source${files.length === 1 ? "" : "s"}` : "Upload source"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <button type="button" className="create-button" onClick={submit} disabled={!prompt.trim() || isCreating}>
                <Play size={17} aria-hidden />
                {isCreating ? "Creating" : "Create atlas"}
              </button>
            </div>
          </div>

          <div className="mode-box" aria-label="Mode details">
            <div>
              <strong>{currentMode.label}</strong>
              <span>{currentMode.detail}</span>
            </div>
            <div className="mode-grid">
              {featureModes.slice(0, 4).map((item) => (
                <button key={item.id} type="button" className={item.id === mode ? "chip active" : "chip"} onClick={() => setNextMode(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="recent-section" aria-label="Recent projects">
          <div className="section-title">
            <Clock3 size={17} aria-hidden />
            <h2>Recent projects</h2>
          </div>
          {recentProjects.length ? (
            <div className="recent-grid">
              {recentProjects.map((project) => (
                <button key={project.id} type="button" className="project-card" onClick={() => onOpenProject?.(project.id)}>
                  <span className="project-mode">{featureModes.find((item) => item.id === project.mode)?.label ?? project.mode}</span>
                  <strong>{project.name}</strong>
                  <small>{project.description}</small>
                  <time>{dateFormatter.format(new Date(project.updatedAt))}</time>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-recent">
              <FolderOpen size={24} aria-hidden />
              <span>No recent projects yet.</span>
            </div>
          )}
        </section>
      </section>

      <aside className="status-rail" aria-label="Workspace status">
        <div>
          <Database size={18} aria-hidden />
          <strong>SQLite</strong>
          <span>Projects persist locally.</span>
        </div>
        <div>
          <ShieldCheck size={18} aria-hidden />
          <strong>Memory</strong>
          <span>{settings?.memoryEnabled === false ? "Disabled by default." : "Explicit and project-scoped."}</span>
        </div>
      </aside>

      <style jsx>{`
        .lumen-home {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 220px;
          gap: 24px;
          padding: 22px;
          background: #f7f1df;
          color: #28251f;
        }
        button,
        textarea {
          font: inherit;
        }
        .feature-panel,
        .prompt-box,
        .mode-box,
        .project-card,
        .empty-recent,
        .status-rail > div {
          border: 1px solid rgba(57, 50, 36, 0.14);
          background: rgba(255, 252, 244, 0.86);
          box-shadow: 0 18px 45px rgba(63, 48, 24, 0.07);
        }
        .feature-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 18px;
          border-radius: 8px;
        }
        .brand-mark,
        .settings-button,
        .section-title,
        .context-pill,
        .prompt-actions,
        .upload-button,
        .create-button {
          display: flex;
          align-items: center;
        }
        .brand-mark {
          gap: 12px;
        }
        .brand-mark > div:last-child {
          display: grid;
          gap: 2px;
          min-width: 0;
        }
        .brand-mark span,
        .mode-item small,
        .mode-box span,
        .project-card small,
        .status-rail span,
        .settings-flyout span,
        .empty-recent span {
          color: #716957;
        }
        .brand-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #f1cf68;
        }
        .mode-list {
          display: grid;
          gap: 6px;
        }
        .mode-item {
          display: grid;
          gap: 3px;
          width: 100%;
          padding: 11px 12px;
          text-align: left;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }
        .mode-item.active,
        .mode-item:hover {
          border-color: rgba(109, 86, 31, 0.24);
          background: #fff7df;
        }
        .settings-hover {
          position: relative;
          margin-top: auto;
        }
        .settings-button {
          justify-content: space-between;
          gap: 9px;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid rgba(57, 50, 36, 0.14);
          border-radius: 7px;
          background: #2d2b25;
          color: #fff9e9;
          cursor: pointer;
        }
        .settings-flyout {
          position: absolute;
          left: calc(100% + 12px);
          bottom: 0;
          z-index: 5;
          width: 260px;
          padding: 14px;
          border: 1px solid rgba(57, 50, 36, 0.16);
          border-radius: 8px;
          background: #fffaf0;
          box-shadow: 0 22px 55px rgba(45, 39, 28, 0.16);
          opacity: 0;
          pointer-events: none;
          transform: translateX(-6px);
          transition: opacity 160ms ease, transform 160ms ease;
        }
        .settings-hover:hover .settings-flyout,
        .settings-hover:focus-within .settings-flyout {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(0);
        }
        .settings-flyout p {
          margin: 12px 0;
          color: #4b4438;
          line-height: 1.45;
        }
        .settings-flyout button {
          width: 100%;
          padding: 9px 10px;
          border: 0;
          border-radius: 7px;
          background: #e6c45d;
          color: #27231b;
          cursor: pointer;
        }
        .creation-stage {
          min-width: 0;
          display: grid;
          align-content: start;
          gap: 24px;
          padding-top: 56px;
        }
        .prompt-wrap {
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
        }
        .prompt-heading {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }
        .eyebrow,
        .project-mode {
          color: #8b6b18;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        h1 {
          max-width: 680px;
          margin: 5px 0 0;
          font-size: clamp(36px, 6vw, 64px);
          line-height: 0.98;
          letter-spacing: 0;
        }
        .context-pill {
          gap: 7px;
          flex: 0 0 auto;
          padding: 9px 11px;
          border: 1px solid rgba(57, 50, 36, 0.14);
          border-radius: 999px;
          background: #fffaf0;
        }
        .prompt-box {
          display: grid;
          gap: 14px;
          padding: 16px;
          border-radius: 8px;
        }
        textarea {
          min-height: 142px;
          resize: vertical;
          border: 0;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 20px;
          line-height: 1.45;
        }
        .prompt-actions {
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .upload-button,
        .create-button {
          gap: 8px;
          min-height: 42px;
          padding: 0 14px;
          border-radius: 7px;
          cursor: pointer;
        }
        .upload-button {
          border: 1px dashed rgba(57, 50, 36, 0.28);
          background: #fffaf0;
          color: #4c4436;
        }
        .create-button {
          border: 0;
          background: #29261f;
          color: #fff8e8;
        }
        .create-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .mode-box {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 14px;
          padding: 14px;
          border-radius: 8px;
        }
        .mode-box > div:first-child {
          display: grid;
          gap: 4px;
        }
        .mode-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: end;
        }
        .chip {
          padding: 8px 10px;
          border: 1px solid rgba(57, 50, 36, 0.13);
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
        }
        .chip.active {
          background: #f1cf68;
        }
        .recent-section {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .section-title {
          gap: 8px;
          margin-bottom: 12px;
        }
        h2 {
          margin: 0;
          font-size: 18px;
        }
        .recent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
        }
        .project-card {
          display: grid;
          gap: 8px;
          min-height: 150px;
          padding: 14px;
          text-align: left;
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
        }
        .project-card strong {
          font-size: 17px;
        }
        .project-card small {
          line-height: 1.4;
        }
        .project-card time {
          margin-top: auto;
          color: #8b6b18;
          font-size: 12px;
        }
        .empty-recent {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px;
          border-radius: 8px;
        }
        .status-rail {
          display: grid;
          align-content: start;
          gap: 12px;
          padding-top: 94px;
        }
        .status-rail > div {
          display: grid;
          gap: 7px;
          padding: 14px;
          border-radius: 8px;
        }
        @media (max-width: 1060px) {
          .lumen-home {
            grid-template-columns: 240px minmax(0, 1fr);
          }
          .status-rail {
            display: none;
          }
        }
        @media (max-width: 760px) {
          .lumen-home {
            grid-template-columns: 1fr;
            padding: 14px;
          }
          .creation-stage {
            padding-top: 0;
          }
          .settings-flyout {
            left: 0;
            right: 0;
            bottom: calc(100% + 10px);
            width: auto;
          }
          .prompt-heading,
          .mode-box {
            flex-direction: column;
          }
          .mode-grid {
            justify-content: start;
          }
          h1 {
            font-size: 40px;
          }
        }
      `}</style>
    </main>
  );
}

export default HomeHub;
