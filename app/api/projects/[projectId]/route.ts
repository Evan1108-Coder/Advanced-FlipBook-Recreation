import { NextResponse } from "next/server";
import { addSource, deleteObject, getProjectBundle, updateObjectFrame, updateProjectSettings } from "@/lib/db";
import { assertLocalRequest, readJsonBody } from "@/lib/api";
import { cleanFrame, cleanSettings } from "@/lib/validation";

type Params = Promise<{ projectId: string }>;

export async function GET(request: Request, context: { params: Params }) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const { projectId } = await context.params;
  const bundle = getProjectBundle(projectId);
  if (!bundle) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(bundle);
}

export async function PATCH(request: Request, context: { params: Params }) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const { projectId } = await context.params;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data as Record<string, unknown>;
  if (body.type === "settings") {
    const settings = updateProjectSettings(projectId, cleanSettings(body.settings));
    if (!settings) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ settings });
  }
  if (body.type === "frame") {
    if (typeof body.objectId !== "string") return NextResponse.json({ error: "Missing objectId" }, { status: 400 });
    const frame = cleanFrame(body.frame);
    if (!frame) return NextResponse.json({ error: "Invalid frame" }, { status: 400 });
    const bundle = updateObjectFrame(projectId, body.objectId, frame);
    if (!bundle) return NextResponse.json({ error: "Object not found" }, { status: 404 });
    return NextResponse.json(bundle);
  }
  if (body.type === "add-source") {
    const source = body.source as { title?: string; url?: string; excerpt?: string } | undefined;
    if (!source || typeof source.title !== "string" || !source.title.trim()) {
      return NextResponse.json({ error: "Missing source title" }, { status: 400 });
    }
    const bundle = addSource(projectId, {
      title: source.title.trim(),
      url: typeof source.url === "string" ? source.url.trim() : "",
      excerpt: typeof source.excerpt === "string" ? source.excerpt.trim() : "Manually added source."
    });
    if (!bundle) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(bundle);
  }
  if (body.type === "batch-frames") {
    const frames = body.frames as Array<{ objectId: string; frame: unknown }> | undefined;
    if (!Array.isArray(frames)) return NextResponse.json({ error: "Missing frames array" }, { status: 400 });
    let lastBundle = null;
    for (const item of frames) {
      if (typeof item.objectId !== "string") continue;
      const frame = cleanFrame(item.frame);
      if (!frame) continue;
      lastBundle = updateObjectFrame(projectId, item.objectId, frame);
    }
    if (!lastBundle) return NextResponse.json({ error: "No frames updated" }, { status: 404 });
    return NextResponse.json(lastBundle);
  }
  return NextResponse.json({ error: "Unsupported patch type" }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Params }) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const { projectId } = await context.params;
  const { searchParams } = new URL(request.url);
  const objectId = searchParams.get("objectId");
  if (!objectId) return NextResponse.json({ error: "Missing objectId" }, { status: 400 });
  const bundleBefore = getProjectBundle(projectId);
  if (!bundleBefore) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (bundleBefore.settings.deleteBehavior === "ask" && searchParams.get("confirm") !== "true") {
    return NextResponse.json({ error: "Delete confirmation required" }, { status: 409 });
  }
  const bundle = deleteObject(projectId, objectId, searchParams.get("confirm") === "true");
  if (!bundle) return NextResponse.json({ error: "Object not found or confirmation required" }, { status: 404 });
  return NextResponse.json(bundle);
}
