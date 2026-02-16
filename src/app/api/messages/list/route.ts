import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const conversation_id = body?.conversation_id as string | undefined;

  if (!conversation_id) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("messages")
    .select("id,draft_text,ai_text,send_choice,created_at")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}
