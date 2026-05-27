import { createOpenAITextProvider, createOpenAIImageProvider, openaiModels } from "./openai";
import { createAnthropicTextProvider, anthropicModels } from "./anthropic";
import { createGoogleTextProvider, googleModels } from "./google";
import { createGroqTextProvider, groqModels } from "./groq";
import { createMoonshotTextProvider, moonshotModels } from "./moonshot";
import type { ChatCompletionResult, ChatMessage, ImageGenerationResult, ImageProvider, ModelDefinition, TextProvider } from "./types";
import { generateVisual as minimaxGenerateVisual } from "../minimax";

export type AvailableModels = {
  text: ModelDefinition[];
  image: ModelDefinition[];
  vision: ModelDefinition[];
};

const minimaxImageModel: ModelDefinition = {
  id: "minimax-image-01",
  name: "MiniMax Image-01",
  provider: "minimax",
  capabilities: ["image"],
  costTier: "low",
};

export function getAvailableModels(): AvailableModels {
  const all: ModelDefinition[] = [];

  if (process.env.OPENAI_API_KEY) all.push(...openaiModels);
  if (process.env.ANTHROPIC_API_KEY) all.push(...anthropicModels);
  if (process.env.GOOGLE_API_KEY) all.push(...googleModels);
  if (process.env.GROQ_API_KEY) all.push(...groqModels);
  if (process.env.MOONSHOT_API_KEY) all.push(...moonshotModels);
  if (process.env.MINIMAX_API_KEY) all.push(minimaxImageModel);

  return {
    text: all.filter((m) => m.capabilities.includes("text")),
    image: all.filter((m) => m.capabilities.includes("image")),
    vision: all.filter((m) => m.capabilities.includes("vision")),
  };
}

export function getTextProvider(modelId?: string): { provider: TextProvider; model: string } | null {
  const available = getAvailableModels().text;
  if (available.length === 0) return null;

  const target = modelId ? available.find((m) => m.id === modelId) : available[0];
  if (!target) return null;

  switch (target.provider) {
    case "openai":
      return { provider: createOpenAITextProvider(process.env.OPENAI_API_KEY!), model: target.id };
    case "anthropic":
      return { provider: createAnthropicTextProvider(process.env.ANTHROPIC_API_KEY!), model: target.id };
    case "google":
      return { provider: createGoogleTextProvider(process.env.GOOGLE_API_KEY!), model: target.id };
    case "groq":
      return { provider: createGroqTextProvider(process.env.GROQ_API_KEY!), model: target.id };
    case "moonshot":
      return { provider: createMoonshotTextProvider(process.env.MOONSHOT_API_KEY!), model: target.id };
    default:
      return null;
  }
}

export function getImageProvider(modelId?: string): { provider: ImageProvider; model: string } | null {
  const available = getAvailableModels().image;
  if (available.length === 0) return null;

  const target = modelId ? available.find((m) => m.id === modelId) : available[0];
  if (!target) return null;

  switch (target.provider) {
    case "openai":
      return { provider: createOpenAIImageProvider(process.env.OPENAI_API_KEY!), model: target.id };
    case "minimax":
      return { provider: createMinimaxImageProvider(), model: target.id };
    default:
      return null;
  }
}

function createMinimaxImageProvider(): ImageProvider {
  return {
    async generateImage(prompt: string, options = {}): Promise<ImageGenerationResult> {
      const aspectRatio = (options.aspectRatio as "1:1" | "4:3" | "16:9") ?? "16:9";
      const quality = (options.quality as "draft" | "balanced" | "high") ?? "balanced";
      return minimaxGenerateVisual({ title: "generated", prompt, aspectRatio, quality });
    },
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { model?: string; maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<ChatCompletionResult | null> {
  const resolved = getTextProvider(options?.model);
  if (!resolved) return null;
  return resolved.provider.chatCompletion(messages, { ...options, model: resolved.model });
}

export async function generateImage(
  prompt: string,
  options?: { model?: string; aspectRatio?: string; quality?: string }
): Promise<ImageGenerationResult | null> {
  const resolved = getImageProvider(options?.model);
  if (!resolved) return null;
  return resolved.provider.generateImage(prompt, options);
}
