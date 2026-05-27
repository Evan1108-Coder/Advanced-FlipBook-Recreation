import { NextResponse } from "next/server";
import { assertLocalRequest, readJsonBody } from "@/lib/api";
import { createProject, listProjects } from "@/lib/db";
import { asMode, cleanPrompt, cleanSettings, safeSourceUrl } from "@/lib/validation";

export async function GET(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data as Record<string, unknown>;
  const prompt = cleanPrompt(body.prompt);
  const mode = asMode(body.mode);
  const bundle = createProject({
    name: prompt.slice(0, 68),
    description: `Local visual knowledge workspace generated from: ${prompt}`,
    mode,
    prompt,
    settings: cleanSettings(body.settings),
    sources: Array.isArray(body.sources)
      ? body.sources
          .slice(0, 12)
          .filter((source: unknown): source is Record<string, unknown> => source !== null && typeof source === "object" && !Array.isArray(source))
          .map((source: Record<string, unknown>) => ({
            title: typeof source.title === "string" ? source.title.slice(0, 120) : "Uploaded source",
            excerpt: typeof source.excerpt === "string" ? source.excerpt.slice(0, 3000) : "Uploaded source attached at project creation.",
            url: safeSourceUrl(source.url)
          }))
      : []
  });
  return NextResponse.json(bundle);
}
