export type ModelCapability = "text" | "image" | "vision";

export type ModelDefinition = {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  costTier: "free" | "low" | "medium" | "high";
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionResult = {
  content: string;
  model: string;
  provider: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export type ImageGenerationResult = {
  imageUrl: string;
  provider: string;
};

export interface TextProvider {
  chatCompletion(messages: ChatMessage[], options?: { model?: string; maxTokens?: number; temperature?: number }): Promise<ChatCompletionResult>;
}

export interface ImageProvider {
  generateImage(prompt: string, options?: { aspectRatio?: string; quality?: string }): Promise<ImageGenerationResult>;
}
