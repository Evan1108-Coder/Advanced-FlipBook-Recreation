import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/db";
import { asMode, cleanPrompt } from "@/lib/validation";

export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = cleanPrompt(body.prompt);
  const mode = asMode(body.mode);
  const bundle = createProject({
    name: prompt.slice(0, 68),
    description: `Local visual knowledge workspace generated from: ${prompt}`,
    mode,
    prompt,
    sources: Array.isArray(body.sources)
      ? body.sources
          .filter((source: unknown) => source && typeof source === "object")
          .map((source: Record<string, unknown>) => ({
            title: typeof source.title === "string" ? source.title.slice(0, 120) : "Uploaded source",
            excerpt: typeof source.excerpt === "string" ? source.excerpt.slice(0, 3000) : "Uploaded source attached at project creation.",
            url: typeof source.url === "string" ? source.url : undefined
          }))
      : []
  });
  return NextResponse.json(bundle);
}
