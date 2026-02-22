import { NextResponse } from "next/server";

const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || "58c242c3764c2063094463f95e0b07d2";
const GIST_TOKEN = process.env.GIST_TOKEN;

const GITHUB_API = "https://api.github.com";

interface MemoryDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

async function getGist() {
  const res = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GIST_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error("Failed to fetch gist");
  return res.json();
}

async function updateGist(files: Record<string, string>) {
  const res = await fetch(`${GITHUB_API}/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: { Authorization: `token ${GIST_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  if (!res.ok) throw new Error("Failed to update gist");
  return res.json();
}

export async function GET() {
  try {
    const gist = await getGist();
    const memoryFile = gist.files["memory.json"];
    if (!memoryFile) return NextResponse.json([]);
    const data = JSON.parse(memoryFile.content);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching memory:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body: MemoryDoc[] = await request.json();
    const gist = await getGist();
    const existingFiles: Record<string, string> = {};
    for (const [name, file] of Object.entries(gist.files as Record<string, { content: string }>)) {
      if (name === "memory.json") continue;
      existingFiles[name] = file.content;
    }
    existingFiles["memory.json"] = JSON.stringify(body, null, 2);
    await updateGist(existingFiles);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving memory:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
