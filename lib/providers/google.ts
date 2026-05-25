import type { ChatCompletionResult, ChatMessage, ModelDefinition, TextProvider } from "./types";

export const googleModels: ModelDefinition[] = [
  { id: "gemini-3-flash", name: "Gemini 3 Flash", provider: "google", capabilities: ["text"], costTier: "low" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "google", capabilities: ["text", "vision"], costTier: "medium" },
];

export function createGoogleTextProvider(apiKey: string): TextProvider {
  return {
    async chatCompletion(messages: ChatMessage[], options = {}): Promise<ChatCompletionResult> {
      const model = options.model ?? "gemini-3-flash";
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const systemInstruction = messages.find((m) => m.role === "system");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } } : {}),
            generationConfig: {
              maxOutputTokens: options.maxTokens ?? 2048,
              temperature: options.temperature ?? 0.7,
            },
          }),
          signal: AbortSignal.timeout(30_000),
        }
      );
      if (!response.ok) throw new Error(`Google AI API error: ${response.status}`);
      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return {
        content: text,
        model,
        provider: "google",
        usage: json.usageMetadata
          ? { promptTokens: json.usageMetadata.promptTokenCount ?? 0, completionTokens: json.usageMetadata.candidatesTokenCount ?? 0 }
          : undefined,
      };
    },
  };
}
