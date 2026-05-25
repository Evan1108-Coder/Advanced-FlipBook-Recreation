import { NextResponse } from "next/server";

const maxJsonBytes = 1_000_000;

export function assertLocalRequest(request: Request) {
  if (process.env.LUMEN_ATLAS_ALLOW_REMOTE === "true") return null;
  const host = request.headers.get("host") ?? "";
  const allowed =
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("[::1]:") ||
    host === "localhost" ||
    host === "127.0.0.1";
  return allowed ? null : NextResponse.json({ error: "Advanced FlipBook Recreation API is local-only by default." }, { status: 403 });
}

export async function readJsonBody(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(length) && length > maxJsonBytes) {
    return { error: NextResponse.json({ error: "Request body is too large." }, { status: 413 }) };
  }

  try {
    const text = await request.text();
    if (text.length > maxJsonBytes) {
      return { error: NextResponse.json({ error: "Request body is too large." }, { status: 413 }) };
    }
    return { data: text ? JSON.parse(text) : {} };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }) };
  }
}

export function safeError(error: unknown, fallback = "Request failed") {
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 500 });
}
