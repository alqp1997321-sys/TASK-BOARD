import { NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8358868290:AAG4KaUIm7rrbZZQEIFBcfHKNZHLwqMAtT4";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function POST(request: Request) {
  try {
    const { chatId, text } = await request.json();
    
    if (!chatId || !text) {
      return NextResponse.json({ error: "Missing chatId or text" }, { status: 400 });
    }
    
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
    
    const data = await res.json();
    
    if (!data.ok) {
      console.error("Telegram API error:", data);
      return NextResponse.json({ error: data.description }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, messageId: data.result.message_id });
  } catch (error) {
    console.error("Error sending telegram:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
