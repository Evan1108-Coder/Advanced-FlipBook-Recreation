import type { ChatCompletionResult, ChatMessage, ModelDefinition, TextProvider } from "./types";

export const groqModels: ModelDefinition[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq", capabilities: ["text"], costTier: "free" },
];

export function createGroqTextProvider(apiKey: string): TextProvider {
  return {
    async chatCompletion(messages: ChatMessage[], options = {}): Promise<ChatCompletionResult> {
      const model = options.model ?? "llama-3.3-70b-versatile";
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
      if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
      const json = await response.json();
      return {
        content: json.choices?.[0]?.message?.content ?? "",
        model,
        provider: "groq",
        usage: json.usage ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens } : undefined,
      };
    },
  };
}
