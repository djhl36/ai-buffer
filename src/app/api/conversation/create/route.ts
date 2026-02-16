console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SERVICE_KEY_PREFIX:", (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 6));

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user_id = body?.user_id as string | undefined;

  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("conversations")
    .insert({ user_id, title: "New conversation" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseServer.from("events").insert({
    user_id,
    conversation_id: data.id,
    type: "session_start",
    payload: {},
  });

  return NextResponse.json({ id: data.id });
}
