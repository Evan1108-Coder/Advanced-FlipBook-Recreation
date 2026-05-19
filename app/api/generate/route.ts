import { NextResponse } from "next/server";
import { createChildLevel, createToolResult, getProjectBundle, updateObjectPayload } from "@/lib/db";
import { buildGenerationPrompt, generateVisual } from "@/lib/minimax";
import { clampNumber, cleanPrompt } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    projectId: string;
    parentId: string;
    action: "explore" | "tool";
    clickX?: number;
    clickY?: number;
    tool?: string;
    prompt?: string;
  };

  if (typeof body.projectId !== "string" || typeof body.parentId !== "string") {
    return NextResponse.json({ error: "Missing projectId or parentId" }, { status: 400 });
  }
  if (body.action !== "explore" && body.action !== "tool") {
    return NextResponse.json({ error: "Unsupported generation action" }, { status: 400 });
  }

  const bundle = getProjectBundle(body.projectId);
  if (!bundle) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const parent = bundle.objects.find((object) => object.id === body.parentId);
  if (!parent) return NextResponse.json({ error: "Parent object not found" }, { status: 404 });

  if (body.action === "tool") {
    const tool = typeof body.tool === "string" ? body.tool : "Learn";
    if (tool === "Regenerate" && parent.type === "level") {
      const prompt = buildGenerationPrompt({
        topic: parent.title,
        parentTitle: parent.title,
        memory: bundle.settings.memoryEnabled ? bundle.memory.slice(0, 5).map((item) => item.text) : []
      });
      const visual = await generateVisual({
        title: parent.title,
        prompt,
        aspectRatio: bundle.settings.defaultAspectRatio,
        quality: bundle.settings.minimaxQuality
      });
      return NextResponse.json(
        updateObjectPayload(body.projectId, body.parentId, {
          imageUrl: visual.imageUrl,
          provider: visual.provider,
          regeneratedAt: new Date().toISOString(),
          status: "ready"
        })
      );
    }
    return NextResponse.json(createToolResult({ projectId: body.projectId, fromId: body.parentId, tool, prompt: cleanPrompt(body.prompt, "") }));
  }

  const clickX = clampNumber(body.clickX ?? 0.5, 0, 1);
  const clickY = clampNumber(body.clickY ?? 0.5, 0, 1);
  const topic = inferTopic(parent.title, clickX, clickY);
  const prompt = buildGenerationPrompt({
    topic,
    parentTitle: parent.title,
    clickX,
    clickY,
    memory: bundle.settings.memoryEnabled ? bundle.memory.slice(0, 5).map((item) => item.text) : []
  });

  try {
    const visual = await generateVisual({
      title: topic,
      prompt,
      aspectRatio: bundle.settings.defaultAspectRatio,
      quality: bundle.settings.minimaxQuality
    });
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}

function inferTopic(parentTitle: string, x: number, y: number) {
  const horizontal = x < 0.34 ? "foundations" : x > 0.66 ? "applications" : "mechanism";
  const vertical = y < 0.34 ? "overview" : y > 0.66 ? "examples" : "details";
  return `${parentTitle}: ${horizontal} ${vertical}`;
}
