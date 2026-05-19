"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatBubble } from "@/components/ChatBubble";
import { FloatingToolbar } from "@/components/FloatingToolbar";
import { HomeHub } from "@/components/HomeHub";
import { RightPanel } from "@/components/RightPanel";
import { WorkspaceCanvas } from "@/components/WorkspaceCanvas";
import { panelSections } from "@/lib/defaults";
import type { CanvasObject, Mode, PanelSection, Project, ProjectBundle, ProjectSettings } from "@/lib/types";

export default function AppPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bundle, setBundle] = useState<ProjectBundle | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelSection | null>(null);
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const frameTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const selectedObject = useMemo(
    () => bundle?.objects.find((object) => object.id === selectedObjectId) ?? null,
    [bundle, selectedObjectId]
  );

  useEffect(() => {
    refreshProjects();
  }, []);

  async function refreshProjects() {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const data = await response.json();
    setProjects(data.projects ?? []);
  }

  async function openProject(projectId: string) {
    const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.project) return;
    setBundle(data);
    setSelectedObjectId(data.objects?.[0]?.id ?? null);
  }

  async function createProject(prompt: string, mode: Mode, files: File[] = []) {
    const sources = await Promise.all(
      files.slice(0, 8).filter((file) => file.size <= 1_000_000).map(async (file) => ({
        title: file.name,
        excerpt: await file.text().then((text) => text.slice(0, 3000)).catch(() => `Uploaded source file: ${file.name}`)
      }))
    );
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode, sources })
    });
    const data = await response.json();
    if (!response.ok || !data.project) return;
    setBundle(data);
    setSelectedObjectId(data.objects?.[0]?.id ?? null);
    refreshProjects();
  }

  async function exploreObject(object: CanvasObject, point: { x: number; y: number }) {
    if (!bundle || object.type !== "level") return;
    if (isGenerating) return;
    setIsGenerating(true);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Generation failed");
      setBundle(data);
      setSelectedObjectId(data.objects?.at(-1)?.id ?? object.id);
    } finally {
      setIsGenerating(false);
    }
  }

  async function runTool(tool: string, objectId = selectedObjectId) {
    if (!bundle) return;
    const [toolId, inlinePrompt] = tool.startsWith("ask:") ? ["ask", tool.slice(4)] : [tool, ""];
    if (toolId === "select" || toolId === "pan") return;
    if (toolId === "sources") {
      setActivePanel("Sources");
      return;
    }
    if (toolId === "organize") {
      organizeCanvas();
      return;
    }
    if (toolId === "new-flipbook") {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: bundle.project.id, action: "tool", tool: "New Flipbook" })
      });
      const data = await response.json();
      if (response.ok && data.project) {
        setBundle(data);
        setSelectedObjectId(data.objects?.at(-1)?.id ?? selectedObjectId);
      }
      return;
    }
    if (!objectId) return;
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
    const data = await response.json();
    if (!response.ok || !data.project) return;
    setBundle(data);
    setSelectedObjectId(data.objects?.at(-1)?.id ?? objectId);
  }

  async function updateFrame(objectId: string, frame: { x?: number; y?: number; width?: number; height?: number }) {
    if (!bundle) return;
    setBundle((current) => current ? {
      ...current,
      objects: current.objects.map((object) => (object.id === objectId ? { ...object, ...frame } : object))
    } : current);
    clearTimeout(frameTimers.current[objectId]);
    frameTimers.current[objectId] = setTimeout(() => {
      void fetch(`/api/projects/${bundle.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "frame", objectId, frame })
      });
    }, 160);
  }

  async function updateSettings(settings: Partial<ProjectSettings>) {
    if (!bundle) return;
    const optimistic = { ...bundle.settings, ...settings };
    setBundle((current) => current ? { ...current, settings: { ...current.settings, ...settings } } : current);
    const response = await fetch(`/api/projects/${bundle.project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "settings", settings })
    });
    const data = await response.json();
    if (response.ok && data.settings) {
      setBundle((current) => current ? { ...current, settings: data.settings } : current);
    } else {
      setBundle((current) => current ? { ...current, settings: optimistic } : current);
    }
  }

  async function deleteObject(objectId: string) {
    if (!bundle) return;
    const needsConfirm = bundle.settings.deleteBehavior === "ask";
    if (needsConfirm && !window.confirm("Delete this object? This project is set to ask before deleting.")) return;
    const response = await fetch(`/api/projects/${bundle.project.id}?objectId=${objectId}${needsConfirm ? "&confirm=true" : ""}`, { method: "DELETE" });
    if (!response.ok) return;
    const data = await response.json();
    if (!data?.project) return;
    setBundle(data);
    setSelectedObjectId(data.objects?.[0]?.id ?? null);
  }

  async function sendChat(message: string) {
    if (!bundle) return;
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: bundle.project.id, message, selectedObjectId })
    });
    const data = await response.json();
    if (!response.ok || !data.project) return;
    setBundle(data);
  }

  function organizeCanvas() {
    if (!bundle) return;
    const levels = bundle.objects.filter((object) => object.type === "level");
    const others = bundle.objects.filter((object) => object.type !== "level");
    const nextObjects = [
      ...levels.map((object, index) => ({ ...object, x: 260 + (index % 3) * 560, y: 140 + Math.floor(index / 3) * 390 })),
      ...others.map((object, index) => ({ ...object, x: 300 + (index % 3) * 470, y: 520 + Math.floor(index / 3) * 300 }))
    ];
    setBundle({
      ...bundle,
      objects: nextObjects
    });
    void Promise.all(nextObjects.map((object) =>
      fetch(`/api/projects/${bundle.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "frame", objectId: object.id, frame: { x: object.x, y: object.y, width: object.width, height: object.height } })
      })
    )).then(() => openProject(bundle.project.id));
  }

  if (!bundle) {
    return (
      <>
        <HomeHub projects={projects} onCreateProject={createProject} onOpenProject={openProject} onOpenSettings={() => setGlobalSettingsOpen(true)} />
        {globalSettingsOpen ? (
          <div className="global-settings-modal" role="dialog" aria-modal="true" aria-label="Global settings">
            <div>
              <h2>Global Settings</h2>
              <p>New project defaults are local-first: memory on, balanced sources, warm ivory appearance, and MiniMax fallback enabled when no API key is present.</p>
              <button className="primary-button" onClick={() => setGlobalSettingsOpen(false)}>Close</button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <main className={`workspace-shell motion-${bundle.settings.animationSpeed}`}>
      <div className="project-topbar">
        <button className="brand-button" onClick={() => setBundle(null)} aria-label="Return home">
          Lumen Atlas
        </button>
        <div>
          <strong>{bundle.project.name}</strong>
          <span>{bundle.objects.length} objects · local SQLite project</span>
        </div>
        <div className="panel-trigger">
          <button aria-label="Right panel" onClick={() => setPanelMenuOpen((open) => !open)}>{activePanel ?? "Panel"}</button>
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

      {isGenerating ? <div className="generation-toast">Generating next visual level...</div> : null}

      <FloatingToolbar selectedObject={selectedObject} settings={bundle.settings} onTool={runTool} />

      <ChatBubble bundle={bundle} selectedObject={selectedObject} onSend={sendChat} onOpenSettings={() => setActivePanel("Chat Settings")} />

      {activePanel ? (
        <RightPanel
          section={activePanel}
          bundle={bundle}
          selectedObject={selectedObject}
          onSectionChange={setActivePanel}
          onClose={() => setActivePanel(null)}
          onSettingsChange={updateSettings}
          onWidthChange={(width) => updateSettings({ rightPanelWidth: width })}
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
