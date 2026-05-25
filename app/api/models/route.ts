import { NextResponse } from "next/server";
import { assertLocalRequest } from "@/lib/api";
import { getAvailableModels } from "@/lib/providers/registry";

export async function GET(request: Request) {
  const blocked = assertLocalRequest(request);
  if (blocked) return blocked;
  return NextResponse.json(getAvailableModels());
}
