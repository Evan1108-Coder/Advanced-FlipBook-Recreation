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
    const action = detectAction(message, reply, bundle.settings.chatOperatorEnabled);
    executeAction(action, body.projectId, selected?.id ?? null);
    addChatMessage(body.projectId, "assistant", reply);
  } else {
    const reply = getTemplateReply(bundle, message, selected);
    addChatMessage(body.projectId, "assistant", reply);
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
    });
    if (result) return result.content;
  } catch (error) {
    console.warn("LLM chat failed, falling back to template:", error);
  }

  return getTemplateReply(bundle, userMessage, selected);
}

function detectAction(
  userMessage: string,
  _reply: string,
  operatorEnabled: boolean
): { type: "learn" | "strict" | "none"; } {
  if (!operatorEnabled) return { type: "none" };
  const lower = userMessage.toLowerCase().trim();
  if (/^(create|make|generate)\s+(a\s+)?learn\b/i.test(lower) || /\blearn\s+(about|from|result)\b/i.test(lower)) {
    if (!lower.includes("how to") && !lower.includes("undo") && !lower.includes("stop")) {
      return { type: "learn" };
    }
  }
  if (/^set\s+source.*strict/i.test(lower) || /^(enable|turn on)\s+strict\s+source/i.test(lower)) {
    return { type: "strict" };
  }
  return { type: "none" };
}

function executeAction(
  action: { type: string },
  projectId: string,
  selectedObjectId: string | null
) {
  if (action.type === "learn" && selectedObjectId) {
    createToolResult({ projectId, fromId: selectedObjectId, tool: "Learn", prompt: "" });
  } else if (action.type === "strict") {
    updateProjectSettings(projectId, { sourceStrictness: "strict" });
  }
}

function getTemplateReply(
  bundle: ReturnType<typeof getProjectBundle> & {},
  message: string,
  selected: { id: string; title: string } | undefined
): string {
  const lower = message.toLowerCase();
  if (lower.includes("learn") && selected) {
    return `I created a Learn result connected to "${selected.title}". To get richer AI-powered responses, add a text model API key (OpenAI, Anthropic, Google, Groq, or Moonshot) in your .env.local file.`;
  }
  if (lower.includes("strict source") || lower.includes("strict sources")) {
    return "Done. Source strictness is now set to strict.";
  }
  return `I can see your project "${bundle.project.name}" with ${bundle.objects.length} objects. To enable AI-powered chat, add a text model API key to your .env.local file. Supported: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY, or MOONSHOT_API_KEY.`;
}
