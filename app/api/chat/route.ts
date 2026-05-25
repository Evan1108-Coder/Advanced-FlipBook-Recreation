import { NextResponse } from "next/server";
import { assertLocalRequest, readJsonBody } from "@/lib/api";
import { addChatMessage, createToolResult, getProjectBundle, updateProjectSettings } from "@/lib/db";

export async function POST(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data as { projectId?: string; message?: string; selectedObjectId?: string };
  if (typeof body.projectId !== "string" || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Missing projectId or message" }, { status: 400 });
  }
  const bundle = getProjectBundle(body.projectId);
  if (!bundle) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const message = body.message.trim().slice(0, 2000);
  addChatMessage(body.projectId, "user", message);
  const selected = bundle.objects.find((object) => object.id === body.selectedObjectId) ?? bundle.objects[0];
  const lower = message.toLowerCase();

  let reply = `I read the project context, memory, sources, settings, and selected object. Source strictness is ${bundle.settings.sourceStrictness}; for "${message}", I recommend working from ${selected?.title ?? "the canvas"}${bundle.settings.sourceStrictness === "strict" ? " and marking unsupported claims before using the answer" : " and keeping citations visible"}.`;

  if (!bundle.settings.chatOperatorEnabled && (lower.includes("learn") || lower.includes("strict source") || lower.includes("strict sources"))) {
    reply = "Operator actions are disabled for this project, so I can advise but will not change the canvas or settings.";
  } else if (lower.includes("learn") && selected) {
    const result = createToolResult({ projectId: body.projectId, fromId: selected.id, tool: "Learn", prompt: message });
    reply = result
      ? `Done. I created a Learn result connected to ${selected.title}.`
      : `Could not create a Learn result — the selected object may have been removed.`;
  } else if (lower.includes("strict source") || lower.includes("strict sources")) {
    updateProjectSettings(body.projectId, { sourceStrictness: "strict" });
    reply = "Done. I changed this project's source strictness to strict.";
  }

  if (lower.includes("clear chat")) {
    reply = "I can clear chat history, but this is a risky action and should ask for confirmation first in the full operator flow.";
  }

  addChatMessage(body.projectId, "assistant", reply);
  return NextResponse.json(getProjectBundle(body.projectId));
}
