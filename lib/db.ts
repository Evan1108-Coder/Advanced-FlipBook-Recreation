import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { defaultProjectSettings } from "./defaults";
import { makeId, nowIso } from "./id";
import { mergeSettings, safeSourceUrl } from "./validation";
import type {
  CanvasObject,
  ChatMessage,
  MemoryItem,
  Mode,
  Project,
  ProjectBundle,
  ProjectSettings,
  Source
} from "./types";

const configuredDbPath = process.env.LUMEN_ATLAS_DB_PATH ?? "./data/lumen-atlas.db";
const resolvedDbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), configuredDbPath);
const dbPath =
  resolvedDbPath.startsWith(process.cwd()) || process.env.LUMEN_ATLAS_ALLOW_EXTERNAL_DB_PATH === "true"
    ? resolvedDbPath
    : path.join(process.cwd(), "data", "lumen-atlas.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_settings (
    project_id TEXT PRIMARY KEY,
    settings_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS objects (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    parent_id TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    label TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    excerpt TEXT NOT NULL,
    quality TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    text TEXT NOT NULL,
    pinned INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    object_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(object_id) REFERENCES objects(id) ON DELETE CASCADE
  );
`);

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  mode: Mode;
  created_at: string;
  updated_at: string;
};

type ObjectRow = {
  id: string;
  project_id: string;
  type: CanvasObject["type"];
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parent_id: string | null;
  payload_json: string;
  created_at: string;
  updated_at: string;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    mode: row.mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapObject(row: ObjectRow): CanvasObject {
  const payload = safeParseObject(row.payload_json, { status: "corrupt", body: "This object payload was corrupt and could not be loaded." });
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    title: row.title,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    parentId: row.parent_id,
    payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listProjects(): Project[] {
  return db
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all()
    .map((row) => mapProject(row as ProjectRow));
}

export function getProjectBundle(projectId: string): ProjectBundle | null {
  const projectRow = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as ProjectRow | undefined;
  if (!projectRow) return null;

  const settingsRow = db
    .prepare("SELECT settings_json FROM project_settings WHERE project_id = ?")
    .get(projectId) as { settings_json: string } | undefined;

  const objects = db
    .prepare("SELECT * FROM objects WHERE project_id = ? ORDER BY created_at ASC")
    .all(projectId)
    .map((row) => mapObject(row as ObjectRow));
  const versionRows = db.prepare("SELECT object_id, created_at FROM versions WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as Array<{
    object_id: string;
    created_at: string;
  }>;
  const versionMap = versionRows.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.object_id] ??= [];
    acc[row.object_id].push(`Restore point from ${new Date(row.created_at).toLocaleString()}`);
    return acc;
  }, {});
  objects.forEach((object) => {
    if (versionMap[object.id]) object.payload = { ...object.payload, versions: versionMap[object.id] };
  });

  const connections = db.prepare("SELECT * FROM connections WHERE project_id = ? ORDER BY created_at ASC").all(projectId) as Array<{
    id: string;
    project_id: string;
    from_id: string;
    to_id: string;
    label?: string;
    created_at: string;
  }>;

  const sources = db.prepare("SELECT * FROM sources WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as Array<{
    id: string;
    project_id: string;
    title: string;
    url?: string;
    excerpt: string;
    quality: Source["quality"];
    created_at: string;
  }>;

  const memory = db.prepare("SELECT * FROM memory_items WHERE project_id = ? ORDER BY pinned DESC, created_at DESC").all(projectId) as Array<{
    id: string;
    project_id: string;
    kind: MemoryItem["kind"];
    text: string;
    pinned: 0 | 1;
    created_at: string;
  }>;

  const chat = db.prepare("SELECT * FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC").all(projectId) as Array<{
    id: string;
    project_id: string;
    role: ChatMessage["role"];
    content: string;
    created_at: string;
  }>;

  return {
    project: mapProject(projectRow),
    settings: settingsRow ? mergeSettings(safeParseObject(settingsRow.settings_json, defaultProjectSettings)) : defaultProjectSettings,
    objects,
    connections: connections.map((connection) => ({
      id: connection.id,
      projectId: connection.project_id,
      fromId: connection.from_id,
      toId: connection.to_id,
      label: connection.label,
      createdAt: connection.created_at
    })),
    sources: sources.map((source) => ({
      id: source.id,
      projectId: source.project_id,
      title: source.title,
      url: safeSourceUrl(source.url),
      excerpt: source.excerpt,
      quality: source.quality,
      createdAt: source.created_at
    })),
    memory: memory.map((item) => ({
      id: item.id,
      projectId: item.project_id,
      kind: item.kind,
      text: item.text,
      pinned: Boolean(item.pinned),
      createdAt: item.created_at
    })),
    chat: chat.map((message) => ({
      id: message.id,
      projectId: message.project_id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at
    }))
  };
}

export function createProject(input: {
  name: string;
  description: string;
  mode: Mode;
  prompt: string;
  sources?: Array<{ title: string; excerpt: string; url?: string }>;
  settings?: Partial<ProjectSettings>;
}): ProjectBundle {
  const id = makeId("project");
  const rootId = makeId("level");
  const now = nowIso();
  const title = input.name.trim() || input.prompt.trim() || "Untitled Atlas";
  const modeSpec = modeContent(input.mode, title);

  const create = db.transaction(() => {
    db.prepare("INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      title,
      input.description || `Visual knowledge workspace for ${title}.`,
      input.mode,
      now,
      now
    );
    const projectSettings = mergeSettings({ ...defaultProjectSettings, ...input.settings });
    db.prepare("INSERT INTO project_settings VALUES (?, ?, ?)").run(id, JSON.stringify(projectSettings), now);
    insertObject({
      id: rootId,
      projectId: id,
      type: modeSpec.type,
      title,
      x: 40,
      y: 110,
      width: 380,
      height: 254,
      parentId: null,
      payload: {
        depth: 0,
        mode: input.mode,
        prompt: input.prompt,
        summary: modeSpec.summary,
        transcript: modeSpec.transcript,
        claims: modeSpec.claims,
        questions: modeSpec.questions,
        imageUrl: placeholderImage(title, input.mode),
        hotspots: [
          { label: "Definition", x: 0.22, y: 0.26 },
          { label: "Mechanism", x: 0.62, y: 0.34 },
          { label: "Examples", x: 0.42, y: 0.72 }
        ],
        status: "ready",
        provider: "local-placeholder"
      },
      createdAt: now,
      updatedAt: now
    });
    addMemory(id, "summary", `Project started around ${title}.`, true);
    if (input.sources?.length) {
      input.sources.slice(0, 12).forEach((source) =>
        addSource(id, {
          title: source.title,
          excerpt: source.excerpt,
          url: safeSourceUrl(source.url),
          quality: "ok"
        })
      );
    } else {
      addSource(id, {
        title: "Starter source placeholder",
        excerpt: "Add or import sources to make claims and transcripts fully evidence-backed.",
        quality: "draft"
      });
    }
  });

  create();
  return getProjectBundle(id)!;
}

export function updateProjectSettings(projectId: string, settings: Partial<ProjectSettings>) {
  const bundle = getProjectBundle(projectId);
  if (!bundle) return null;
  const merged = mergeSettings({ ...bundle.settings, ...settings });
  db.prepare("UPDATE project_settings SET settings_json = ?, updated_at = ? WHERE project_id = ?").run(
    JSON.stringify(merged),
    nowIso(),
    projectId
  );
  touchProject(projectId);
  return merged;
}

export function insertObject(object: CanvasObject) {
  db.prepare("INSERT INTO objects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    object.id,
    object.projectId,
    object.type,
    object.title,
    object.x,
    object.y,
    object.width,
    object.height,
    object.parentId ?? null,
    JSON.stringify(object.payload),
    object.createdAt,
    object.updatedAt
  );
}

export function updateObjectFrame(projectId: string, objectId: string, frame: { x?: number; y?: number; width?: number; height?: number }) {
  const current = db.prepare("SELECT * FROM objects WHERE project_id = ? AND id = ?").get(projectId, objectId) as ObjectRow | undefined;
  if (!current) return null;
  const next = {
    x: frame.x ?? current.x,
    y: frame.y ?? current.y,
    width: frame.width ?? current.width,
    height: frame.height ?? current.height
  };
  db.prepare("UPDATE objects SET x = ?, y = ?, width = ?, height = ?, updated_at = ? WHERE project_id = ? AND id = ?").run(
    next.x,
    next.y,
    next.width,
    next.height,
    nowIso(),
    projectId,
    objectId
  );
  touchProject(projectId);
  return getProjectBundle(projectId);
}

export function updateObjectPayload(
  projectId: string,
  objectId: string,
  payloadPatch: Record<string, unknown>,
  title?: string
) {
  const current = db.prepare("SELECT * FROM objects WHERE project_id = ? AND id = ?").get(projectId, objectId) as ObjectRow | undefined;
  if (!current) return null;
  const snapshotId = makeId("version");
  const now = nowIso();
  const currentPayload = safeParseObject(current.payload_json, {});
  const nextPayload = { ...currentPayload, ...payloadPatch };
  const update = db.transaction(() => {
    db.prepare("INSERT INTO versions VALUES (?, ?, ?, ?, ?)").run(snapshotId, projectId, objectId, JSON.stringify(mapObject(current)), now);
    db.prepare("UPDATE objects SET title = ?, payload_json = ?, updated_at = ? WHERE project_id = ? AND id = ?").run(
      title ?? current.title,
      JSON.stringify(nextPayload),
      now,
      projectId,
      objectId
    );
    touchProject(projectId);
  });
  update();
  return getProjectBundle(projectId);
}

export function addConnection(projectId: string, fromId: string, toId: string, label?: string) {
  db.prepare("INSERT INTO connections VALUES (?, ?, ?, ?, ?, ?)").run(makeId("connection"), projectId, fromId, toId, label ?? null, nowIso());
}

export function addSource(projectId: string, input: { title: string; excerpt: string; quality?: Source["quality"]; url?: string }) {
  db.prepare("INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    makeId("source"),
    projectId,
    input.title,
    safeSourceUrl(input.url) ?? null,
    input.excerpt,
    input.quality ?? "ok",
    nowIso()
  );
  touchProject(projectId);
  return getProjectBundle(projectId);
}

export function addMemory(projectId: string, kind: MemoryItem["kind"], text: string, pinned = false) {
  db.prepare("INSERT INTO memory_items VALUES (?, ?, ?, ?, ?, ?)").run(makeId("memory"), projectId, kind, text, pinned ? 1 : 0, nowIso());
}

export function addChatMessage(projectId: string, role: ChatMessage["role"], content: string) {
  db.prepare("INSERT INTO chat_messages VALUES (?, ?, ?, ?, ?)").run(makeId("chat"), projectId, role, content, nowIso());
  touchProject(projectId);
}

export function createChildLevel(input: {
  projectId: string;
  parentId: string;
  clickX: number;
  clickY: number;
  title: string;
  summary: string;
  imageUrl: string;
  transcript: string;
  provider: string;
  remember?: boolean;
}) {
  const parent = db.prepare("SELECT * FROM objects WHERE project_id = ? AND id = ?").get(input.projectId, input.parentId) as ObjectRow | undefined;
  if (!parent) return null;
  const siblingCount = db.prepare("SELECT COUNT(*) as count FROM objects WHERE parent_id = ?").get(input.parentId) as { count: number };
  const now = nowIso();
  const parentPayload = safeParseObject(parent.payload_json, {});
  const child: CanvasObject = {
    id: makeId("level"),
    projectId: input.projectId,
    type: "level",
    title: input.title,
    x: parent.x + parent.width + 180,
    y: parent.y + siblingCount.count * 330 - 80,
    width: 420,
    height: 280,
    parentId: input.parentId,
    payload: {
      depth: Number(parentPayload.depth ?? 0) + 1,
      click: { x: input.clickX, y: input.clickY },
      summary: input.summary,
      transcript: input.transcript,
      claims: [
        `This branch explains ${input.title} in the context of ${parent.title}.`,
        "Source support should be reviewed before using this as a final citation."
      ],
      questions: [`How does ${input.title} connect back to ${parent.title}?`, `What evidence would make this branch stronger?`],
      imageUrl: input.imageUrl,
      hotspots: [
        { label: "Structure", x: 0.26, y: 0.32 },
        { label: "Evidence", x: 0.7, y: 0.42 },
        { label: "Application", x: 0.48, y: 0.74 }
      ],
      status: "ready",
      provider: input.provider
    },
    createdAt: now,
    updatedAt: now
  };
  insertObject(child);
  addConnection(input.projectId, input.parentId, child.id, "explore");
  if (input.remember !== false) addMemory(input.projectId, "fact", `Explored ${input.title} from ${parent.title}.`);
  touchProject(input.projectId);
  return getProjectBundle(input.projectId);
}

export function createProjectRootObject(projectId: string, title = "New Flipbook") {
  const bundle = getProjectBundle(projectId);
  if (!bundle) return null;
  const now = nowIso();
  const count = bundle.objects.filter((object) => !object.parentId).length;
  const spec = modeContent("flipbook", title);
  insertObject({
    id: makeId("level"),
    projectId,
    type: "level",
    title,
    x: 40 + count * 80,
    y: 110 + count * 80,
    width: 380,
    height: 254,
    parentId: null,
    payload: {
      depth: 0,
      mode: "flipbook",
      summary: spec.summary,
      transcript: spec.transcript,
      claims: spec.claims,
      questions: spec.questions,
      imageUrl: placeholderImage(title, "flipbook"),
      status: "ready",
      provider: "local-placeholder"
    },
    createdAt: now,
    updatedAt: now
  });
  touchProject(projectId);
  return getProjectBundle(projectId);
}

export function createToolResult(input: { projectId: string; fromId: string; tool: string; prompt?: string }) {
  const parent = db.prepare("SELECT * FROM objects WHERE project_id = ? AND id = ?").get(input.projectId, input.fromId) as ObjectRow | undefined;
  if (!parent) return null;
  const now = nowIso();
  const payload = safeParseObject(parent.payload_json, {});
  const title = `${input.tool} · ${parent.title}`;
  const toolPayload = buildToolPayload(input.tool, parent.title, String(payload.summary ?? ""), input.prompt);
  const object: CanvasObject = {
    id: makeId(input.tool === "Ask" ? "ask" : "tool"),
    projectId: input.projectId,
    type: input.tool === "Ask" ? "ask" : "tool_result",
    title,
    x: parent.x + 80,
    y: parent.y + parent.height + 130,
    width: 360,
    height: 220,
    parentId: input.fromId,
    payload: {
      ...toolPayload,
      status: "ready"
    },
    createdAt: now,
    updatedAt: now
  };
  insertObject(object);
  addConnection(input.projectId, input.fromId, object.id, input.tool);
  touchProject(input.projectId);
  return getProjectBundle(input.projectId);
}

export function deleteObject(projectId: string, objectId: string, confirmed = false) {
  const bundle = getProjectBundle(projectId);
  if (!bundle) return null;
  const target = bundle.objects.find((object) => object.id === objectId);
  if (!target) return null;
  const descendants = new Set<string>();
  const visit = (id: string) => {
    bundle.objects.filter((object) => object.parentId === id).forEach((child) => {
      descendants.add(child.id);
      visit(child.id);
    });
  };
  if (bundle.settings.deleteBehavior === "ask" && !confirmed) return null;
  if (bundle.settings.deleteBehavior === "delete-descendants") visit(objectId);
  const ids = [objectId, ...descendants];
  const deleteMany = db.transaction(() => {
    if (bundle.settings.deleteBehavior === "detach-descendants" || bundle.settings.deleteBehavior === "preserve-orphans") {
      const children = bundle.objects.filter((object) => object.parentId === objectId);
      children.forEach((child, index) => {
        db.prepare("UPDATE objects SET parent_id = NULL, x = ?, y = ?, updated_at = ? WHERE project_id = ? AND id = ?").run(
          target.x + (index + 1) * 48,
          target.y + target.height + 120 + index * 42,
          nowIso(),
          projectId,
          child.id
        );
      });
    }
    ids.forEach((id) => {
      db.prepare("DELETE FROM connections WHERE project_id = ? AND (from_id = ? OR to_id = ?)").run(projectId, id, id);
      db.prepare("DELETE FROM versions WHERE project_id = ? AND object_id = ?").run(projectId, id);
      db.prepare("DELETE FROM objects WHERE project_id = ? AND id = ?").run(projectId, id);
    });
  });
  ids.forEach((id) => {
    const object = bundle.objects.find((item) => item.id === id);
    if (object) removeGeneratedAsset(object.payload.imageUrl);
  });
  deleteMany();
  touchProject(projectId);
  return getProjectBundle(projectId);
}

export function placeholderImage(title: string, mode: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#fff8df"/>
        <stop offset="0.58" stop-color="#f6df8f"/>
        <stop offset="1" stop-color="#c7852f"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" rx="34" fill="url(#paper)"/>
    <circle cx="156" cy="138" r="74" fill="#ffffff" opacity=".55"/>
    <circle cx="806" cy="392" r="112" fill="#5c6f52" opacity=".18"/>
    <path d="M110 398 C230 302 334 338 450 242 C572 141 728 180 850 88" fill="none" stroke="#3d3524" stroke-width="12" opacity=".22" stroke-linecap="round"/>
    <rect x="76" y="70" width="808" height="400" rx="28" fill="#fffaf0" opacity=".66"/>
    <text x="112" y="154" font-family="Arial, sans-serif" font-size="28" fill="#4b3921">${escapeSvg(mode.toUpperCase())}</text>
    <text x="112" y="234" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#2f2619">${escapeSvg(compactTitle(title))}</text>
    <text x="112" y="304" font-family="Arial, sans-serif" font-size="26" fill="#5b4a30">Generated visual learning page</text>
    <text x="112" y="352" font-family="Arial, sans-serif" font-size="22" fill="#6d5b3b">Click regions to branch into connected levels.</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeSvg(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function compactTitle(value: string) {
  const clean = Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 28 ? `${clean.slice(0, 27)}\u2026` : clean;
}

function safeParseObject(value: string, fallback: Record<string, unknown>) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : fallback;
  } catch {
    return fallback;
  }
}

function modeContent(mode: Mode, title: string): Pick<CanvasObject, "type"> & {
  summary: string;
  transcript: string;
  claims: string[];
  questions: string[];
} {
  const labels: Record<Mode, { type: CanvasObject["type"]; summary: string; transcript: string }> = {
    flipbook: {
      type: "level",
      summary: `A branching visual starting point for ${title}.`,
      transcript: `This Flipbook level introduces ${title}. Double-click a visual region to branch deeper, or use tools for explanations and checks.`
    },
    textbook: {
      type: "level",
      summary: `A textbook-style visual explanation of ${title}.`,
      transcript: `This page organizes ${title} into a definition, core mechanism, example, and source-check area.`
    },
    "knowledge-map": {
      type: "map",
      summary: `A concept map for ${title}.`,
      transcript: `This map separates central concepts, dependencies, examples, and open questions for ${title}.`
    },
    timeline: {
      type: "timeline",
      summary: `A chronological learning view for ${title}.`,
      transcript: `This timeline frames ${title} as stages, causes, transitions, and outcomes.`
    },
    compare: {
      type: "tool_result",
      summary: `A comparison workspace for ${title}.`,
      transcript: `This comparison highlights similarities, differences, tradeoffs, and evidence gaps around ${title}.`
    },
    "study-guide": {
      type: "tool_result",
      summary: `A study guide for ${title}.`,
      transcript: `This guide includes a summary, key terms, review questions, and checks for understanding.`
    },
    "source-brief": {
      type: "source",
      summary: `A source brief for ${title}.`,
      transcript: `This brief tracks claims, evidence quality, source gaps, and what should be verified next.`
    },
    presentation: {
      type: "export",
      summary: `A presentation outline for ${title}.`,
      transcript: `This sequence turns ${title} into an opening, three teaching beats, and a closing review.`
    }
  };
  const spec = labels[mode];
  return {
    ...spec,
    claims: [`${title} needs source review before final use.`, `${spec.summary}`],
    questions: [`What is the central idea of ${title}?`, `Which source would best support this page?`]
  };
}

function buildToolPayload(tool: string, parentTitle: string, parentSummary: string, prompt?: string) {
  const question = prompt?.trim();
  const base = parentSummary || `Context from ${parentTitle}.`;
  const outputs: Record<string, Record<string, unknown>> = {
    Ask: {
      tool,
      prompt: question ?? "",
      body: question
        ? `Answer to "${question}": Based on ${parentTitle}, the strongest current explanation is: ${base} Add sources to strengthen this answer.`
        : "Ask a focused question about this object. The answer will use project memory, sources, and the selected context.",
      claims: question ? [`The answer is grounded in the selected object: ${parentTitle}.`] : [],
      questions: []
    },
    Learn: {
      tool,
      prompt: question ?? "",
      body: `Learn: ${parentTitle}. Core idea: ${base} Key terms, common misunderstandings, and next exploration paths are separated for review.`,
      claims: [`${parentTitle} can be taught through definition, mechanism, example, and evidence.`],
      questions: [`Can you explain ${parentTitle} in one sentence?`, `What example makes it concrete?`]
    },
    Analysis: {
      tool,
      body: `Analysis: ${parentTitle}. Break the idea into assumptions, mechanisms, constraints, evidence gaps, and implications.`,
      claims: [`${parentTitle} has assumptions that should be made explicit.`],
      questions: [`Which assumption is weakest?`]
    },
    Compare: {
      tool,
      body: `Compare: Use ${parentTitle} as the baseline. Add another object or source to complete similarities, differences, and tradeoffs.`,
      claims: [],
      questions: [`What should ${parentTitle} be compared against?`]
    },
    Timeline: {
      tool,
      body: `Timeline: ${parentTitle} can be organized into origin, development, turning points, current state, and future questions.`,
      claims: [],
      questions: [`Which event changed the path most?`]
    },
    Export: {
      tool,
      body: `Export package ready: selected object summary, transcript, claims, source list, and branch outline can be copied from this box.`,
      exportFormats: ["Markdown", "Transcript", "Source list"],
      claims: [],
      questions: []
    }
  };
  return outputs[tool] ?? {
    tool,
    prompt: question ?? "",
    body: `${tool}: ${base}`,
    claims: [],
    questions: []
  };
}

function removeGeneratedAsset(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/generated/")) return;
  const filePath = path.join(process.cwd(), "public", value);
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // Best-effort cleanup; DB deletion should not fail because a generated file is already gone.
  }
}

function touchProject(projectId: string) {
  db.prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(nowIso(), projectId);
}
