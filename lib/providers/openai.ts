import fs from "node:fs/promises";
import path from "node:path";
import { makeId } from "../id";
import type { ChatCompletionResult, ChatMessage, ImageGenerationResult, ImageProvider, ModelDefinition, TextProvider } from "./types";

export const openaiModels: ModelDefinition[] = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", capabilities: ["text"], costTier: "low" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", capabilities: ["text", "vision"], costTier: "medium" },
  { id: "dall-e-3", name: "DALL-E 3", provider: "openai", capabilities: ["image"], costTier: "medium" },
];

export function createOpenAITextProvider(apiKey: string): TextProvider {
  return {
    async chatCompletion(messages: ChatMessage[], options = {}): Promise<ChatCompletionResult> {
      const model = options.model ?? "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens ?? 2048,
          temperature: options.temperature ?? 0.7,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
      });
      if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
      const json = await response.json();
      return {
        content: json.choices?.[0]?.message?.content ?? "",
        model,
        provider: "openai",
        usage: json.usage ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens } : undefined,
      };
    },
  };
}

export function createOpenAIImageProvider(apiKey: string): ImageProvider {
  return {
    async generateImage(prompt: string, options = {}): Promise<ImageGenerationResult> {
      const size = options.aspectRatio === "16:9" ? "1792x1024" : options.aspectRatio === "4:3" ? "1024x1024" : "1024x1024";
      const quality = options.quality === "high" ? "hd" : "standard";
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "dall-e-3", prompt, size, quality, response_format: "b64_json", n: 1 }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`OpenAI DALL-E error: ${response.status}`);
      const json = await response.json();
      const base64 = json.data?.[0]?.b64_json;
      if (typeof base64 !== "string") throw new Error("DALL-E response missing image data");

      const fileName = `${makeId("dalle")}.png`;
      const filePath = path.join(process.cwd(), "public", "generated", fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, Buffer.from(base64, "base64"));
      return { imageUrl: `/generated/${fileName}`, provider: "dall-e-3" };
    },
  };
}
