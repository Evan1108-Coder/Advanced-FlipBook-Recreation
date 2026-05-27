import { NextResponse } from "next/server";
import { assertLocalRequest, readJsonBody } from "@/lib/api";
import { addChatMessage, createToolResult, getProjectBundle, updateProjectSettings } from "@/lib/db";
import { chatCompletion, getAvailableModels } from "@/lib/providers/registry";
import type { ChatMessage as ProviderMessage } from "@/lib/providers/types";

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

  const hasTextModel = getAvailableModels().text.length > 0;

  if (hasTextModel) {
    const reply = await getLLMReply(bundle, message, selected);
    const actions = detectActions(message, reply, bundle.settings.chatOperatorEnabled);
    const actionResults = executeActions(actions, body.projectId, selected?.id ?? null);
    addChatMessage(body.projectId, "assistant", appendActionResults(reply, actionResults));
  } else {
    const reply = getTemplateReply(bundle, message, selected);
    const actions = detectActions(message, reply, bundle.settings.chatOperatorEnabled);
    const actionResults = executeActions(actions, body.projectId, selected?.id ?? null);
    addChatMessage(body.projectId, "assistant", appendActionResults(reply, actionResults));
  }

  return NextResponse.json(getProjectBundle(body.projectId));
}

async function getLLMReply(
  bundle: ReturnType<typeof getProjectBundle> & {},
  userMessage: string,
  selected: { id: string; title: string; type: string } | undefined
): Promise<string> {
  const recentChat = bundle.chat.slice(-10).map((m) => `${m.role}: ${m.content}`).join("\n");
  const memoryContext = bundle.memory.slice(0, 5).map((m) => m.text).join("; ");
  const sourcesContext = bundle.sources.slice(0, 5).map((s) => `${s.title}: ${s.excerpt.slice(0, 100)}`).join("\n");

  const systemPrompt = [
    "You are the AI assistant for Advanced FlipBook Recreation, a local-first visual knowledge workspace.",
    "You help users explore topics, manage their project, and provide educational insights.",
    `Project: "${bundle.project.name}" (${bundle.project.mode} mode)`,
    `Source strictness: ${bundle.settings.sourceStrictness}`,
    selected ? `Currently selected object: "${selected.title}" (${selected.type})` : "",
    memoryContext ? `Project memory: ${memoryContext}` : "",
    sourcesContext ? `Sources:\n${sourcesContext}` : "",
    "",
    "Keep responses concise (2-4 sentences) unless the user asks for detail.",
    "If the user asks to learn about something, create content, or analyze — help them directly.",
    bundle.settings.sourceStrictness === "strict" ? "Mark any unsupported claims clearly." : "",
  ].filter(Boolean).join("\n");

  const messages: ProviderMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (recentChat) {
    const recentMessages = bundle.chat.slice(-12);
    for (const msg of recentMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  messages.push({ role: "user", content: userMessage });

  try {
    const result = await chatCompletion(messages, {
      model: bundle.settings.textModel ?? undefined,
      maxTokens: 1024,
      temperature: 0.7,
      timeoutMs: 12_000,
    });
    if (result) return result.content;
  } catch (error) {
    console.warn("LLM chat failed, falling back to template:", error);
    return `${getTemplateReply(bundle, userMessage, selected)}\n\nProvider note: ${providerFailureMessage(error)}`;
  }

  return getTemplateReply(bundle, userMessage, selected);
}

type OperatorAction =
  | { type: "tool"; tool: "Learn" | "Analysis" | "Compare" | "Timeline" | "Ask"; prompt?: string }
  | { type: "sourceStrictness"; value: "relaxed" | "balanced" | "strict" }
  | { type: "memory"; value: boolean }
  | { type: "none" };

function detectActions(
  userMessage: string,
  _reply: string,
  operatorEnabled: boolean
): OperatorAction[] {
  if (!operatorEnabled) return [];
  const lower = userMessage.toLowerCase().trim();
  const actions: OperatorAction[] = [];
  if (/\b(disable|turn off)\s+(project\s+)?memory\b/i.test(lower)) actions.push({ type: "memory", value: false });
  if (/\b(enable|turn on)\s+(project\s+)?memory\b/i.test(lower)) actions.push({ type: "memory", value: true });
  if (/\b(source|sources)\b.*\b(strict|balanced|relaxed)\b/i.test(lower) || /\b(strict|balanced|relaxed)\b.*\b(source|sources)\b/i.test(lower)) {
    const value = lower.includes("relaxed") ? "relaxed" : lower.includes("balanced") ? "balanced" : "strict";
    actions.push({ type: "sourceStrictness", value });
  }
  if (/\b(create|make|generate|add|run|use)\b/i.test(lower) && !/\b(how to|undo|stop|do not|don't)\b/i.test(lower)) {
    const toolMap: Array<[OperatorAction & { type: "tool" }, RegExp]> = [
      [{ type: "tool", tool: "Analysis" }, /\banalys(is|e|ze)|analysis\b/i],
      [{ type: "tool", tool: "Compare" }, /\bcompare|comparison\b/i],
      [{ type: "tool", tool: "Timeline" }, /\btimeline|sequence|chronology\b/i],
      [{ type: "tool", tool: "Ask", prompt: userMessage }, /\bask\b/i],
      [{ type: "tool", tool: "Learn" }, /\blearn\b/i]
    ];
    actions.push(...toolMap.filter(([, pattern]) => pattern.test(lower)).map(([action]) => action));
  }
  return actions;
}

function executeActions(
  actions: OperatorAction[],
  projectId: string,
  selectedObjectId: string | null
): string[] {
  return actions.map((action) => executeAction(action, projectId, selectedObjectId)).filter((result): result is string => Boolean(result));
}

function executeAction(
  action: OperatorAction,
  projectId: string,
  selectedObjectId: string | null
): string | null {
  if (action.type === "tool") {
    if (!selectedObjectId) return "No canvas object was selected, so I could not run the tool.";
    createToolResult({ projectId, fromId: selectedObjectId, tool: action.tool, prompt: action.prompt ?? "" });
    return `${action.tool} result created on the selected object.`;
  }
  if (action.type === "sourceStrictness") {
    updateProjectSettings(projectId, { sourceStrictness: action.value });
    return `Source strictness set to ${action.value}.`;
  }
  if (action.type === "memory") {
    updateProjectSettings(projectId, { memoryEnabled: action.value });
    return `Project memory ${action.value ? "enabled" : "disabled"}.`;
  }
  return null;
}

function appendActionResults(reply: string, actionResults: string[]) {
  return actionResults.length ? `${reply}\n\nAction completed: ${actionResults.join(" ")}` : reply;
}

function providerFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout|abort|timed out/i.test(message)) return "the selected text provider timed out, so I used the local fallback response.";
  return "the selected text provider failed, so I used the local fallback response.";
}

function getTemplateReply(
  bundle: ReturnType<typeof getProjectBundle> & {},
  message: string,
  selected: { id: string; title: string } | undefined
): string {
  const lower = message.toLowerCase();
  if (lower.includes("learn") && selected) {
    return `I can create a Learn result connected to "${selected.title}" and keep the explanation source-aware. To get richer AI-powered responses, keep a text model API key configured in your local .env file.`;
  }
  if (lower.includes("strict source") || lower.includes("strict sources")) {
    return "Done. Source strictness is now set to strict.";
  }
  return `I can see your project "${bundle.project.name}" with ${bundle.objects.length} objects. If the selected provider is unavailable, I will still answer with a local fallback and keep operator actions controlled.`;
}
