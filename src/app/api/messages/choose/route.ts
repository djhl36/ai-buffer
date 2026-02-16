import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user_id, conversation_id, message_id, choice } = body as {
    user_id?: string;
    conversation_id?: string;
    message_id?: string;
    choice?: "AI" | "RAW";
  };

  if (!user_id || !conversation_id || !message_id || (choice !== "AI" && choice !== "RAW")) {
    return NextResponse.json({ error: "user_id, conversation_id, message_id, choice required" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("messages")
    .update({ send_choice: choice })
    .eq("id", message_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseServer.from("events").insert({
    user_id,
    conversation_id,
    message_id,
    type: "send_choice",
    payload: { choice },
  });

  return NextResponse.json({ ok: true });
}
