"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Clock3, Database, FileUp, FolderOpen, Play, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { featureModes } from "@/lib/defaults";
import type { Mode, Project, ProjectSettings } from "@/lib/types";

type HomeHubProps = {
  projects?: Project[];
  selectedMode?: Mode;
  settings: ProjectSettings;
  isCreating?: boolean;
  onModeChange?: (mode: Mode) => void;
  onCreateProject?: (prompt: string, mode: Mode, files: File[]) => void | Promise<void>;
  onOpenProject?: (projectId: string) => void;
  onOpenSettings?: () => void;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const quickModes: Mode[] = ["textbook", "compare", "source-brief", "study-guide", "flipbook"];

const modeCopy: Record<Mode, { placeholder: string; hint: string; fileLabel: string }> = {
  flipbook: {
    placeholder: "Name the visual world, attach a source, or upload an image to begin branching...",
    hint: "Start from a topic, source, or image. Double-click generated visual regions inside the project to branch.",
    fileLabel: "Upload source or image"
  },
  textbook: {
    placeholder: "Topic for the explainer image, plus any terms that must appear...",
    hint: "Best when you provide a clear topic and optional source text.",
    fileLabel: "Upload source"
  },
  "knowledge-map": {
    placeholder: "Central concept for the map...",
    hint: "Set depth if you want a broader or tighter concept map.",
    fileLabel: "Upload source"
  },
  timeline: {
    placeholder: "Topic, event, process, or era...",
    hint: "Add a time range when chronology matters.",
    fileLabel: "Upload source"
  },
  compare: {
    placeholder: "Optional criteria, source notes, or what tradeoffs to emphasize...",
    hint: "Comparison needs two subjects. Optional notes can narrow the lens.",
    fileLabel: "Upload source"
  },
  "study-guide": {
    placeholder: "Topic, source, or exam focus...",
    hint: "Choose the intended level so review questions fit the user.",
    fileLabel: "Upload source"
  },
  "source-brief": {
    placeholder: "Paste source excerpt, citation notes, or upload a file...",
    hint: "A source brief needs source material. Upload or paste enough text to evaluate claims.",
    fileLabel: "Upload source"
  },
  presentation: {
    placeholder: "Topic or source for a concise teaching sequence...",
    hint: "Slide count controls the initial sequence size.",
    fileLabel: "Upload source"
  }
};

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
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [timelineRange, setTimelineRange] = useState("");
  const [mapDepth, setMapDepth] = useState("balanced");
  const [studyLevel, setStudyLevel] = useState("professional");
  const [slideCount, setSlideCount] = useState(6);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(selectedMode);
  }, [selectedMode]);

  const currentMode = featureModes.find((item) => item.id === mode) ?? featureModes[0];
  const recentProjects = useMemo(() => sortProjects(projects, settings.homeRecentSort).slice(0, settings.homeRecentLimit), [projects, settings.homeRecentLimit, settings.homeRecentSort]);
  const validation = getValidation(mode, prompt, files, { compareA, compareB }, settings);
  const className = [
    "lumen-home",
    `theme-${settings.themeTone}`,
    `density-${settings.uiDensity}`,
    `text-${settings.textSize}`,
    `focus-${settings.focusStyle}`,
    settings.reducedTransparency ? "reduced-transparency" : ""
  ].filter(Boolean).join(" ");

  function setNextMode(nextMode: Mode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  async function submit() {
    if (!validation.canSubmit || isCreating) return;
    await onCreateProject?.(buildPrompt(mode, promptInputRef.current?.value ?? prompt, files, { compareA, compareB, timelineRange, mapDepth, studyLevel, slideCount }), mode, files);
  }

  return (
    <main className={className} aria-label="Advanced FlipBook Recreation home" style={{ "--sidebar-width": `${settings.homeSidebarWidth}px` } as CSSProperties}>
      <aside className="feature-panel" aria-label="Feature modes">
        <div className="brand-mark">
          <div className="brand-icon">
            <Sparkles size={18} aria-hidden />
          </div>
          <div>
            <strong>Advanced FlipBook</strong>
            <span>Visual knowledge workspace</span>
          </div>
        </div>

        <nav className="mode-list">
          {featureModes.map((item) => (
            <button key={item.id} type="button" className={item.id === mode ? "mode-item active" : "mode-item"} onClick={() => setNextMode(item.id)}>
              <span>{item.label}</span>
              {settings.homeShowModeDescriptions ? <small>{item.detail}</small> : null}
            </button>
          ))}
        </nav>

        <div className="settings-hover">
          <button type="button" className="settings-button" onClick={onOpenSettings}>
            <Settings size={17} aria-hidden />
            Settings
            <ChevronDown size={15} aria-hidden />
          </button>
          <div className="settings-flyout" role="tooltip" aria-label="Global settings preview">
            <strong>Global defaults</strong>
            <p>Memory {settings.memoryEnabled ? "on" : "off"} · Sources {settings.sourceStrictness} · Quality {settings.minimaxQuality}</p>
          </div>
        </div>
      </aside>

      <section className="creation-stage">
        <div className="prompt-wrap">
          <div className="prompt-heading">
            <div>
              <span className="eyebrow">{currentMode.label}</span>
              <h1>Start with the right input for the job.</h1>
            </div>
            {settings.homeShowStatusMarkers ? (
              <div className="status-markers" aria-label="Workspace status">
                <span className="context-pill" title="Local-first"><ShieldCheck size={15} aria-hidden />Local</span>
                <span className="context-pill" title="SQLite storage"><Database size={15} aria-hidden />SQLite</span>
                <span className="context-pill" title={`Memory ${settings.memoryEnabled ? "on" : "off"}`}><ShieldCheck size={15} aria-hidden />Memory {settings.memoryEnabled ? "on" : "off"}</span>
              </div>
            ) : null}
          </div>

          <div className="prompt-box">
            <ModeSpecificInputs
              mode={mode}
              compareA={compareA}
              compareB={compareB}
              timelineRange={timelineRange}
              mapDepth={mapDepth}
              studyLevel={studyLevel}
              slideCount={slideCount}
              onCompareA={setCompareA}
              onCompareB={setCompareB}
              onTimelineRange={setTimelineRange}
              onMapDepth={setMapDepth}
              onStudyLevel={setStudyLevel}
              onSlideCount={setSlideCount}
            />
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onInput={(event) => setPrompt(event.currentTarget.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder={modeCopy[mode].placeholder}
              aria-label={`${currentMode.label} input`}
            />
            <div className="prompt-actions">
              <button type="button" className="upload-button" onClick={() => fileInputRef.current?.click()}>
                <FileUp size={17} aria-hidden />
                {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : modeCopy[mode].fileLabel}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                aria-label="Upload source files"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <div className="create-stack">
                {!validation.canSubmit ? <span role="status">{validation.reason}</span> : settings.modeInputHints ? <span>{modeCopy[mode].hint}</span> : null}
                <button type="button" className="create-button" onClick={submit} disabled={isCreating || !validation.canSubmit}>
                  <Play size={17} aria-hidden />
                  {isCreating ? "Creating" : "Create atlas"}
                </button>
              </div>
            </div>
          </div>

          <div className="mode-box" aria-label="Common commands">
            <div>
              <strong>Quick starts</strong>
              <span>Five fast starts, separate from the full mode list.</span>
            </div>
            <div className="mode-grid">
              {quickModes.map((itemId) => {
                const item = featureModes.find((modeItem) => modeItem.id === itemId)!;
                return (
                  <button key={item.id} type="button" className={item.id === mode ? "chip active" : "chip"} onClick={() => setNextMode(item.id)}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {settings.homeShowProjectDates || recentProjects.length ? (
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
                    {settings.homeShowProjectDates ? <time>{dateFormatter.format(new Date(project.updatedAt))}</time> : null}
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
        ) : null}
      </section>

      <style jsx>{`
        .lumen-home {
          height: 100vh;
          overflow: visible;
          display: grid;
          grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
          gap: 0;
          background: #f7f1df;
          color: #28251f;
        }
        .theme-warm { background: #f6ecd0; }
        .theme-sepia { background: #eee0c7; color: #251d15; }
        .theme-contrast { background: #fff8df; color: #17130e; }
        .text-small { font-size: 14px; }
        .text-large { font-size: 17px; }
        .feature-panel,
        .prompt-box,
        .mode-box,
        .project-card,
        .empty-recent {
          border: 1px solid rgba(57, 50, 36, 0.14);
          background: rgba(255, 252, 244, 0.88);
          box-shadow: 0 18px 45px rgba(63, 48, 24, 0.07);
        }
        .reduced-transparency .feature-panel,
        .reduced-transparency .prompt-box,
        .reduced-transparency .mode-box,
        .reduced-transparency .project-card,
        .reduced-transparency .empty-recent {
          background: #fffaf0;
        }
        .feature-panel {
          height: calc(100vh - 28px);
          position: sticky;
          top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 14px;
          padding: 14px;
          border-radius: 8px;
          overflow: visible;
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
        .brand-mark { gap: 10px; }
        .brand-mark > div:last-child { display: grid; gap: 2px; min-width: 0; }
        .brand-mark span,
        .mode-item small,
        .mode-box span,
        .project-card small,
        .settings-flyout p,
        .create-stack span {
          color: #716957;
        }
        .brand-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #f1cf68;
          flex: 0 0 auto;
        }
        .mode-list {
          display: grid;
          gap: 2px;
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .mode-item {
          display: grid;
          gap: 1px;
          width: 100%;
          padding: 5px 8px;
          text-align: left;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }
        .density-compact .mode-item { padding: 4px 8px; }
        .density-spacious .mode-item { padding: 8px 10px; }
        .mode-item.active,
        .mode-item:hover {
          border-color: rgba(109, 86, 31, 0.24);
          background: #fff7df;
        }
        .mode-item span { font-weight: 720; }
        .mode-item small { line-height: 1.14; }
        .settings-hover {
          position: relative;
          margin-top: auto;
        }
        .settings-button {
          justify-content: space-between;
          gap: 9px;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid rgba(57, 50, 36, 0.18);
          border-radius: 7px;
          background: #3a2a1d;
          color: #fff9e9;
          cursor: pointer;
        }
        .settings-flyout {
          position: absolute;
          left: calc(100% + 12px);
          bottom: 0;
          z-index: 5;
          width: 250px;
          padding: 13px;
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
        .settings-flyout p { margin: 8px 0 0; line-height: 1.45; }
        .creation-stage {
          height: 100vh;
          min-width: 0;
          overflow: auto;
          display: grid;
          align-content: start;
          gap: 24px;
          padding: 52px min(6vw, 76px) 42px;
        }
        .prompt-wrap {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .prompt-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: start;
          gap: 18px;
          margin-bottom: 18px;
        }
        .eyebrow,
        .project-mode {
          color: #8b6b18;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        h1 {
          max-width: 760px;
          margin: 5px 0 0;
          font-size: clamp(38px, 6vw, 68px);
          line-height: 0.98;
          letter-spacing: 0;
        }
        .status-markers {
          display: flex;
          gap: 8px;
          justify-content: start;
          flex-wrap: wrap;
          max-width: 100%;
        }
        .context-pill {
          gap: 6px;
          flex: 0 0 auto;
          padding: 8px 10px;
          border: 1px solid rgba(57, 50, 36, 0.14);
          border-radius: 999px;
          background: #fffaf0;
          white-space: nowrap;
          font-size: 13px;
        }
        .prompt-box {
          display: grid;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
        }
        textarea,
        input,
        select {
          font: inherit;
        }
        textarea {
          min-height: 124px;
          resize: vertical;
          border: 0;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 20px;
          line-height: 1.45;
        }
        .mode-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .mode-fields label {
          display: grid;
          gap: 5px;
          color: #3b342d;
          font-size: 12px;
          font-weight: 750;
        }
        .mode-fields input,
        .mode-fields select {
          min-height: 38px;
          border: 1px solid rgba(57, 50, 36, 0.16);
          border-radius: 7px;
          background: #fffdf8;
          color: inherit;
          padding: 8px 9px;
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
        .create-stack {
          display: flex;
          align-items: center;
          justify-content: end;
          gap: 12px;
          min-width: min(100%, 480px);
          margin-left: auto;
        }
        .create-stack span {
          font-size: 12px;
          text-align: right;
        }
        .create-button {
          border: 0;
          background: #29261f;
          color: #fff8e8;
          white-space: nowrap;
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
        .mode-box > div:first-child { display: grid; gap: 4px; }
        .mode-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: end;
        }
        .chip {
          padding: 8px 12px;
          border: 1px solid rgba(57, 50, 36, 0.13);
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
        }
        .chip.active { background: #f1cf68; }
        .recent-section {
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .section-title { gap: 8px; margin-bottom: 12px; }
        h2 { margin: 0; font-size: 18px; }
        .recent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 12px;
        }
        .project-card {
          display: grid;
          gap: 8px;
          min-height: ${settings.homeCompactProjectCards ? "118px" : "150px"};
          padding: ${settings.homeCompactProjectCards ? "12px" : "14px"};
          text-align: left;
          border-radius: 8px;
          color: inherit;
          cursor: pointer;
        }
        .project-card strong {
          font-size: 17px;
          overflow-wrap: anywhere;
        }
        .project-card small {
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: ${settings.homeCompactProjectCards ? 2 : 3};
          -webkit-box-orient: vertical;
          overflow: hidden;
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
        .focus-strong :global(button:focus-visible),
        .focus-strong :global(input:focus-visible),
        .focus-strong :global(textarea:focus-visible),
        .focus-strong :global(select:focus-visible) {
          outline: 3px solid #1f5e86;
          outline-offset: 3px;
        }
        @media (max-width: 900px) {
          .lumen-home {
            grid-template-columns: 1fr;
            height: auto;
            overflow: auto;
          }
          .feature-panel {
            position: relative;
            top: auto;
            height: auto;
            margin: 14px;
            order: 2;
          }
          .mode-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .creation-stage {
            height: auto;
            min-height: 100vh;
            padding: 24px 14px;
          }
          .settings-flyout {
            left: 0;
            right: 0;
            bottom: calc(100% + 10px);
            width: auto;
          }
          .prompt-heading,
          .mode-box {
            grid-template-columns: 1fr;
            flex-direction: column;
          }
          .status-markers,
          .mode-grid {
            justify-content: start;
          }
          h1 { font-size: 36px; }
        }
      `}</style>
    </main>
  );
}

function ModeSpecificInputs({
  mode,
  compareA,
  compareB,
  timelineRange,
  mapDepth,
  studyLevel,
  slideCount,
  onCompareA,
  onCompareB,
  onTimelineRange,
  onMapDepth,
  onStudyLevel,
  onSlideCount
}: {
  mode: Mode;
  compareA: string;
  compareB: string;
  timelineRange: string;
  mapDepth: string;
  studyLevel: string;
  slideCount: number;
  onCompareA: (value: string) => void;
  onCompareB: (value: string) => void;
  onTimelineRange: (value: string) => void;
  onMapDepth: (value: string) => void;
  onStudyLevel: (value: string) => void;
  onSlideCount: (value: number) => void;
}) {
  if (mode === "compare") {
    return (
      <div className="mode-fields">
        <label>Subject A<input value={compareA} onChange={(event) => onCompareA(event.target.value)} placeholder="First idea, system, era..." /></label>
        <label>Subject B<input value={compareB} onChange={(event) => onCompareB(event.target.value)} placeholder="Second idea, system, era..." /></label>
      </div>
    );
  }
  if (mode === "timeline") {
    return <div className="mode-fields"><label>Time range<input value={timelineRange} onChange={(event) => onTimelineRange(event.target.value)} placeholder="Optional, e.g. 1850-2026" /></label></div>;
  }
  if (mode === "knowledge-map") {
    return (
      <div className="mode-fields">
        <label>Map depth<select value={mapDepth} onChange={(event) => onMapDepth(event.target.value)}><option value="tight">Tight</option><option value="balanced">Balanced</option><option value="deep">Deep</option></select></label>
      </div>
    );
  }
  if (mode === "study-guide") {
    return (
      <div className="mode-fields">
        <label>Study level<select value={studyLevel} onChange={(event) => onStudyLevel(event.target.value)}><option value="intro">Intro</option><option value="professional">Professional</option><option value="expert">Expert</option></select></label>
      </div>
    );
  }
  if (mode === "presentation") {
    return <div className="mode-fields"><label>Slide count<input type="number" min={3} max={12} value={slideCount} onChange={(event) => onSlideCount(clampNumber(Number(event.target.value), 3, 12))} /></label></div>;
  }
  return null;
}

function sortProjects(projects: Project[], sort: ProjectSettings["homeRecentSort"]) {
  return [...projects].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    const key = sort === "created" ? "createdAt" : "updatedAt";
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

function getValidation(mode: Mode, prompt: string, files: File[], compare: { compareA: string; compareB: string }, settings: ProjectSettings) {
  const hasPrompt = Boolean(prompt.trim());
  const hasFile = files.length > 0;
  if (mode === "compare" && (!compare.compareA.trim() || !compare.compareB.trim())) return { canSubmit: false, reason: "Add both comparison subjects." };
  if (mode === "source-brief" && settings.requireSourceForSourceBrief && !hasPrompt && !hasFile) return { canSubmit: false, reason: "Add source text or upload a file." };
  if (!hasPrompt && !hasFile && mode !== "compare") return { canSubmit: false, reason: "Add input or upload a file." };
  return { canSubmit: true, reason: "" };
}

function buildPrompt(
  mode: Mode,
  prompt: string,
  files: File[],
  extras: { compareA: string; compareB: string; timelineRange: string; mapDepth: string; studyLevel: string; slideCount: number }
) {
  const trimmed = prompt.trim();
  const fileHint = files.length ? ` Attached files: ${files.map((file) => file.name).join(", ")}.` : "";
  if (mode === "compare") return `Compare ${extras.compareA.trim()} with ${extras.compareB.trim()}.${trimmed ? ` Focus: ${trimmed}.` : ""}${fileHint}`;
  if (mode === "timeline") return `${trimmed || "Timeline project"}.${extras.timelineRange.trim() ? ` Time range: ${extras.timelineRange.trim()}.` : ""}${fileHint}`;
  if (mode === "knowledge-map") return `${trimmed || "Knowledge map project"}. Map depth: ${extras.mapDepth}.${fileHint}`;
  if (mode === "study-guide") return `${trimmed || "Study guide project"}. Study level: ${extras.studyLevel}.${fileHint}`;
  if (mode === "presentation") return `${trimmed || "Presentation project"}. Slide count: ${extras.slideCount}.${fileHint}`;
  return trimmed || `Create a visual brief from ${files.map((file) => file.name).join(", ")}`;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default HomeHub;
