import { NextResponse } from "next/server";
import { deleteObject, getProjectBundle, updateObjectFrame, updateProjectSettings } from "@/lib/db";
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
