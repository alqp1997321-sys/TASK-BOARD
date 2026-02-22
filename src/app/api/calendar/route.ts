import { NextResponse } from "next/server";

const GIST_ID = "58c242c3764c2063094463f95e0b07d2";
const GIST_TOKEN = process.env.GIST_TOKEN || "";
const CONTENT_FILE = "calendar.json";

export async function GET() {
  if (!GIST_TOKEN) return NextResponse.json({ error: "GIST_TOKEN not configured" }, { status: 500 });
  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `token ${GIST_TOKEN}`, Accept: "application/vnd.github.v3+json" },
    });
    if (!response.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: response.status });
    const data = await response.json();
    const content = data.files?.[CONTENT_FILE]?.content || "[]";
    return NextResponse.json(JSON.parse(content));
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!GIST_TOKEN) return NextResponse.json({ error: "GIST_TOKEN not configured" }, { status: 500 });
  try {
    const items = await request.json();
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: { Authorization: `token ${GIST_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify({ files: { [CONTENT_FILE]: { content: JSON.stringify(items, null, 2) } } }),
    });
    if (!response.ok) return NextResponse.json({ error: "Failed to save" }, { status: response.status });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
