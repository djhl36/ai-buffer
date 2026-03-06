import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type MessageRow = {
  id: string;
  draft_text: string;
  ai_text: string | null;
  send_choice: "AI" | "RAW" | null;
  created_at: string;
};

type EventRow = {
  message_id: string | null;
  type: string;
  feature_type: "emotion" | "situation" | null;
  payload: any;
  created_at: string;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const conversation_id = body?.conversation_id as string | undefined;

  if (!conversation_id) {
    return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
  }

  const { data: messages, error: msgError } = await supabaseServer
    .from("messages")
    .select("id,draft_text,ai_text,send_choice,created_at")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  const { data: events, error: eventError } = await supabaseServer
    .from("events")
    .select("message_id,type,feature_type,payload,created_at")
    .eq("conversation_id", conversation_id)
    .in("type", ["generate", "followup", "delivery_outcome", "post_send_eval"])
    .order("created_at", { ascending: true });

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  const metaMap = new Map<
    string,
    {
      relation: string | null;
      feature_type: "emotion" | "situation" | null;
      sent_status: "send" | "edited_send" | "not_send" | null;
      followup_reaction: "pos" | "neu" | "neg" | null;
    }
  >();

  for (const ev of (events ?? []) as EventRow[]) {
    if (!ev.message_id) continue;

    const prev = metaMap.get(ev.message_id) ?? {
      relation: null,
      feature_type: null,
      sent_status: null,
      followup_reaction: null,
    };

    if (ev.type === "generate") {
      prev.relation = (ev.payload?.relation ?? null) as string | null;
      prev.feature_type = ev.feature_type;
    }

    if (ev.type === "delivery_outcome") {
      prev.sent_status = (ev.payload?.sent ?? null) as "send" | "edited_send" | "not_send" | null;
    }

    if (ev.type === "followup") {
      prev.followup_reaction = (ev.payload?.reaction ?? null) as "pos" | "neu" | "neg" | null;
    }

    metaMap.set(ev.message_id, prev);
  }

  const merged = ((messages ?? []) as MessageRow[]).map((m) => {
    const meta = metaMap.get(m.id);
    return {
      ...m,
      relation: meta?.relation ?? null,
      feature_type: meta?.feature_type ?? null,
      sent_status: meta?.sent_status ?? null,
      followup_reaction: meta?.followup_reaction ?? null,
    };
  });

  return NextResponse.json({ messages: merged });
}