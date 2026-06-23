import type { ChatCompletionResult, ChatMessage, ModelDefinition, TextProvider } from "./types";

export const anthropicModels: ModelDefinition[] = [
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", capabilities: ["text", "vision"], costTier: "medium" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic", capabilities: ["text"], costTier: "low" },
  { id: "claude-sonnet-4-7", name: "Claude Sonnet 4.7", provider: "anthropic", capabilities: ["text", "vision"], costTier: "medium" },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "anthropic", capabilities: ["text", "vision"], costTier: "high" },
];

export function createAnthropicTextProvider(apiKey: string): TextProvider {
  return {
    async chatCompletion(messages: ChatMessage[], options = {}): Promise<ChatCompletionResult> {
      const model = options.model ?? "claude-haiku-4-5";
      const systemMessage = messages.find((m) => m.role === "system");
      const nonSystemMessages = messages.filter((m) => m.role !== "system");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: options.maxTokens ?? 2048,
          ...(systemMessage ? { system: systemMessage.content } : {}),
          messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 12_000),
      });
      if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
      const json = await response.json();
      const textBlock = json.content?.find((b: { type: string }) => b.type === "text");
      return {
        content: textBlock?.text ?? "",
        model,
        provider: "anthropic",
        usage: json.usage ? { promptTokens: json.usage.input_tokens, completionTokens: json.usage.output_tokens } : undefined,
      };
    },
  };
}
