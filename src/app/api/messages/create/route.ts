import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { user_id, conversation_id, draft_text, ai_text } = body as {
    user_id?: string;
    conversation_id?: string;
    draft_text?: string;
    ai_text?: string;
  };

  if (!user_id || !conversation_id || !draft_text) {
    return NextResponse.json(
      { error: "user_id, conversation_id, draft_text required" },
      { status: 400 }
    );
  }

  const { data: msg, error } = await supabaseServer
    .from("messages")
    .insert({
      user_id,
      conversation_id,
      draft_text,
      ai_text: ai_text ?? null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 이벤트 2개 저장
  await supabaseServer.from("events").insert([
    {
      user_id,
      conversation_id,
      message_id: msg.id,
      type: "user_draft",
      payload: { length: draft_text.length },
    },
    {
      user_id,
      conversation_id,
      message_id: msg.id,
      type: "ai_suggestion_shown",
      payload: { has_ai: !!ai_text, ai_length: (ai_text ?? "").length },
    },
  ]);

  return NextResponse.json({ message_id: msg.id });
}
