import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user_id, conversation_id, message_id, reaction } = body as {
    user_id?: string;
    conversation_id?: string;
    message_id?: string;
    reaction?: "pos" | "neu" | "neg";
  };

  if (!user_id || !conversation_id || !message_id || !reaction) {
    return NextResponse.json({ error: "user_id, conversation_id, message_id, reaction required" }, { status: 400 });
  }

  const { error } = await supabaseServer.from("events").insert({
    user_id,
    conversation_id,
    message_id,
    type: "followup",
    payload: { reaction },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
