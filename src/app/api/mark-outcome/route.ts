import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const { id, sent_status, followup_reaction } = await req.json();
  const patch = {
    ...(sent_status && { sent_status }),
    ...(followup_reaction && { followup_reaction }),
  };

  const { error } = await supabaseAdmin.from("messages").update(patch).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}