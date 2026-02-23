import { NextResponse } from "next/server";

const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || "58c242c3764c2063094463f95e0b07d2";
const GIST_TOKEN = process.env.GIST_TOKEN;

const GITHUB_API = "https://api.github.com";

interface ChatMessage {
  id: string;
  memberId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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

// 获取对话历史
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    
    const gist = await getGist();
    const chatFile = gist.files["chat.json"];
    
    if (!chatFile) {
      return NextResponse.json([]);
    }
    
    const allChats: ChatMessage[] = JSON.parse(chatFile.content);
    
    if (memberId) {
      const filtered = allChats.filter(m => m.memberId === memberId);
      return NextResponse.json(filtered);
    }
    
    return NextResponse.json(allChats);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json([]);
  }
}

// 发送消息
export async function POST(request: Request) {
  try {
    const body: ChatMessage = await request.json();
    
    const gist = await getGist();
    const existingFiles: Record<string, string> = {};
    
    for (const [name, file] of Object.entries(gist.files as Record<string, { content: string }>)) {
      existingFiles[name] = file.content;
    }
    
    let allChats: ChatMessage[] = [];
    if (existingFiles["chat.json"]) {
      allChats = JSON.parse(existingFiles["chat.json"]);
    }
    
    allChats.push(body);
    
    // 只保留每个成员最近50条消息
    const memberChats = allChats.filter(m => m.memberId === body.memberId);
    if (memberChats.length > 50) {
      const otherChats = allChats.filter(m => m.memberId !== body.memberId);
      const recentChats = memberChats.slice(-50);
      allChats = [...otherChats, ...recentChats];
    }
    
    existingFiles["chat.json"] = JSON.stringify(allChats, null, 2);
    await updateGist(existingFiles);
    
    return NextResponse.json({ success: true, message: body });
  } catch (error) {
    console.error("Error saving chat:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// 清除对话历史
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    
    const gist = await getGist();
    const existingFiles: Record<string, string> = {};
    
    for (const [name, file] of Object.entries(gist.files as Record<string, { content: string }>)) {
      existingFiles[name] = file.content;
    }
    
    if (existingFiles["chat.json"]) {
      let allChats: ChatMessage[] = JSON.parse(existingFiles["chat.json"]);
      
      if (memberId) {
        allChats = allChats.filter(m => m.memberId !== memberId);
      } else {
        allChats = [];
      }
      
      existingFiles["chat.json"] = JSON.stringify(allChats, null, 2);
      await updateGist(existingFiles);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat:", error);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
