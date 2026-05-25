import { NextResponse } from "next/server";
import { assertLocalRequest, readJsonBody } from "@/lib/api";
import { createChildLevel, createProjectRootObject, createToolResult, getProjectBundle, updateObjectPayload } from "@/lib/db";
import { buildGenerationPrompt, generateVisual as minimaxGenerateVisual } from "@/lib/minimax";
import { generateImage } from "@/lib/providers/registry";
import { clampNumber, cleanPrompt } from "@/lib/validation";

export async function POST(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data as {
    projectId: string;
    parentId: string;
    action: "explore" | "tool";
    clickX?: number;
    clickY?: number;
    tool?: string;
    prompt?: string;
  };

  if (typeof body.projectId !== "string") {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }
  if (body.action !== "explore" && body.action !== "tool") {
    return NextResponse.json({ error: "Unsupported generation action" }, { status: 400 });
  }

  const bundle = getProjectBundle(body.projectId);
  if (!bundle) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (body.action === "tool" && body.tool === "New Flipbook") {
    return NextResponse.json(createProjectRootObject(body.projectId));
  }
  if (typeof body.parentId !== "string") {
    return NextResponse.json({ error: "Missing parentId" }, { status: 400 });
  }
  const parent = bundle.objects.find((object) => object.id === body.parentId);
  if (!parent) return NextResponse.json({ error: "Parent object not found" }, { status: 404 });
  if (body.action === "explore" && parent.type !== "level") {
    return NextResponse.json({ error: "Only Flipbook levels can be explored into child levels." }, { status: 400 });
  }

  if (body.action === "tool") {
    const tool = typeof body.tool === "string" ? body.tool : "Learn";
    if (["Select", "Pan"].includes(tool)) return NextResponse.json(bundle);
    if (tool === "Regenerate" && parent.type === "level") {
      const prompt = buildGenerationPrompt({
        topic: parent.title,
        parentTitle: parent.title,
        memory: bundle.settings.memoryEnabled ? bundle.memory.slice(0, 5).map((item) => item.text) : [],
        sourceStrictness: bundle.settings.sourceStrictness
      });
      const visual = await resolveImage(prompt, parent.title, bundle.settings);
      const next = updateObjectPayload(body.projectId, body.parentId, {
        imageUrl: visual.imageUrl,
        provider: visual.provider,
        regeneratedAt: new Date().toISOString(),
        status: "ready"
      });
      if (!next) return NextResponse.json({ error: "Object no longer exists" }, { status: 409 });
      return NextResponse.json(next);
    }
    const next = createToolResult({ projectId: body.projectId, fromId: body.parentId, tool, prompt: cleanPrompt(body.prompt, "") });
    if (!next) return NextResponse.json({ error: "Object no longer exists" }, { status: 409 });
    return NextResponse.json(next);
  }

  const clickX = clampNumber(body.clickX ?? 0.5, 0, 1);
  const clickY = clampNumber(body.clickY ?? 0.5, 0, 1);
  const topic = inferTopic(parent.title, clickX, clickY);
  const prompt = buildGenerationPrompt({
    topic,
    parentTitle: parent.title,
    clickX,
    clickY,
    memory: bundle.settings.memoryEnabled ? bundle.memory.slice(0, 5).map((item) => item.text) : [],
    sourceStrictness: bundle.settings.sourceStrictness
  });

  const visual = await resolveImage(prompt, topic, bundle.settings);
  const next = createChildLevel({
    projectId: body.projectId,
    parentId: body.parentId,
    clickX,
    clickY,
    title: topic,
    summary: `A deeper visual level about ${topic}, branched from ${parent.title}.`,
    transcript: `${topic} expands the selected part of ${parent.title}. This transcript is stored separately from the generated image so it can stay readable, searchable, and source-aware.`,
    imageUrl: visual.imageUrl,
    provider: visual.provider,
    remember: bundle.settings.memoryEnabled
  });
  return NextResponse.json(next);
}

import type { ProjectSettings } from "@/lib/types";

async function resolveImage(prompt: string, title: string, settings: ProjectSettings): Promise<{ imageUrl: string; provider: string }> {
  if (settings.imageModel) {
    try {
      const result = await generateImage(prompt, {
        model: settings.imageModel,
        aspectRatio: settings.defaultAspectRatio,
        quality: settings.minimaxQuality,
      });
      if (result) return result;
    } catch { /* fall through to minimax */ }
  }
  return minimaxGenerateVisual({
    title,
    prompt,
    aspectRatio: settings.defaultAspectRatio,
    quality: settings.minimaxQuality,
  });
}

function inferTopic(parentTitle: string, x: number, y: number) {
  const horizontal = x < 0.34 ? "foundations" : x > 0.66 ? "applications" : "mechanism";
  const vertical = y < 0.34 ? "overview" : y > 0.66 ? "examples" : "details";
  return `${parentTitle}: ${horizontal} ${vertical}`;
}
