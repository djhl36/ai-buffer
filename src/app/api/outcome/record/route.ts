import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const { user_id, conversation_id, message_id, feature_type, sent } = body as {
    user_id?: string;
    conversation_id?: string;
    message_id?: string;
    feature_type?: "emotion" | "situation";
    sent?: "send" | "edited_send" | "not_send";
  };

  if (
    !user_id ||
    !conversation_id ||
    !message_id ||
    !feature_type ||
    !["send", "edited_send", "not_send"].includes(sent ?? "")
  ) {
    return NextResponse.json(
      { error: "user_id, conversation_id, message_id, feature_type, sent required" },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer.from("events").insert({
    user_id,
    conversation_id,
    message_id,
    type: "delivery_outcome",
    feature_type,
    payload: { sent },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}