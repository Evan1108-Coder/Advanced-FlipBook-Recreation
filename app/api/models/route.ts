import { NextResponse } from "next/server";
import { assertLocalRequest } from "@/lib/api";
import { getAvailableModels } from "@/lib/providers/registry";

export async function GET(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const models = getAvailableModels();
  return NextResponse.json({
    ...models,
    diagnostics: {
      textConfigured: models.text.length > 0,
      imageConfigured: models.image.length > 0,
      timeoutMs: 12_000,
      fallback: "Provider failures use local/template fallbacks so the workspace remains usable."
    }
  });
}
