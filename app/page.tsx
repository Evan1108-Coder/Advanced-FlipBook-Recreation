"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { FloatingToolbar } from "@/components/FloatingToolbar";
import { HomeHub } from "@/components/HomeHub";
import { RightPanel } from "@/components/RightPanel";
import { WorkspaceCanvas } from "@/components/WorkspaceCanvas";
import { SettingsControls } from "@/components/SettingsControls";
import { defaultProjectSettings, panelSections } from "@/lib/defaults";
import { cleanSettings } from "@/lib/validation";
import type { CanvasObject, Mode, PanelSection, Project, ProjectBundle, ProjectSettings } from "@/lib/types";

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelSection | null>(null);
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isChatSending, setIsChatSending] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [globalDefaults, setGlobalDefaults] = useState<ProjectSettings>(defaultProjectSettings);
  const frameTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const settingsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSettings = useRef<Partial<ProjectSettings>>({});
  const selectedObject = useMemo(
    () => bundle?.objects.find((object) => object.id === selectedObjectId) ?? null,
    [bundle, selectedObjectId]
  );

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("advanced-flipbook-global-defaults");
      if (stored) setGlobalDefaults({ ...defaultProjectSettings, ...cleanSettings(JSON.parse(stored)) });
    } catch (error) {
      console.warn("Failed to load global defaults.", error);
    }
  }, []);

  async function refreshProjects() {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      setProjects(data.projects ?? []);
    } catch {
      setProjects([]);
    }
  }

  async function refreshBundle() {
    if (!bundle) return;
    try {
      const response = await fetch(`/api/projects/${bundle.project.id}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.project) setBundle(data);
    } catch {
      setGenerationError("Failed to refresh project data.");
    }
  }

  async function openProject(projectId: string) {
    if (isProjectLoading) return;
    setIsProjectLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.project) return;
      setBundle(data);
      setSelectedObjectId(data.objects?.[0]?.id ?? null);
    } catch {
      setGenerationError("Failed to open project. Please try again.");
    } finally {
      setIsProjectLoading(false);
    }
  }

  async function createProject(prompt: string, mode: Mode, files: File[] = []) {
    setIsProjectLoading(true);
    try {
      const sources = await Promise.all(
        files.slice(0, 8).filter((file) => file.size <= 1_000_000).map(async (file) => ({
          title: file.name,
          excerpt: await file.text().then((text) => text.slice(0, 3000)).catch(() => `Uploaded source file: ${file.name}`)
        }))
      );
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode, sources, settings: globalDefaults })
      });
      const data = await response.json();
      if (!response.ok || !data.project) {
        setGenerationError("Failed to create project. Please try again.");
        return;
      }
      setBundle(data);
      setSelectedObjectId(data.objects?.[0]?.id ?? null);
      refreshProjects();
    } catch {
      setGenerationError("Failed to create project. Please try again.");
    } finally {
      setIsProjectLoading(false);
    }
  }

  async function exploreObject(object: CanvasObject, point: { x: number; y: number }) {
    if (!bundle || object.type !== "level") return;
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: bundle.project.id,
          parentId: object.id,
          action: "explore",
          clickX: point.x,
          clickY: point.y
        })
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error ?? "Generation failed");
      setBundle(data);
      setSelectedObjectId(data.objects?.at(-1)?.id ?? object.id);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function runTool(tool: string, objectId = selectedObjectId) {
    if (!bundle) return;
    const [toolId, inlinePrompt] = tool.startsWith("ask:") ? ["ask", tool.slice(4)] : [tool, ""];
    if (toolId === "select") { setSelectedObjectId(null); return; }
    if (toolId === "pan") return;
    if (toolId === "sources") {
      setActivePanel("Sources");
      return;
    }
    if (toolId === "export") {
      setActivePanel("Export");
      return;
    }
    if (toolId === "organize") {
      organizeCanvas();
      return;
    }
    if (toolId === "new-flipbook") {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: bundle.project.id, action: "tool", tool: "New Flipbook" })
        });
        const data = await readJson(response);
        if (!response.ok) throw new Error(data.error ?? "New Flipbook failed");
        if (data.project) {
          setBundle(data);
          setSelectedObjectId(data.objects?.at(-1)?.id ?? selectedObjectId);
        }
      } catch (error) {
        setGenerationError(error instanceof Error ? error.message : "New Flipbook failed. Please try again.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }
    if (!objectId) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: bundle.project.id,
          parentId: objectId,
          action: "tool",
          tool: toolName(toolId),
          prompt: inlinePrompt
        })
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error ?? "Tool failed");
      if (!data.project) return;
      setBundle(data);
      setSelectedObjectId(data.objects?.at(-1)?.id ?? objectId);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Tool failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function updateFrame(objectId: string, frame: { x?: number; y?: number; width?: number; height?: number }) {
    if (!bundle) return;
    const projectId = bundle.project.id;
    setBundle((current) => current ? {
      ...current,
      objects: current.objects.map((object) => (object.id === objectId ? { ...object, ...frame } : object))
    } : current);
    clearTimeout(frameTimers.current[objectId]);
    frameTimers.current[objectId] = setTimeout(() => {
      void fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "frame", objectId, frame })
      });
    }, 160);
  }

  const updateSettings = useCallback((settings: Partial<ProjectSettings>) => {
    if (!bundle) return;
    setBundle((current) => current ? { ...current, settings: { ...current.settings, ...settings } } : current);
    pendingSettings.current = { ...pendingSettings.current, ...settings };
    if (settingsTimer.current) clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(async () => {
      const settingsToSave = pendingSettings.current;
      pendingSettings.current = {};
      try {
        const response = await fetch(`/api/projects/${bundle.project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "settings", settings: settingsToSave })
        });
        const data = await response.json();
        if (response.ok && data.settings) {
          setBundle((current) => current ? { ...current, settings: data.settings } : current);
        }
      } catch {
        setGenerationError("Settings were applied locally but could not be saved.");
      }
    }, 300);
  }, [bundle]);

  function updateGlobalDefaults(settings: Partial<ProjectSettings>) {
    setGlobalDefaults((current) => {
      const next = { ...current, ...settings };
      try {
        window.localStorage.setItem("advanced-flipbook-global-defaults", JSON.stringify(next));
      } catch (error) {
        console.warn("Failed to save global defaults.", error);
        setGenerationError("Global defaults could not be saved in this browser.");
      }
      return next;
    });
  }

  async function deleteObject(objectId: string) {
    if (!bundle) return;
    const needsConfirm = bundle.settings.deleteBehavior === "ask";
    if (needsConfirm && !window.confirm("Delete this object? This project is set to ask before deleting.")) return;
    try {
      const response = await fetch(`/api/projects/${bundle.project.id}?objectId=${objectId}${needsConfirm ? "&confirm=true" : ""}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      const data = await response.json();
      if (!data?.project) return;
      setBundle(data);
      setSelectedObjectId(data.objects?.[0]?.id ?? null);
    } catch {
      setGenerationError("Failed to delete object. Please try again.");
    }
  }

  async function sendChat(message: string) {
    if (!bundle) return;
    setIsChatSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: bundle.project.id, message, selectedObjectId })
      });
      const data = await response.json();
      if (!response.ok || !data.project) {
        setGenerationError("Chat message failed. Please try again.");
        return;
      }
      setBundle(data);
    } catch {
      setGenerationError("Chat message failed. Please try again.");
    } finally {
      setIsChatSending(false);
    }
  }

  async function organizeCanvas() {
    if (!bundle) return;
    const levels = bundle.objects.filter((object) => object.type === "level");
    const others = bundle.objects.filter((object) => object.type !== "level");
    const nextObjects = [
      ...levels.map((object, index) => ({ ...object, x: 260 + (index % 3) * 560, y: 140 + Math.floor(index / 3) * 390 })),
      ...others.map((object, index) => ({ ...object, x: 300 + (index % 3) * 470, y: 520 + Math.floor(index / 3) * 300 }))
    ];
    setBundle({ ...bundle, objects: nextObjects });
    try {
      const response = await fetch(`/api/projects/${bundle.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "batch-frames",
          frames: nextObjects.map((object) => ({ objectId: object.id, frame: { x: object.x, y: object.y, width: object.width, height: object.height } }))
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.project) setBundle(data);
      }
    } catch {
      setGenerationError("Failed to save organized layout.");
    }
  }

  useEffect(() => {
    if (!generationError) return;
    const timer = setTimeout(() => setGenerationError(null), 8000);
    return () => clearTimeout(timer);
  }, [generationError]);

  useEffect(() => {
    if (!globalSettingsOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setGlobalSettingsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [globalSettingsOpen]);

  useEffect(() => {
    return () => {
      Object.values(frameTimers.current).forEach(clearTimeout);
      if (settingsTimer.current) clearTimeout(settingsTimer.current);
    };
  }, []);

  if (!bundle) {
    return (
      <>
        <HomeHub projects={projects} settings={globalDefaults} isCreating={isProjectLoading} onCreateProject={createProject} onOpenProject={openProject} onOpenSettings={() => setGlobalSettingsOpen(true)} />
        {globalSettingsOpen ? (
          <div className="global-settings-modal" role="dialog" aria-modal="true" aria-label="Global settings" onClick={(e) => { if (e.target === e.currentTarget) setGlobalSettingsOpen(false); }}>
            <div>
              <h2>Global Settings</h2>
              <p>These defaults apply to new local projects. Existing projects keep their own project settings.</p>
              <div className="global-settings-content">
                <SettingsControls settings={globalDefaults} onSettingsChange={updateGlobalDefaults} />
              </div>
              <button className="primary-button" onClick={() => setGlobalSettingsOpen(false)}>Done</button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <main className={`workspace-shell motion-${bundle.settings.animationSpeed}`} onClick={() => setPanelMenuOpen(false)}>
      <h1 className="sr-only">{bundle.project.name} — Advanced FlipBook workspace</h1>
      <div className="project-topbar">
        <button className="brand-button" onClick={() => setBundle(null)} aria-label="Return home">
          Advanced FlipBook
        </button>
        <div>
          <strong>{bundle.project.name}</strong>
          <span>{bundle.objects.length} objects · local SQLite project</span>
        </div>
        <div className="panel-trigger">
          <button aria-label="Right panel" onClick={(e) => { e.stopPropagation(); setPanelMenuOpen((open) => !open); }}>{activePanel ?? "Panel"}</button>
          <div className={`panel-menu ${panelMenuOpen ? "open" : ""}`}>
            {panelSections.map((section) => (
              <button key={section} onClick={() => { setActivePanel(activePanel === section ? null : section); setPanelMenuOpen(false); }}>
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      <WorkspaceCanvas
        bundle={bundle}
        selectedObjectId={selectedObjectId}
        onSelect={setSelectedObjectId}
        onExplore={exploreObject}
        onTool={runTool}
        onFrameChange={updateFrame}
        onDelete={deleteObject}
      />

      {isGenerating ? <div className="generation-toast" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden />Generating next visual level...</div> : null}
      {!isGenerating && generationError ? <div className="generation-toast error" role="alert" aria-live="assertive">{generationError}<button className="toast-dismiss" onClick={() => setGenerationError(null)} aria-label="Dismiss">&times;</button></div> : null}

      <FloatingToolbar selectedObject={selectedObject} settings={bundle.settings} onTool={runTool} />

      <ChatBubble bundle={bundle} selectedObject={selectedObject} isSending={isChatSending} onSend={sendChat} onOpenSettings={() => setActivePanel("Chat Settings")} />

      {activePanel ? (
        <RightPanel
          section={activePanel}
          bundle={bundle}
          selectedObject={selectedObject}
          onSectionChange={setActivePanel}
          onClose={() => setActivePanel(null)}
          onSettingsChange={updateSettings}
          onWidthChange={(width) => updateSettings({ rightPanelWidth: width })}
          onRefresh={refreshBundle}
        />
      ) : null}
    </main>
  );
}

function toolName(tool: string) {
  const names: Record<string, string> = {
    learn: "Learn",
    ask: "Ask",
    analysis: "Analysis",
    compare: "Compare",
    timeline: "Timeline",
    regenerate: "Regenerate",
    export: "Export"
  };
  return names[tool] ?? tool;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
