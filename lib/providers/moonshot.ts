import type { ChatCompletionResult, ChatMessage, ModelDefinition, TextProvider } from "./types";

export const moonshotModels: ModelDefinition[] = [
  { id: "kimi-k2-turbo-preview", name: "Kimi K2 Turbo", provider: "moonshot", capabilities: ["text"], costTier: "low" },
  { id: "kimi-k2.5-vision", name: "Kimi K2.5 Vision", provider: "moonshot", capabilities: ["text", "vision"], costTier: "medium" },
];

export function createMoonshotTextProvider(apiKey: string): TextProvider {
  return {
    async chatCompletion(messages: ChatMessage[], options = {}): Promise<ChatCompletionResult> {
      const model = options.model ?? "kimi-k2-turbo-preview";
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens ?? 2048,
          temperature: options.temperature ?? 0.7,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`Moonshot API error: ${response.status}`);
      const json = await response.json();
      return {
        content: json.choices?.[0]?.message?.content ?? "",
        model,
        provider: "moonshot",
        usage: json.usage ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens } : undefined,
      };
    },
  };
}
