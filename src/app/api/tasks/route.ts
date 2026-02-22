import { NextResponse } from "next/server";

const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || "58c242c3764c2063094463f95e0b07d2";
const GIST_TOKEN = process.env.GIST_TOKEN || "";

export async function GET() {
  if (!GIST_TOKEN) {
    return NextResponse.json({ error: "GIST_TOKEN not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from GitHub" }, { status: response.status });
    }

    const data = await response.json();
    const content = data.files?.["tasks.json"]?.content || "[]";
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!GIST_TOKEN) {
    return NextResponse.json({ error: "GIST_TOKEN not configured" }, { status: 500 });
  }

  try {
    const tasks = await request.json();

    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${GIST_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: {
          "tasks.json": {
            content: JSON.stringify(tasks, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to save to GitHub" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
