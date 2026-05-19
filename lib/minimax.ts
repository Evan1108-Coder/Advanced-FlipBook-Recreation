import fs from "node:fs/promises";
import path from "node:path";
import { makeId } from "./id";
import { placeholderImage } from "./db";

type GenerateImageInput = {
  title: string;
  prompt: string;
  aspectRatio: "1:1" | "4:3" | "16:9";
  quality: "draft" | "balanced" | "high";
};

export async function generateVisual(input: GenerateImageInput): Promise<{ imageUrl: string; provider: string }> {
  if (!process.env.MINIMAX_API_KEY) {
    return { imageUrl: placeholderImage(input.title, "local"), provider: "local-placeholder" };
  }

  const endpoint = process.env.MINIMAX_IMAGE_ENDPOINT ?? "https://api.minimax.io/v1/image_generation";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "image-01",
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio,
      response_format: "base64",
      n: 1,
      prompt_optimizer: input.quality !== "draft"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MiniMax image generation failed: ${response.status} ${text.slice(0, 220)}`);
  }

  const json = await response.json();
  const base64 = json?.data?.image_base64?.[0];
  if (!base64) {
    throw new Error("MiniMax response did not include data.image_base64[0].");
  }

  const fileName = `${makeId("minimax")}.jpeg`;
  const filePath = path.join(process.cwd(), "public", "generated", fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.from(base64, "base64"));
  return { imageUrl: `/generated/${fileName}`, provider: "minimax-image-01" };
}

export function buildGenerationPrompt(input: {
  topic: string;
  parentTitle?: string;
  clickX?: number;
  clickY?: number;
  memory?: string[];
}) {
  const clickHint =
    typeof input.clickX === "number" && typeof input.clickY === "number"
      ? `The user clicked around ${Math.round(input.clickX * 100)}% from the left and ${Math.round(input.clickY * 100)}% from the top of the parent visual.`
      : "";
  const memoryHint = input.memory?.length ? `Project memory: ${input.memory.join(" | ")}` : "";
  return [
    "Create a mature professional educational visual page for an AI visual encyclopedia.",
    "Use warm ivory and muted yellow tones, clean composition, source-aware explainer style, and legible visual hierarchy.",
    "Do not rely on tiny text inside the image; leave text-like areas as large readable labels only.",
    input.parentTitle ? `Parent page: ${input.parentTitle}.` : "",
    `New focus topic: ${input.topic}.`,
    clickHint,
    memoryHint
  ]
    .filter(Boolean)
    .join(" ");
}
